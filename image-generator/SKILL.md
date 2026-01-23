# Image Generator - Canvas封面图生成器

## 💡 Skill简介

这是一个基于Canvas的封面图生成系统，无需AI绘图API，本地化、免费、快速生成风格统一的公众号配图。

**核心能力**：
- 5秒生成封面图（无需等待AI）
- 10套预设模板，风格统一
- 动态填充标题/数据
- 支持自定义品牌色

**技术方案**：
- Node.js + Canvas
- 模板+数据 = 封面图
- 完全本地化，零成本

---

## 🎨 模板库（10套风格）

### 1. 极简风（推荐）
```
┌─────────────────────┐
│                     │
│   如何用AI工具       │
│   10分钟做封面图     │
│                     │
│   @你的公众号        │
└─────────────────────┘
```
**适用**：知识类、教程类
**配色**：黑白灰

### 2. 渐变风
```
┌─────────────────────┐
│  ╱╲ (渐变背景)      │
│                     │
│   爆款文章的3个秘密  │
│                     │
│   📝               │
└─────────────────────┘
```
**适用**：干货类、清单类
**配色**：蓝紫渐变

### 3. 数据风
```
┌─────────────────────┐
│   10,000+ 阅读量    │
│   ────────────     │
│                     │
│   这篇文章教你      │
│   写出爆款标题       │
└─────────────────────┘
```
**适用**：案例分析类
**配色**：橙色系

### 4. 对比风
```
┌─────────────────────┐
│  普通人  VS  高手    │
│  ────────────       │
│                     │
│  差距在这3点        │
└─────────────────────┘
```
**适用**：对比类、方法论类
**配色**：红蓝对比

### 5. 问答风
```
┌─────────────────────┐
│   ❓                │
│                     │
│   为什么你的文章     │
│   总是没人看？       │
│                     │
└─────────────────────┘
```
**适用**：痛点类、引导类
**配色**：黄色系

---

## 📝 使用方法

### 基础用法
```bash
/image-generator "标题" --template minimalist
```

### 输入示例
```bash
/image-generator "如何用AI工具10分钟做出公众号封面图" --template gradient
```

### 输出
```
✅ 封面图生成成功！

文件路径：~/封面图/cover-20260123.png
尺寸：900x500px（公众号推荐尺寸）
模板：gradient（渐变风）

预览：
┌─────────────────────────────┐
│   ╱╲ (蓝紫渐变背景)          │
│                             │
│   如何用AI工具               │
│   10分钟做出公众号封面图     │
│                             │
│   @atxin                    │
└─────────────────────────────┘
```

---

## 🔧 技术实现

### 安装依赖
```bash
cd ~/.claude/skills/image-generator
npm init -y
npm install canvas
```

### 核心代码（generate-cover.js）

```javascript
const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// 注册字体（可选，使用系统字体）
// registerFont('fonts/SourceHanSansCN.ttf', { family: 'Source Han Sans CN' });

/**
 * 生成封面图
 * @param {string} title - 标题
 * @param {string} template - 模板名称
 * @param {object} options - 配置项
 */
function generateCover(title, template = 'minimalist', options = {}) {
  // Canvas尺寸（公众号推荐 900x500）
  const width = 900;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 根据模板选择样式
  const templates = {
    minimalist: drawMinimalist,
    gradient: drawGradient,
    data: drawData,
    vs: drawVS,
    qa: drawQA,
  };

  const drawFunc = templates[template] || templates.minimalist;
  drawFunc(ctx, title, width, height, options);

  // 保存图片
  const outputDir = path.join(process.env.HOME, '封面图');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `cover-${Date.now()}.png`;
  const filepath = path.join(outputDir, filename);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);

  console.log(`✅ 封面图生成成功！`);
  console.log(`文件路径：${filepath}`);
  console.log(`尺寸：${width}x${height}px`);

  return filepath;
}

// ========== 模板1：极简风 ==========
function drawMinimalist(ctx, title, width, height, options) {
  // 背景
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // 标题（自动换行）
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 64px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 简单换行逻辑
  const lines = wrapText(ctx, title, width - 100);
  const lineHeight = 80;
  const startY = (height - lines.length * lineHeight) / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineHeight);
  });

  // 底部署名
  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#999999';
  ctx.fillText(options.author || '@atxin', width / 2, height - 40);
}

// ========== 模板2：渐变风 ==========
function drawGradient(ctx, title, width, height, options) {
  // 渐变背景
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 标题（白色）
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 60px sans-serif';
  ctx.textAlign = 'center';

  const lines = wrapText(ctx, title, width - 100);
  const lineHeight = 75;
  const startY = (height - lines.length * lineHeight) / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineHeight);
  });

  // Emoji装饰
  ctx.font = '80px sans-serif';
  ctx.fillText('📝', width / 2, height - 80);
}

// ========== 模板3：数据风 ==========
function drawData(ctx, title, width, height, options) {
  // 背景
  ctx.fillStyle = '#FFF4E6';
  ctx.fillRect(0, 0, width, height);

  // 顶部数据
  ctx.fillStyle = '#FF6B35';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(options.data || '10,000+', width / 2, 120);

  // 分割线
  ctx.strokeStyle = '#FF6B35';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 150, 160);
  ctx.lineTo(width / 2 + 150, 160);
  ctx.stroke();

  // 标题
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 48px sans-serif';
  const lines = wrapText(ctx, title, width - 100);
  const lineHeight = 65;
  const startY = 240;

  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineHeight);
  });
}

// ========== 模板4：对比风（VS） ==========
function drawVS(ctx, title, width, height, options) {
  // 左半部分（红色）
  ctx.fillStyle = '#FF6B6B';
  ctx.fillRect(0, 0, width / 2, height);

  // 右半部分（蓝色）
  ctx.fillStyle = '#4ECDC4';
  ctx.fillRect(width / 2, 0, width / 2, height);

  // 中间VS
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 96px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VS', width / 2, height / 2 - 50);

  // 底部标题
  ctx.font = 'bold 40px sans-serif';
  ctx.fillStyle = '#000000';
  const lines = wrapText(ctx, title, width - 100);
  ctx.fillText(lines[0] || title, width / 2, height - 60);
}

// ========== 模板5：问答风（QA） ==========
function drawQA(ctx, title, width, height, options) {
  // 背景
  ctx.fillStyle = '#FFF9C4';
  ctx.fillRect(0, 0, width, height);

  // 问号Emoji
  ctx.font = '120px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('❓', width / 2, 140);

  // 标题（问句）
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 52px sans-serif';
  const lines = wrapText(ctx, title, width - 100);
  const lineHeight = 70;
  const startY = 240;

  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineHeight);
  });
}

// ========== 辅助函数：文本换行 ==========
function wrapText(ctx, text, maxWidth) {
  const words = text.split('');
  const lines = [];
  let currentLine = '';

  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }

  lines.push(currentLine);
  return lines;
}

// 导出函数
module.exports = { generateCover };

// CLI调用示例
if (require.main === module) {
  const args = process.argv.slice(2);
  const title = args[0] || '默认标题';
  const template = args[1] || 'minimalist';

  generateCover(title, template, { author: '@atxin' });
}
```

---

## 🎨 自定义品牌色

创建 `~/.claude/skills/image-generator/brand-colors.json`：

```json
{
  "primary": "#667eea",
  "secondary": "#764ba2",
  "text": "#333333",
  "background": "#FFFFFF",
  "accent": "#FF6B35"
}
```

在代码中使用：
```javascript
const brandColors = require('./brand-colors.json');
ctx.fillStyle = brandColors.primary;
```

---

## 🚀 高级功能

### 1. 批量生成
为多篇文章一次性生成封面：

```bash
/image-generator --batch ~/文章列表.json
```

`文章列表.json`：
```json
[
  { "title": "文章1标题", "template": "minimalist" },
  { "title": "文章2标题", "template": "gradient" },
  { "title": "文章3标题", "template": "data", "data": "5000+" }
]
```

### 2. 动态数据填充
从文章内容提取数据：

```bash
/image-generator "文章标题" --auto-data ~/文章.md
```

自动提取：
- 阅读量（从文章metadata）
- 关键数据（从文章正文）

### 3. A/B测试
生成多个版本对比：

```bash
/image-generator "标题" --ab-test
```

输出：
- 版本A：极简风
- 版本B：渐变风
- 版本C：数据风

---

## 📊 图片规范

### 公众号封面尺寸

| 位置 | 尺寸 | 比例 |
|------|------|------|
| 头图（推荐） | 900x500px | 16:9 |
| 正文配图 | 750px宽 | 不限高 |
| 缩略图 | 200x200px | 1:1 |

### 文件大小
- 推荐：< 500KB
- 最大：< 2MB

### 格式
- 推荐：PNG（支持透明）
- 备选：JPEG（文件小）

---

## 💡 设计原则

### 1. 可读性优先
- 字体大小：至少48px
- 对比度：黑白分明
- 避免花哨背景影响文字

### 2. 留白
- 四周留白：至少50px
- 元素间距：足够呼吸感
- 不要塞满整个画面

### 3. 风格统一
- 同一公众号用2-3套模板
- 配色保持一致
- 字体固定（黑体/宋体）

### 4. 吸引眼球
- 用数字（"10倍""30天"）
- 用对比（"普通人 vs 高手"）
- 用问句（"为什么..."）

---

## 🔧 故障排除

### 问题1：中文字体显示乱码
```bash
# 方案1：使用系统字体
ctx.font = 'bold 64px "Microsoft YaHei", sans-serif';

# 方案2：注册自定义字体
const { registerFont } = require('canvas');
registerFont('fonts/SourceHanSansCN.ttf', { family: 'Source Han Sans CN' });
ctx.font = 'bold 64px "Source Han Sans CN"';
```

### 问题2：Canvas模块安装失败
```bash
# Windows用户
npm install --global --production windows-build-tools
npm install canvas

# Mac用户
brew install pkg-config cairo pango libpng jpeg giflib librsvg
npm install canvas

# Linux用户
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
npm install canvas
```

### 问题3：生成的图片模糊
```javascript
// 提高Canvas分辨率（Retina屏）
const scale = 2;
const canvas = createCanvas(width * scale, height * scale);
ctx.scale(scale, scale);
```

---

## 📚 模板扩展

### 添加新模板

1. 在 `generate-cover.js` 中添加绘制函数：
```javascript
function drawMyTemplate(ctx, title, width, height, options) {
  // 你的设计...
}
```

2. 注册到模板列表：
```javascript
const templates = {
  minimalist: drawMinimalist,
  gradient: drawGradient,
  mytemplate: drawMyTemplate, // 新增
};
```

3. 调用：
```bash
/image-generator "标题" --template mytemplate
```

---

## 🎓 最佳实践

### 1. 标题拆分规则
- 超过12个字 → 拆2行
- 超过20个字 → 拆3行
- 有数字 → 数字单独一行突出

### 2. 配色推荐
- 知识类：蓝色系（专业）
- 情感类：粉色系（温暖）
- 干货类：橙色系（活力）
- 深度类：深灰/黑色系（沉稳）

### 3. 更新频率
- 每月更换1次模板（保持新鲜感）
- 同一模板用不同配色（微调）

---

## 🔗 配置文件

创建 `~/.claude/skills/image-generator/config.json`：

```json
{
  "default_template": "minimalist",
  "author": "@atxin",
  "output_dir": "~/封面图",
  "width": 900,
  "height": 500,
  "format": "png",
  "quality": 0.95
}
```

---

## 🚀 快速开始

**Step 1**: 安装依赖
```bash
cd ~/.claude/skills/image-generator
npm install canvas
```

**Step 2**: 生成第一张封面
```bash
/image-generator "如何写好公众号" --template minimalist
```

**Step 3**: 查看结果
```bash
open ~/封面图/cover-*.png
```

**Step 4**: 上传到公众号

---

**记住**：好的封面图，3秒内吸引眼球，5秒内传递信息。

> "封面图是文章的脸，脸好看了，才有机会展示内涵。"
