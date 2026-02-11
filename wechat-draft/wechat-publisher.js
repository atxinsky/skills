const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { marked } = require('marked');

// 默认凭证
const DEFAULT_APP_ID = 'wxf2f1ac4b86085ef8';
const DEFAULT_APP_SECRET = '6657698519d94c3b3d224cc9a2c354ba';

class WechatPublisher {
  constructor(appId, appSecret) {
    this.appId = appId || DEFAULT_APP_ID;
    this.appSecret = appSecret || DEFAULT_APP_SECRET;
    this.accessToken = null;
    this.tokenExpireTime = 0;
  }

  async getAccessToken() {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpireTime) {
      return this.accessToken;
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
    const response = await axios.get(url);

    if (response.data.errcode) {
      throw new Error(`获取access_token失败: ${response.data.errmsg} (code: ${response.data.errcode})`);
    }

    this.accessToken = response.data.access_token;
    this.tokenExpireTime = now + (response.data.expires_in - 300) * 1000;
    return this.accessToken;
  }

  async uploadImage(imagePath) {
    const token = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${token}&type=image`;

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

  // 上传永久素材（用于封面图）
  async uploadThumbImage(imagePath) {
    const token = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;

    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));

    const response = await axios.post(url, form, {
      headers: form.getHeaders(),
    });

    if (response.data.errcode) {
      throw new Error(`封面图上传失败: ${response.data.errmsg}`);
    }

    return response.data.media_id;
  }

  // 上传文章内图片（返回URL）
  async uploadContentImage(imagePath) {
    const token = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`;

    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));

    const response = await axios.post(url, form, {
      headers: form.getHeaders(),
    });

    if (response.data.errcode) {
      throw new Error(`内容图片上传失败: ${response.data.errmsg}`);
    }

    return response.data.url;
  }

  markdownToWechatHTML(markdown) {
    marked.setOptions({ breaks: true, gfm: true });

    let html = marked.parse(markdown);

    // 去掉最外层 h1（已作为标题）
    html = html.replace(/<h1[^>]*>.*?<\/h1>/i, '');

    // 美化 h2
    html = html.replace(/<h2>(.*?)<\/h2>/g,
      '<h2 style="font-size:20px;font-weight:bold;margin:28px 0 14px;color:#1a1a1a;border-left:4px solid #1890ff;padding-left:12px;line-height:1.4;">$1</h2>');

    // 美化 h3
    html = html.replace(/<h3>(.*?)<\/h3>/g,
      '<h3 style="font-size:17px;font-weight:bold;margin:22px 0 10px;color:#333;line-height:1.4;">$1</h3>');

    // 美化段落
    html = html.replace(/<p>(.*?)<\/p>/gs,
      '<p style="font-size:16px;line-height:2;margin:12px 0;color:#333;letter-spacing:0.5px;">$1</p>');

    // 美化引用块
    html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g,
      '<blockquote style="border-left:4px solid #1890ff;background:#f0f7ff;padding:14px 18px;margin:16px 0;color:#555;font-size:15px;line-height:1.8;">$1</blockquote>');

    // 美化代码块
    html = html.replace(/<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g,
      (match, lang, code) => {
        return `<section style="background:#282c34;border-radius:8px;padding:16px 20px;margin:16px 0;overflow-x:auto;">
          <pre style="margin:0;font-family:'Courier New',monospace;font-size:13px;line-height:1.6;color:#abb2bf;white-space:pre-wrap;word-wrap:break-word;">${code}</pre>
        </section>`;
      });

    // 美化行内代码
    html = html.replace(/<code>(.*?)<\/code>/g,
      '<code style="background:#f6f8fa;padding:2px 6px;border-radius:3px;font-size:14px;color:#e83e8c;">$1</code>');

    // 美化粗体
    html = html.replace(/<strong>(.*?)<\/strong>/g,
      '<strong style="color:#1a1a1a;">$1</strong>');

    // 美化分割线
    html = html.replace(/<hr\s*\/?>/g,
      '<hr style="border:none;border-top:1px dashed #ddd;margin:24px 0;" />');

    // 美化列表
    html = html.replace(/<ul>/g, '<ul style="padding-left:20px;margin:12px 0;">');
    html = html.replace(/<li>(.*?)<\/li>/g,
      '<li style="font-size:16px;line-height:2;color:#333;margin:4px 0;">$1</li>');

    return html;
  }

  extractTitle(markdown) {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : '未命名文章';
  }

  extractDigest(markdown) {
    // 取第一个 blockquote 或前200字作为摘要
    const quoteMatch = markdown.match(/^>\s+(.+)$/m);
    if (quoteMatch) return quoteMatch[1].slice(0, 120);
    const text = markdown.replace(/[#*>\-`\[\]()!|]/g, '').replace(/\n/g, ' ').trim();
    return text.slice(0, 120);
  }

  async createDraft(title, content, thumbMediaId, digest) {
    const token = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;

    const article = {
      title: title,
      author: '新资产通证研究',
      digest: digest || '',
      content: content,
      content_source_url: '',
      need_open_comment: 0,
      only_fans_can_comment: 0,
    };

    if (thumbMediaId) {
      article.thumb_media_id = thumbMediaId;
    }

    const data = { articles: [article] };
    const response = await axios.post(url, data);

    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`创建草稿失败: ${response.data.errmsg} (code: ${response.data.errcode})`);
    }

    return response.data.media_id;
  }

  async publishToDraft(markdownPath, coverImagePath = null) {
    console.log('📖 读取文章...');
    const markdown = fs.readFileSync(markdownPath, 'utf-8');

    console.log('📝 提取标题和摘要...');
    const title = this.extractTitle(markdown);
    const digest = this.extractDigest(markdown);
    console.log(`  标题: ${title}`);
    console.log(`  摘要: ${digest}`);

    // 上传封面图（如果有）
    let thumbMediaId = null;
    if (coverImagePath && fs.existsSync(coverImagePath)) {
      console.log('🖼️ 上传封面图...');
      thumbMediaId = await this.uploadThumbImage(coverImagePath);
      console.log(`  封面 media_id: ${thumbMediaId}`);
    }

    // 没有封面图时，生成一个纯色占位图
    if (!thumbMediaId) {
      console.log('🖼️ 生成占位封面...');
      const placeholderPath = path.join(path.dirname(markdownPath), '_placeholder_cover.png');
      // 生成一个最小的1x1 PNG（微信要求图片）
      // 用一个简单的纯白 PNG
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // 8bit RGB
        0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
        0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
      ]);
      fs.writeFileSync(placeholderPath, pngHeader);
      try {
        thumbMediaId = await this.uploadThumbImage(placeholderPath);
        console.log(`  占位封面 media_id: ${thumbMediaId}`);
      } catch (e) {
        console.warn(`  ⚠️ 封面上传失败: ${e.message}`);
      }
      // 清理
      if (fs.existsSync(placeholderPath)) fs.unlinkSync(placeholderPath);
    }

    console.log('🔄 转换格式...');
    const html = this.markdownToWechatHTML(markdown);

    console.log('📤 创建草稿...');
    const draftId = await this.createDraft(title, html, thumbMediaId, digest);

    console.log('\n✅ 发布成功！');
    console.log(`  标题: ${title}`);
    console.log(`  草稿ID: ${draftId}`);
    console.log(`  请在公众号后台查看草稿箱`);

    return { success: true, title, draftId };
  }
}

module.exports = WechatPublisher;

// CLI
if (require.main === module) {
  const [, , markdownPath, coverImagePath] = process.argv;

  if (!markdownPath) {
    console.error('用法: node wechat-publisher.js <文章.md> [封面图.png]');
    process.exit(1);
  }

  const appId = process.env.WECHAT_APP_ID || DEFAULT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET || DEFAULT_APP_SECRET;

  const publisher = new WechatPublisher(appId, appSecret);
  publisher.publishToDraft(markdownPath, coverImagePath)
    .catch(err => {
      console.error('❌ 发布失败:', err.message);
      process.exit(1);
    });
}
