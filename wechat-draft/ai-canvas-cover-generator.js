const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

/**
 * AI + Canvas 混合封面生成器
 *
 * 工作流:
 * 1. 用 Gemini 分析文章，提取设计元素
 * 2. 用 Canvas 根据 AI 分析结果生成封面
 */
class AICanvasCoverGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.geminiModel = 'gemini-2.5-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * 用 Gemini 分析文章，提取设计元素
   */
  async analyzeArticle(articleContent, title) {
    const url = `${this.baseUrl}/models/${this.geminiModel}:generateContent?key=${this.apiKey}`;

    const systemPrompt = `你是一个专业的封面设计分析师。请分析文章内容，提取关键的设计元素。

文章标题：${title}

文章内容（前1500字）：
${articleContent.substring(0, 1500)}

请分析并返回 JSON 格式（只返回 JSON，不要其他文字）：
{
  "style": "对比" | "数据" | "简约" | "问答",
  "mainColor": "#颜色代码",
  "accentColor": "#颜色代码",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "layout": "left-right" | "top-bottom" | "center",
  "emotion": "专业" | "激情" | "冷静" | "创新"
}`;

    try {
      const response = await axios.post(url, {
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }]
      });

      const text = response.data.candidates[0].content.parts[0].text.trim();

      // 提取 JSON（可能被包裹在代码块中）
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('📊 AI 分析结果:', JSON.stringify(analysis, null, 2));
        return analysis;
      } else {
        throw new Error('无法解析 AI 分析结果');
      }

    } catch (error) {
      console.warn('AI 分析失败，使用默认设计:', error.message);
      // 返回默认设计
      return {
        style: "简约",
        mainColor: "#1a1a2e",
        accentColor: "#0f3460",
        keywords: [title],
        layout: "center",
        emotion: "专业"
      };
    }
  }

  /**
   * 根据 AI 分析结果用 Canvas 生成封面
   */
  generateWithCanvas(title, analysis, outputPath) {
    const width = 900;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 根据风格选择布局
    if (analysis.style === '对比') {
      this.drawVSStyle(ctx, title, analysis, width, height);
    } else if (analysis.style === '数据') {
      this.drawDataStyle(ctx, title, analysis, width, height);
    } else if (analysis.style === '问答') {
      this.drawQAStyle(ctx, title, analysis, width, height);
    } else {
      this.drawMinimalistStyle(ctx, title, analysis, width, height);
    }

    // 保存
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log('✅ 图片已保存:', outputPath);
  }

  /**
   * 对比风格（VS）- 重新设计，更现代美观
   */
  drawVSStyle(ctx, title, analysis, width, height) {
    const { mainColor, accentColor, keywords } = analysis;

    // 深色渐变背景
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0a0a0a');
    bgGradient.addColorStop(1, this.adjustColor(mainColor, -20));
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 左侧区域 - 渐变效果
    const leftGradient = ctx.createLinearGradient(0, 0, width / 2, height);
    leftGradient.addColorStop(0, accentColor);
    leftGradient.addColorStop(1, this.adjustColor(accentColor, -40));
    ctx.fillStyle = leftGradient;
    ctx.fillRect(30, 80, width / 2 - 60, height - 160);

    // 右侧区域 - 对比色渐变
    const rightColor = keywords.length >= 2 ? '#ff6b6b' : this.adjustColor(accentColor, 120);
    const rightGradient = ctx.createLinearGradient(width / 2, 0, width, height);
    rightGradient.addColorStop(0, rightColor);
    rightGradient.addColorStop(1, this.adjustColor(rightColor, -40));
    ctx.fillStyle = rightGradient;
    ctx.fillRect(width / 2 + 30, 80, width / 2 - 60, height - 160);

    // 中央分隔线发光效果
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(width / 2 - 2, 60, 4, height - 120);
    ctx.shadowBlur = 0;

    // VS 标识 - 更大更醒目
    ctx.save();
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VS', width / 2, height / 2);
    ctx.restore();

    // 关键词 - 更大更清晰
    if (keywords.length >= 2) {
      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;

      // 左侧
      const leftLines = this.wrapTextBetter(keywords[0], 180);
      leftLines.forEach((line, i) => {
        ctx.fillText(line, width / 4, 140 + i * 55);
      });

      // 右侧
      const rightLines = this.wrapTextBetter(keywords[1], 180);
      rightLines.forEach((line, i) => {
        ctx.fillText(line, width * 3 / 4, 140 + i * 55);
      });

      ctx.shadowBlur = 0;
    }

    // 标题栏 - 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, height - 120, width, 120);

    // 标题文字
    ctx.font = 'bold 38px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const titleLines = this.wrapTextBetter(title, 850);
    titleLines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, width / 2, height - 80 + i * 45);
    });
  }

  /**
   * 数据风格
   */
  drawDataStyle(ctx, title, analysis, width, height) {
    const { mainColor, accentColor } = analysis;

    // 深色背景
    ctx.fillStyle = mainColor;
    ctx.fillRect(0, 0, width, height);

    // 数据可视化元素（柱状图效果）
    ctx.fillStyle = accentColor;
    const bars = 5;
    for (let i = 0; i < bars; i++) {
      const barHeight = 150 + Math.random() * 200;
      const barWidth = (width / bars) - 40;
      const x = i * (width / bars) + 20;
      const y = height - barHeight - 100;

      // 渐变柱
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, accentColor);
      gradient.addColorStop(1, this.adjustColor(accentColor, -40));
      ctx.fillStyle = gradient;

      ctx.fillRect(x, y, barWidth, barHeight);
    }

    // 标题
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleLines = this.wrapText(title, 800);
    titleLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, 60 + i * 50);
    });
  }

  /**
   * 问答风格
   */
  drawQAStyle(ctx, title, analysis, width, height) {
    const { mainColor, accentColor } = analysis;

    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, mainColor);
    gradient.addColorStop(1, this.adjustColor(mainColor, 30));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 问号图标
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 200px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', width / 2, height / 2 - 30);

    // 标题
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    const titleLines = this.wrapText(title, 800);
    titleLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, height - 100 + i * 45);
    });
  }

  /**
   * 简约风格（默认）- 重新设计
   */
  drawMinimalistStyle(ctx, title, analysis, width, height) {
    const { mainColor, accentColor } = analysis;

    // 渐变背景
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, mainColor);
    bgGradient.addColorStop(0.5, this.adjustColor(mainColor, 20));
    bgGradient.addColorStop(1, mainColor);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 装饰圆圈
    const circles = [
      { x: 150, y: 150, r: 80, alpha: 0.15 },
      { x: width - 150, y: 150, r: 100, alpha: 0.12 },
      { x: 200, y: height - 150, r: 120, alpha: 0.1 },
      { x: width - 200, y: height - 100, r: 90, alpha: 0.13 }
    ];

    circles.forEach(circle => {
      ctx.fillStyle = accentColor + Math.floor(circle.alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 中央标题区 - 带发光效果
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const titleLines = this.wrapTextBetter(title, 800);
    const startY = height / 2 - (titleLines.length - 1) * 35;
    titleLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, startY + i * 70);
    });

    ctx.shadowBlur = 0;

    // 关键词装饰条
    if (analysis.keywords.length > 0) {
      ctx.fillStyle = accentColor + '40';
      ctx.fillRect(100, height - 120, width - 200, 60);

      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(analysis.keywords.slice(0, 3).join('  •  '), width / 2, height - 90);
    }
  }

  /**
   * 更好的文字换行（支持中文）
   */
  wrapTextBetter(text, maxLen) {
    if (text.length <= maxLen / 15) {
      return [text];
    }

    const lines = [];
    let currentLine = '';

    for (const char of text) {
      if (currentLine.length < maxLen / 15) {
        currentLine += char;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = char;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines.slice(0, 2); // 最多2行
  }

  /**
   * 文字换行
   */
  wrapText(text, maxWidth) {
    const words = text.split('');
    const lines = [];
    let currentLine = '';

    for (const char of words) {
      if (currentLine.length < 15) {
        currentLine += char;
      } else {
        lines.push(currentLine);
        currentLine = char;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines.slice(0, 3); // 最多3行
  }

  /**
   * 调整颜色亮度
   */
  adjustColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  /**
   * 提取标题
   */
  extractTitle(markdown) {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : '未命名文章';
  }

  /**
   * 主流程
   */
  async generate(articlePath, outputPath, options = {}) {
    const { title = '' } = options;

    try {
      console.log('\n🎨 AI + Canvas 混合生成封面...\n');

      // Step 1: 读取文章
      console.log('1️⃣ 读取文章...');
      const articleContent = fs.readFileSync(articlePath, 'utf-8');
      const articleTitle = title || this.extractTitle(articleContent);
      console.log(`✅ 标题: ${articleTitle}\n`);

      // Step 2: AI 分析
      console.log('2️⃣ AI 分析文章，提取设计元素...');
      const analysis = await this.analyzeArticle(articleContent, articleTitle);
      console.log('✅ 分析完成\n');

      // Step 3: Canvas 生成
      console.log('3️⃣ Canvas 生成封面（基于 AI 分析）...');
      this.generateWithCanvas(articleTitle, analysis, outputPath);
      console.log('✅ 封面生成完成\n');

      return outputPath;

    } catch (error) {
      console.error('\n❌ 生成失败:', error.message);
      throw error;
    }
  }
}

module.exports = AICanvasCoverGenerator;

// ========== CLI 入口 ==========
if (require.main === module) {
  const [, , articlePath, outputPath, title] = process.argv;

  if (!articlePath || !outputPath) {
    console.error('用法: node ai-canvas-cover-generator.js <文章路径> <输出路径> [标题]');
    console.error('\n环境变量:');
    console.error('  GOOGLE_AI_API_KEY - Google AI API 密钥');
    console.error('\n示例:');
    console.error('  node ai-canvas-cover-generator.js article.md cover.png');
    console.error('  node ai-canvas-cover-generator.js article.md cover.png "标题"');
    process.exit(1);
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error('❌ 请设置环境变量 GOOGLE_AI_API_KEY');
    process.exit(1);
  }

  const generator = new AICanvasCoverGenerator(apiKey);

  generator
    .generate(articlePath, outputPath, { title })
    .then((path) => {
      console.log('🎉 成功！');
      console.log(`封面图: ${path}`);
    })
    .catch((err) => {
      console.error('❌ 失败:', err.message);
      process.exit(1);
    });
}
