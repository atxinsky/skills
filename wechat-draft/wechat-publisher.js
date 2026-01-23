const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const marked = require('marked');

class WechatPublisher {
  constructor(appId, appSecret) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.accessToken = null;
    this.tokenExpireTime = 0;
  }

  /**
   * 获取 access_token
   */
  async getAccessToken() {
    const now = Date.now();

    // Token有效期内，直接返回
    if (this.accessToken && now < this.tokenExpireTime) {
      return this.accessToken;
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;

    const response = await axios.get(url);

    if (response.data.errcode) {
      throw new Error(`获取access_token失败: ${response.data.errmsg}`);
    }

    this.accessToken = response.data.access_token;
    // 提前5分钟过期
    this.tokenExpireTime = now + (response.data.expires_in - 300) * 1000;

    return this.accessToken;
  }

  /**
   * 上传图片到公众号素材库（永久素材）
   */
  async uploadImage(imagePath) {
    const token = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;

    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));

    const response = await axios.post(url, form, {
      headers: form.getHeaders(),
    });

    if (response.data.errcode) {
      throw new Error(`图片上传失败: ${response.data.errmsg}`);
    }

    return response.data.media_id;
  }

  /**
   * Markdown → 公众号HTML转换
   */
  markdownToWechatHTML(markdown, mediaIds = {}) {
    // 配置marked
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    let html = marked.parse(markdown);

    // 替换图片路径为media_id
    Object.keys(mediaIds).forEach((imagePath) => {
      const mediaId = mediaIds[imagePath];
      const imgTag = `<img src="https://mmbiz.qpic.cn/mmbiz_png/${mediaId}/0?wx_fmt=png" />`;
      html = html.replace(new RegExp(`<img.*?src="${imagePath}".*?>`, 'g'), imgTag);
    });

    // 美化代码块
    html = html.replace(
      /<pre><code class="language-(\w+)">(.*?)<\/code><\/pre>/gs,
      (match, lang, code) => {
        return `
          <section style="background: #f6f8fa; border-radius: 4px; padding: 16px; margin: 16px 0; overflow-x: auto;">
            <p style="margin: 0; font-size: 12px; color: #586069; margin-bottom: 8px;">语言: ${lang}</p>
            <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.5; color: #24292e; white-space: pre-wrap; word-wrap: break-word;">${code}</pre>
          </section>
        `;
      }
    );

    // 美化引用块
    html = html.replace(
      /<blockquote>(.*?)<\/blockquote>/gs,
      (match, content) => {
        return `
          <section style="border-left: 4px solid #1890ff; background: #f0f7ff; padding: 12px 16px; margin: 16px 0;">
            ${content}
          </section>
        `;
      }
    );

    // 美化标题
    html = html.replace(/<h2>(.*?)<\/h2>/g, '<h2 style="font-size: 20px; font-weight: bold; margin: 24px 0 12px; color: #1a1a1a; border-bottom: 2px solid #1890ff; padding-bottom: 8px;">$1</h2>');
    html = html.replace(/<h3>(.*?)<\/h3>/g, '<h3 style="font-size: 18px; font-weight: bold; margin: 20px 0 10px; color: #333;">$1</h3>');

    // 美化段落
    html = html.replace(/<p>(.*?)<\/p>/g, '<p style="font-size: 16px; line-height: 1.8; margin: 12px 0; color: #333;">$1</p>');

    // 美化表格
    html = html.replace(/<table>/g, '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">');
    html = html.replace(/<th>/g, '<th style="border: 1px solid #ddd; padding: 12px; background: #f5f5f5; font-weight: bold;">');
    html = html.replace(/<td>/g, '<td style="border: 1px solid #ddd; padding: 12px;">');

    return html;
  }

  /**
   * 提取Markdown中的图片路径
   */
  extractImages(markdown) {
    const imgRegex = /!\[.*?\]\((.*?)\)/g;
    const images = [];
    let match;

    while ((match = imgRegex.exec(markdown)) !== null) {
      images.push(match[1]);
    }

    return images;
  }

  /**
   * 提取文章标题
   */
  extractTitle(markdown) {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : '未命名文章';
  }

  /**
   * 创建草稿
   */
  async createDraft(title, content, thumbMediaId) {
    const token = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;

    const data = {
      articles: [
        {
          title: title,
          author: '',
          digest: '',
          content: content,
          content_source_url: '',
          thumb_media_id: thumbMediaId,
          need_open_comment: 0,
          only_fans_can_comment: 0,
        },
      ],
    };

    const response = await axios.post(url, data);

    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`创建草稿失败: ${response.data.errmsg}`);
    }

    return response.data.media_id;
  }

  /**
   * 使用 Google AI 生成封面图（纯 AI，不使用 Canvas）
   *
   * 注意：目前 Google 的免费图片生成 API 有限制：
   * - Imagen 4: 需要付费账户
   * - Gemini 2.0 Flash: 不支持图片生成
   *
   * 如果 API 不可用，返回 null（不生成封面）
   */
  async generateCoverWithAI(markdownPath, title, outputDir) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ GOOGLE_AI_API_KEY 未设置，跳过封面生成');
      return null;
    }

    console.log('⚠️ Google AI 图片生成需要付费账户，跳过封面生成');
    console.log('💡 建议：手动提供封面图，或不使用封面');
    return null;

    // 未来如果有可用的免费图片生成 API，可以在这里实现
  }

  /**
   * 主流程：发布文章到草稿箱
   */
  async publishToDraft(markdownPath, coverImagePath = null, options = {}) {
    const { useNotebookLM = true } = options;
    console.log('📖 读取文章...');
    const markdown = fs.readFileSync(markdownPath, 'utf-8');

    console.log('📝 提取标题...');
    const title = this.extractTitle(markdown);

    console.log('🖼️ 提取图片...');
    const imagePaths = this.extractImages(markdown);

    // 生成或添加封面图
    if (!coverImagePath && useNotebookLM) {
      console.log('🎨 尝试 AI 封面生成...');
      const outputDir = path.dirname(markdownPath);
      const generatedCover = await this.generateCoverWithAI(
        markdownPath,
        title,
        outputDir
      );

      if (generatedCover) {
        coverImagePath = generatedCover;
        console.log('✅ AI 封面生成成功:', generatedCover);
      } else {
        console.log('ℹ️ 继续发布（无封面）');
      }
    }

    // 添加封面图到图片列表
    if (coverImagePath && !imagePaths.includes(coverImagePath)) {
      imagePaths.unshift(coverImagePath);
    }

    console.log(`📤 上传图片 (${imagePaths.length}张)...`);
    const mediaIds = {};
    let thumbMediaId = null;

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      console.log(`  [${i + 1}/${imagePaths.length}] ${imagePath}`);

      // 相对路径转绝对路径
      const absolutePath = path.isAbsolute(imagePath)
        ? imagePath
        : path.resolve(path.dirname(markdownPath), imagePath);

      if (!fs.existsSync(absolutePath)) {
        console.warn(`  ⚠️ 图片不存在: ${absolutePath}`);
        continue;
      }

      const mediaId = await this.uploadImage(absolutePath);
      mediaIds[imagePath] = mediaId;

      // 第一张图作为封面
      if (i === 0) {
        thumbMediaId = mediaId;
      }
    }

    console.log('🔄 转换格式...');
    const html = this.markdownToWechatHTML(markdown, mediaIds);

    console.log('✅ 创建草稿...');
    const draftId = await this.createDraft(title, html, thumbMediaId);

    const draftUrl = `https://mp.weixin.qq.com/cgi-bin/draft?t=draft/list&action=edit&draft_id=${draftId}`;

    return {
      success: true,
      title,
      draftId,
      draftUrl,
      imagesUploaded: Object.keys(mediaIds).length,
    };
  }
}

module.exports = WechatPublisher;

// ========== CLI 入口 ==========
if (require.main === module) {
  const args = process.argv.slice(2);
  const markdownPath = args[0];
  let coverImagePath = null;
  let useNotebookLM = true;

  // 解析参数
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--no-notebooklm') {
      useNotebookLM = false;
    } else if (args[i] === '--canvas-only') {
      useNotebookLM = false;
    } else if (!coverImagePath) {
      coverImagePath = args[i];
    }
  }

  if (!markdownPath) {
    console.error('用法: node wechat-publisher.js <文章路径> [封面图路径]');
    console.error('\n示例:');
    console.error('  node wechat-publisher.js article.md              # 无封面发布');
    console.error('  node wechat-publisher.js article.md cover.png     # 使用自定义封面');
    console.error('\n环境变量:');
    console.error('  WECHAT_APP_ID        微信公众号 AppID');
    console.error('  WECHAT_APP_SECRET    微信公众号 AppSecret');
    console.error('\n注意:');
    console.error('  - Google AI 图片生成需要付费账户，已禁用自动封面生成');
    console.error('  - 建议手动制作封面图或使用第三方工具');
    process.exit(1);
  }

  // 从环境变量读取配置
  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;

  if (!appId || !appSecret) {
    console.error('❌ 请配置环境变量: WECHAT_APP_ID, WECHAT_APP_SECRET');
    process.exit(1);
  }

  const publisher = new WechatPublisher(appId, appSecret);

  publisher
    .publishToDraft(markdownPath, coverImagePath, { useNotebookLM })
    .then((result) => {
      console.log('\n🎉 发布成功！\n');
      console.log('📊 详情:');
      console.log(`  标题: ${result.title}`);
      console.log(`  草稿ID: ${result.draftId}`);
      console.log(`  上传图片: ${result.imagesUploaded}张`);
      console.log(`\n🔗 草稿链接: ${result.draftUrl}`);
    })
    .catch((err) => {
      console.error('❌ 发布失败:', err.message);
      process.exit(1);
    });
}
