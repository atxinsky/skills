const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * 使用 Google AI (Gemini + Imagen) 生成文章封面图
 *
 * 工作流:
 * 1. 读取文章内容
 * 2. 用 Gemini 分析文章，生成图片 prompt
 * 3. 用 Imagen 4 生成封面图
 * 4. 保存图片
 */
class GoogleAICoverGenerator {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.geminiModel = options.geminiModel || 'gemini-2.5-flash';
    this.imageGenModel = options.imageGenModel || 'gemini-2.0-flash-exp-image-generation'; // Gemini 图片生成
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * 用 Gemini 分析文章，生成图片 prompt
   */
  async generatePrompt(articleContent, title) {
    const url = `${this.baseUrl}/models/${this.geminiModel}:generateContent?key=${this.apiKey}`;

    const systemPrompt = `你是一个专业的封面图设计师。请根据文章内容，生成一个适合作为公众号封面的图片描述（英文）。

要求：
1. 描述要具体、视觉化，包含颜色、布局、元素
2. 适合现代、专业的公众号风格
3. 尺寸横向（16:9比例）
4. 突出文章主题和关键信息
5. 不要包含任何文字（纯图片）
6. 只返回 prompt，不要其他解释

文章标题：${title}

文章内容（前1000字）：
${articleContent.substring(0, 1000)}

请生成图片 prompt（英文，100字以内）：`;

    try {
      const response = await axios.post(url, {
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }]
      });

      const prompt = response.data.candidates[0].content.parts[0].text.trim();
      console.log('📝 生成的 prompt:', prompt);
      return prompt;

    } catch (error) {
      console.error('Gemini 分析失败:', error.response?.data || error.message);
      // 如果失败，返回默认 prompt
      return `Professional modern infographic cover image for article about ${title}, clean design, vibrant colors, minimalist style, 16:9 aspect ratio`;
    }
  }

  /**
   * 用 Gemini 2.0 Flash 生成图片
   */
  async generateImage(prompt, outputPath) {
    const url = `${this.baseUrl}/models/${this.imageGenModel}:generateContent?key=${this.apiKey}`;

    try {
      console.log('🎨 正在生成图片（Gemini 2.0 Flash）...');

      const response = await axios.post(url, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseModalities: ["image"]
        }
      });

      // Gemini 返回的图片在 inlineData 中
      const imagePart = response.data.candidates[0].content.parts.find(
        part => part.inlineData && part.inlineData.mimeType.startsWith('image/')
      );

      if (!imagePart) {
        throw new Error('API 未返回图片数据');
      }

      const imageData = imagePart.inlineData.data;
      const buffer = Buffer.from(imageData, 'base64');

      fs.writeFileSync(outputPath, buffer);
      console.log('✅ 图片已保存:', outputPath);

      return outputPath;

    } catch (error) {
      console.error('图片生成失败:', error.response?.data || error.message);
      throw new Error(`图片生成失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 主流程：生成封面图
   */
  async generate(articlePath, outputPath, options = {}) {
    const { title = '' } = options;

    try {
      console.log('\n🎨 使用 Google AI 生成封面图...\n');

      // Step 1: 读取文章
      console.log('1️⃣ 读取文章...');
      const articleContent = fs.readFileSync(articlePath, 'utf-8');
      const articleTitle = title || this.extractTitle(articleContent);
      console.log(`✅ 标题: ${articleTitle}\n`);

      // Step 2: 生成 prompt
      console.log('2️⃣ 分析文章，生成设计 prompt...');
      const prompt = await this.generatePrompt(articleContent, articleTitle);
      console.log('✅ Prompt 生成完成\n');

      // Step 3: 生成图片
      console.log('3️⃣ 生成封面图（Gemini 2.0 Flash）...');
      await this.generateImage(prompt, outputPath);
      console.log('✅ 封面生成完成\n');

      return outputPath;

    } catch (error) {
      console.error('\n❌ 生成失败:', error.message);
      throw error;
    }
  }

  /**
   * 从文章中提取标题
   */
  extractTitle(markdown) {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : '未命名文章';
  }
}

module.exports = GoogleAICoverGenerator;

// ========== CLI 入口 ==========
if (require.main === module) {
  const [, , articlePath, outputPath, title] = process.argv;

  if (!articlePath || !outputPath) {
    console.error('用法: node google-ai-cover-generator.js <文章路径> <输出路径> [标题]');
    console.error('\n环境变量:');
    console.error('  GOOGLE_AI_API_KEY - Google AI API 密钥');
    console.error('\n示例:');
    console.error('  node google-ai-cover-generator.js article.md cover.png');
    console.error('  node google-ai-cover-generator.js article.md cover.png "数字人民币"');
    process.exit(1);
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error('❌ 请设置环境变量 GOOGLE_AI_API_KEY');
    process.exit(1);
  }

  const generator = new GoogleAICoverGenerator(apiKey);

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
