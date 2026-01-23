# WeChat Draft - 公众号一键发布

## 💡 Skill简介

这是一个将Markdown文章自动发布到微信公众号草稿箱的工具，包含图片上传、格式转换、草稿创建等完整流程。

**核心能力**：
- Markdown → 公众号HTML格式转换
- 图片自动上传 + 压缩
- 一键创建草稿
- **🆕 AI 封面图生成（NotebookLM）**
- 支持自定义封面图

**效率提升**：
- 手动发布：30分钟
- 自动发布：2分钟
- **节省时间：28分钟**

---

## 📝 使用方法

### 基础用法
```bash
/wechat-draft [文章路径]
```

### 输入示例
```markdown
/wechat-draft ~/我的文章/如何用AI工具提升效率.md
```

### 输出示例
```markdown
## 📤 公众号发布报告

**文章标题**：如何用AI工具10分钟做出公众号封面图

**发布状态**：✅ 成功

---

### 📊 处理详情

**1. 图片上传**：3/3张 ✅
- 封面图：已上传 (media_id: xxx)
- 配图1：已上传 (media_id: yyy)
- 配图2：已上传 (media_id: zzz)

**2. 格式转换**：✅ 完成
- Markdown → 公众号HTML
- 代码块样式化
- 引用块美化

**3. 草稿创建**：✅ 成功
- 草稿ID：1234567890
- 草稿链接：https://mp.weixin.qq.com/cgi-bin/draft?t=draft/list&action=edit&draft_id=1234567890

---

**下一步**：
1. 点击草稿链接预览
2. 检查格式是否正确
3. 发布或定时发送
```

---

## 🎨 AI封面生成（NotebookLM集成）

### 功能说明

**新增特性**：自动使用 NotebookLM 生成专业信息图作为文章封面

**工作流程**：
```
文章内容 → NotebookLM → AI分析 → 生成信息图 → 下载 → 上传到公众号
```

**生成效果**：
- ✅ 专业设计风格
- ✅ 自动提取关键信息
- ✅ 现代化排版
- ✅ 配色协调
- ✅ 比 Canvas 生成的更美观

### 使用方式

#### 方式1：自动生成（默认）
```bash
node wechat-publisher.js article.md
```
- 自动用 NotebookLM 生成封面
- 如果生成失败，继续发布（无封面）

#### 方式2：使用自定义封面
```bash
node wechat-publisher.js article.md cover.png
```
- 使用指定的封面图
- 不调用 NotebookLM

#### 方式3：禁用 AI 封面
```bash
node wechat-publisher.js article.md --no-notebooklm
```
- 不生成封面，直接发布

### 生成参数

生成时会自动传递以下指令给 NotebookLM：
```
创建一个专业、现代、吸引眼球的信息图作为公众号文章封面。
使用鲜明的配色和清晰的排版，突出文章主题和关键信息。
```

### 错误处理

**速率限制**：
- NotebookLM 生成可能受 Google API 速率限制
- 默认重试2次，每次等待60秒
- 如果全部失败，跳过封面生成，继续发布

**超时处理**：
- 生成超时：5分钟
- 源处理超时：2分钟
- 超时后自动清理临时文件

### 文件保存

生成的封面会保存在文章同目录：
```
文章位置：D:\文章\我的文章.md
封面位置：D:\文章\封面-我的文章.png
```

### 技术实现

使用独立模块 `notebooklm-cover-generator.js`：

**核心流程**：
1. 创建临时 NotebookLM notebook
2. 上传文章作为源
3. 等待源处理完成
4. 生成信息图（带重试机制）
5. 等待生成完成（轮询状态）
6. 下载信息图
7. 清理临时 notebook

**命令示例**：
```bash
# 直接使用生成器
node notebooklm-cover-generator.js article.md cover.png "文章标题"

# 自定义生成指令
node notebooklm-cover-generator.js article.md cover.png "标题" "创建对比风格的信息图"
```

---

## 🔧 实现方案

### 技术架构

```
┌─────────────────────────────────────────┐
│         wechat-draft Skill              │
├─────────────────────────────────────────┤
│  1. 读取Markdown文章                     │
│  2. 提取图片路径                         │
│  3. 上传图片到公众号素材库               │
│  4. Markdown → 公众号HTML转换            │
│  5. 创建草稿                             │
└─────────────────────────────────────────┘
```

### 完整实现代码

创建 `~/.claude/skills/wechat-draft/wechat-publisher.js`：

```javascript
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
   * 上传图片到公众号素材库
   */
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
   * 主流程：发布文章到草稿箱
   */
  async publishToDraft(markdownPath, coverImagePath = null) {
    console.log('📖 读取文章...');
    const markdown = fs.readFileSync(markdownPath, 'utf-8');

    console.log('📝 提取标题...');
    const title = this.extractTitle(markdown);

    console.log('🖼️ 提取图片...');
    const imagePaths = this.extractImages(markdown);

    // 添加封面图
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
  const [, , markdownPath, coverImagePath] = process.argv;

  if (!markdownPath) {
    console.error('用法: node wechat-publisher.js <文章路径> [封面图路径]');
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
    .publishToDraft(markdownPath, coverImagePath)
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
```

---

## 📦 安装依赖

```bash
cd ~/.claude/skills/wechat-draft
npm init -y
npm install axios form-data marked
```

---

## ⚙️ 环境配置

### 1. 获取公众号凭证

登录 [微信公众平台](https://mp.weixin.qq.com/)：
1. 设置 → 开发 → 基本配置
2. 查看 AppID 和 AppSecret

### 2. 配置环境变量

编辑 `~/.bashrc` 或 `~/.zshrc`：

```bash
export WECHAT_APP_ID="wx1234567890abcdef"
export WECHAT_APP_SECRET="your_secret_here_32_characters"
```

刷新配置：
```bash
source ~/.bashrc
```

### 3. 验证配置

```bash
echo $WECHAT_APP_ID
echo $WECHAT_APP_SECRET
```

---

## 🎯 使用场景

### 场景1：发布带封面的文章

```bash
/wechat-draft ~/文章/如何用AI.md ~/图片/封面.png
```

### 场景2：批量发布

创建 `batch-publish.sh`：

```bash
#!/bin/bash
for file in ~/草稿/*.md; do
  echo "发布: $file"
  node ~/.claude/skills/wechat-draft/wechat-publisher.js "$file"
  sleep 2  # 避免API限流
done
```

### 场景3：定时发布

结合cron定时任务：

```bash
# 每天早上9点发布
0 9 * * * node ~/.claude/skills/wechat-draft/wechat-publisher.js ~/today-article.md
```

---

## 🔍 API限制

| 限制项 | 说明 |
|--------|------|
| access_token有效期 | 7200秒（2小时） |
| 图片大小 | <10MB |
| 图片格式 | JPG, PNG |
| 草稿数量 | <100个 |
| 调用频率 | 不超过100次/分钟 |

---

## 🐛 常见问题

### Q1: access_token获取失败

**错误**：`errcode: 40013, errmsg: invalid appid`

**解决**：
- 检查 AppID 是否正确（不含空格）
- 确认公众号类型（服务号/订阅号）
- 检查IP白名单设置

### Q2: 图片上传失败

**错误**：`errcode: 40007, errmsg: invalid media_id`

**解决**：
- 图片大小不超过10MB
- 支持格式：JPG, PNG
- 检查文件路径是否正确

### Q3: 草稿创建失败

**错误**：`errcode: 45009, errmsg: reach max api daily quota limit`

**解决**：
- 已达到每日调用上限
- 等待次日重置
- 使用开发者模式调高限额

### Q4: Markdown转换格式错乱

**现象**：代码块、引用块显示异常

**解决**：
- 检查Markdown语法是否标准
- 调整 `markdownToWechatHTML()` 中的样式
- 手动在公众号后台微调

---

## 🎨 自定义样式

### 修改代码块样式

编辑 `wechat-publisher.js`，找到代码块替换部分：

```javascript
html = html.replace(
  /<pre><code class="language-(\w+)">(.*?)<\/code><\/pre>/gs,
  (match, lang, code) => {
    return `
      <section style="
        background: #282c34;        /* 改为深色背景 */
        border-radius: 8px;          /* 圆角 */
        padding: 20px;
        margin: 16px 0;
      ">
        <pre style="
          color: #abb2bf;            /* 浅色文字 */
          font-size: 14px;
        ">${code}</pre>
      </section>
    `;
  }
);
```

### 修改标题样式

```javascript
html = html.replace(
  /<h2>(.*?)<\/h2>/g,
  '<h2 style="font-size: 22px; color: #1890ff; border-left: 4px solid #1890ff; padding-left: 12px;">$1</h2>'
);
```

---

## 📊 调试模式

启用详细日志：

```javascript
// 在 WechatPublisher 类开头添加
this.debug = true;

// 修改每个方法，添加日志
async getAccessToken() {
  if (this.debug) {
    console.log('[DEBUG] 开始获取access_token...');
  }
  // ...
}
```

---

## 🔗 相关资源

- [微信公众号开发文档](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [marked.js文档](https://marked.js.org/)
- [草稿箱API文档](https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html)

---

## ✅ 测试清单

发布前检查：

- [ ] access_token正常获取
- [ ] 图片上传成功
- [ ] Markdown转换格式正确
- [ ] 草稿创建成功
- [ ] 草稿链接可访问
- [ ] 代码块样式正常
- [ ] 图片显示清晰
- [ ] 移动端预览效果

---

**记住**：这个工具只是创建草稿，最终发布前务必在公众号后台人工预览一遍！

> "自动化的目的是提高效率，不是降低质量。"
