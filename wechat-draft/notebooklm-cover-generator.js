const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 使用 NotebookLM 生成文章封面图
 *
 * 工作流:
 * 1. 创建临时 NotebookLM notebook
 * 2. 上传文章内容
 * 3. 生成信息图
 * 4. 等待完成并下载
 * 5. 清理临时文件
 */
class NotebookLMCoverGenerator {
  constructor(options = {}) {
    this.timeout = options.timeout || 300; // 5分钟超时
    this.retryDelay = options.retryDelay || 60000; // 1分钟重试延迟
    this.maxRetries = options.maxRetries || 2;
  }

  /**
   * 执行命令并返回结果
   */
  exec(command, parseJson = false) {
    try {
      console.log(`执行: ${command}`);
      const output = execSync(command, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (parseJson) {
        // 提取JSON部分（可能有额外的日志输出）
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('无法解析JSON输出');
      }

      return output.trim();
    } catch (error) {
      const stderr = error.stderr ? error.stderr.toString() : '';

      // 检查是否是认证错误
      if (stderr.includes('Authentication expired') || stderr.includes('Run \'notebooklm login\'')) {
        throw new Error('NotebookLM 认证已过期，请运行: notebooklm login');
      }

      // 检查是否是速率限制
      if (stderr.includes('rate limit') || stderr.includes('GENERATION_FAILED')) {
        throw new Error('NotebookLM 速率限制，请稍后重试');
      }

      console.error(`命令执行失败: ${error.message}`);
      if (stderr) {
        console.error(`错误输出: ${stderr}`);
      }
      throw error;
    }
  }

  /**
   * 生成封面图
   *
   * @param {string} articlePath - 文章路径
   * @param {string} outputPath - 输出路径
   * @param {object} options - 生成选项
   * @returns {Promise<string>} 生成的封面图路径
   */
  async generate(articlePath, outputPath, options = {}) {
    const {
      title = '',
      instructions = '创建一个专业、吸引眼球的信息图作为文章封面。使用现代设计风格，突出关键数据和主题。',
    } = options;

    let notebookId = null;
    let artifactId = null;

    try {
      console.log('\n🎨 使用 NotebookLM 生成封面图...\n');

      // Step 1: 创建临时 notebook
      console.log('1️⃣ 创建临时 notebook...');
      const notebookTitle = `封面生成-${title || '文章'}-${Date.now()}`;
      const createResult = this.exec(
        `notebooklm create "${notebookTitle}" --json`,
        true
      );
      notebookId = createResult.id;
      console.log(`✅ Notebook ID: ${notebookId}\n`);

      // Step 2: 上传文章作为源
      console.log('2️⃣ 上传文章...');
      const addSourceResult = this.exec(
        `notebooklm source add "${articlePath}" -n ${notebookId} --json`,
        true
      );
      const sourceId = addSourceResult.source_id;
      console.log(`✅ Source ID: ${sourceId}\n`);

      // Step 3: 等待源处理完成
      console.log('3️⃣ 等待文章处理完成...');
      this.exec(`notebooklm source wait ${sourceId} -n ${notebookId} --timeout 120`);
      console.log('✅ 文章处理完成\n');

      // Step 4: 生成信息图（带重试）
      console.log('4️⃣ 生成信息图...');
      let generateSuccess = false;
      let lastError = null;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const generateResult = this.exec(
            `notebooklm generate infographic "${instructions}" -n ${notebookId} --json`,
            true
          );
          artifactId = generateResult.artifact_id || generateResult.task_id;
          console.log(`✅ 任务ID: ${artifactId}\n`);
          generateSuccess = true;
          break;
        } catch (error) {
          lastError = error;
          if (error.message.includes('rate limit') && attempt < this.maxRetries) {
            console.log(`⚠️ 遇到速率限制，等待 ${this.retryDelay / 1000} 秒后重试... (尝试 ${attempt}/${this.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          } else {
            throw error;
          }
        }
      }

      if (!generateSuccess) {
        throw lastError || new Error('生成信息图失败');
      }

      // Step 5: 等待生成完成
      console.log('5️⃣ 等待生成完成（可能需要几分钟）...');
      try {
        this.exec(
          `notebooklm artifact wait ${artifactId} -n ${notebookId} --timeout ${this.timeout}`
        );
        console.log('✅ 生成完成\n');
      } catch (error) {
        if (error.status === 2) {
          // Timeout
          console.log('⏱️ 超时，检查状态...');
          const artifactList = this.exec(
            `notebooklm artifact list -n ${notebookId} --json`,
            true
          );
          const artifact = artifactList.artifacts?.find(a => a.id === artifactId);

          if (artifact?.status === 'completed') {
            console.log('✅ 实际已完成\n');
          } else {
            throw new Error(`生成超时，当前状态: ${artifact?.status || 'unknown'}`);
          }
        } else {
          throw error;
        }
      }

      // Step 6: 下载信息图
      console.log('6️⃣ 下载信息图...');
      this.exec(
        `notebooklm download infographic "${outputPath}" -a ${artifactId} -n ${notebookId}`
      );
      console.log(`✅ 已保存到: ${outputPath}\n`);

      // Step 7: 清理临时 notebook
      console.log('7️⃣ 清理临时文件...');
      try {
        this.exec(`notebooklm notebook delete ${notebookId}`);
        console.log('✅ 清理完成\n');
      } catch (error) {
        console.log('⚠️ 清理失败（非致命错误）\n');
      }

      return outputPath;

    } catch (error) {
      console.error('\n❌ 生成失败:', error.message);

      // 尝试清理
      if (notebookId) {
        try {
          this.exec(`notebooklm notebook delete ${notebookId}`);
        } catch (cleanupError) {
          // 忽略清理错误
        }
      }

      throw error;
    }
  }
}

module.exports = NotebookLMCoverGenerator;

// ========== CLI 入口 ==========
if (require.main === module) {
  const [, , articlePath, outputPath, title, instructions] = process.argv;

  if (!articlePath || !outputPath) {
    console.error('用法: node notebooklm-cover-generator.js <文章路径> <输出路径> [标题] [生成指令]');
    console.error('\n示例:');
    console.error('  node notebooklm-cover-generator.js article.md cover.png');
    console.error('  node notebooklm-cover-generator.js article.md cover.png "数字人民币" "创建对比风格的信息图"');
    process.exit(1);
  }

  const generator = new NotebookLMCoverGenerator();

  generator
    .generate(articlePath, outputPath, { title, instructions })
    .then((path) => {
      console.log('🎉 成功！');
      console.log(`封面图: ${path}`);
    })
    .catch((err) => {
      console.error('❌ 失败:', err.message);
      process.exit(1);
    });
}
