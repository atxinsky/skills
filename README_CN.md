# Claude Code Skills 技能库

<p align="center">
  <strong>个人定制化的 Claude Code 技能集合</strong>
</p>

**最后更新**: 2026-01-23
**技能数量**: 35+
**维护者**: [@atxinsky](https://github.com/atxinsky)

---

## 📚 目录

- [开发工作流](#开发工作流)
- [内容创作](#内容创作)
- [学习与研究](#学习与研究)
- [工具集成](#工具集成)
- [UI/UX 设计](#uiux-设计)
- [快速安装](#快速安装)

---

## 🚀 开发工作流

### brainstorming
**触发**: 创建功能、构建组件前
**作用**: 通过苏格拉底式对话将想法转化为完整设计
**命令**: `/brainstorm`

### writing-plans
**触发**: 有需求文档，准备编码前
**作用**: 生成详细实施计划（任务清单、文件修改、验证步骤）
**命令**: `/write-plan`

### test-driven-development
**触发**: 实现任何功能或修复 bug 前
**作用**: 强制 TDD 流程（红→绿→重构）

### systematic-debugging
**触发**: 遇到 bug、测试失败、异常行为
**作用**: 结构化调试（复现→证据→假设→验证→修复）

### requesting-code-review
**触发**: 完成功能、准备合并前
**作用**: 自动调度代码审查

### security-review
**触发**: 涉及认证、敏感数据、API 端点
**作用**: 安全检查清单和最佳实践

### tdd-workflow
**触发**: 编写新功能或重构代码
**作用**: 强制 80%+ 测试覆盖率（单元测试+集成测试+E2E）

### finishing-a-development-branch
**触发**: 实现完成，测试通过
**作用**: 呈现完成选项（merge/PR/cleanup）

---

## ✍️ 内容创作

### chuinb-skill - 行业速成大师
**触发**: `/chuinb [主题]` 或 `/chuiniubi [主题]`
**作用**: 快速掌握陌生行业/领域/技能
**输出**:
- Feynman 式简单解释
- 第一性原理分析
- 行业黑话术语表
- 必知人物介绍（带照片）
- 经典案例分析
- 精选视频（YouTube）
- 闪卡 + 自测问答
- 行动清单

**功能**:
- 自动 WebSearch 最新信息
- 下载真实照片（人物、产品）
- AI 生成概念图（价值链、流程图）
- 下载 YouTube 教学视频
- 生成 Markdown 学习笔记

**依赖**:
- `zimage-skill` - AI 图片生成
- `media-downloader` - 媒体下载

### vchat - 公众号发布助手
**触发**: `/vchat`
**作用**: 从选题到发布的完整流程
**工作流**:
1. 选题推荐（热点分析）
2. 起标题（10 种风格）
3. 写正文（公众号格式）
4. 配图（AI 生成 + 网络下载）
5. 一键发布

**依赖**:
- `topic-picker` - 选题推荐
- `wechat-draft` - 公众号格式草稿
- `publish-workflow` - 发布流程

### humanizer-zh - 中文人性化改写
**触发**: 改写 AI 生成的生硬文本
**作用**: 让文本更自然、更"人"

### article-scorer - 文章质量评分
**触发**: 评估文章质量
**作用**: 多维度打分（可读性、吸引力、逻辑性等）

---

## 📖 学习与研究

### research - 深度研究分析
**触发**: "研究一下"、"分析一下"
**作用**: 股票/加密货币/商品期货的专业交易研究
**输出**: 可直接用于交易决策的研究报告（自动保存到 Notion）

### news-aggregator-skill - 新闻聚合器
**触发**: 获取最新新闻
**来源**: Hacker News, GitHub Trending, Product Hunt, 36Kr, 腾讯新闻, V2EX, 微博
**作用**: 深度解读热点话题

### mental-models - 多视角思考框架
**触发**: "帮我想想"、"分析一下这个问题"、`/think`
**作用**: 用不同职业的思维模式分析问题（基于查理·芒格多元心智模型）

### zlib-to-notebooklm - Z-Library 自动化
**触发**: 从 Z-Library 下载书籍并上传到 NotebookLM
**作用**: 自动创建知识库，支持 PDF/EPUB

---

## 🔧 工具集成

### notion-save-skill - Notion 保存
**触发**: "保存到 Notion"、"记录到 Notion"
**作用**: 保存笔记、研究报告到 Notion 数据库
**命令**: `/savenotion`

### notebooklm - Google NotebookLM
**触发**: 查询笔记本
**作用**: 从文档获取 Gemini 源引用答案（减少幻觉）

### obsidian-skills - Obsidian 集成
**触发**: Obsidian 笔记操作
**作用**: 双向链接、知识管理

### zimage-skill - AI 图片生成
**触发**: 生成概念图、流程图
**模型**: ModelScope Z-Image-Turbo（本地运行）
**使用**:
```bash
python generate.py "prompt" output.jpg
```

### media-downloader - 媒体下载器
**触发**: 下载 YouTube 视频/图片
**功能**:
- 下载视频（支持裁剪）
- 下载图片（Pexels/Pixabay）
- 检查依赖状态

**依赖**: yt-dlp, ffmpeg

### image-generator - 图片生成
**触发**: 批量生成图片
**作用**: 支持多种 AI 图片生成服务

---

## 🎨 UI/UX 设计

### frontend-design
**触发**: 构建前端组件、页面、应用
**作用**: 创建有设计感的前端代码，避免"AI 味"

### ui-ux-pro-max
**内容**:
- 50 种设计风格
- 21 个调色板
- 50 组字体搭配
- 20 种图表类型
- 8 种技术栈（React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind）

---

## 📊 营销与增长

### pain-point-marketing-loop - 痛点营销循环
**触发**: 低成本用户获取
**作用**: 社交媒体痛点分析 → 内容创作 → 流量转化

### topic-picker - 选题推荐
**触发**: 需要内容选题
**作用**: 基于热点数据推荐高流量主题

---

## 🤖 多代理协作

### dispatching-parallel-agents
**触发**: 2+ 独立任务可并行
**作用**: 并行派发子代理

### subagent-driven-development
**触发**: 执行有独立任务的计划
**作用**: 每个任务派发新子代理，两阶段 review

### executing-plans
**触发**: 有计划文件待执行
**作用**: 分批执行，每批次后有 review 检查点

---

## ⚙️ Git 工作流

### using-git-worktrees
**触发**: 需要隔离工作空间
**作用**: 创建 git worktree，共享仓库但隔离分支

### receiving-code-review
**触发**: 收到代码审查反馈
**作用**: 技术评估反馈，验证建议的正确性

### verification-before-completion
**触发**: 准备声明工作完成前
**作用**: 运行验证命令，确认输出（证据在前，断言在后）

---

## 📦 快速安装

### 方法 1: 克隆整个仓库

```bash
# 克隆到 Claude skills 目录
git clone https://github.com/atxinsky/skills.git ~/.claude/skills
```

### 方法 2: 安装单个 skill

```bash
# 进入 skills 目录
cd ~/.claude/skills

# 克隆单个 skill（以 chuinb-skill 为例）
git clone https://github.com/atxinsky/skills.git temp
mv temp/chuinb-skill ./
rm -rf temp
```

### 方法 3: 使用 Claude Code 安装

直接在 Claude Code 中说：

```
帮我安装 https://github.com/atxinsky/skills 中的 chuinb-skill
```

---

## 🔑 环境变量配置

部分 skills 需要配置 API 密钥：

```bash
# ModelScope（用于 zimage-skill）
export MODELSCOPE_API_KEY="ms-xxx"

# Notion（用于 notion-save-skill）
export NOTION_API_KEY="secret_xxx"
export NOTION_DATABASE_ID="xxx"

# Pexels/Pixabay（用于 media-downloader，可选）
export PEXELS_API_KEY="xxx"
export PIXABAY_API_KEY="xxx"
```

**Windows 用户**，添加到 `~/.bashrc` 或系统环境变量。

---

## 🌟 推荐 Skills

### 对于开发者
- `test-driven-development` - 强制 TDD
- `security-review` - 安全检查
- `systematic-debugging` - 结构化调试

### 对于内容创作者
- `chuinb-skill` - 行业速成学习
- `vchat` - 公众号发布
- `humanizer-zh` - 文本优化

### 对于学习者
- `research` - 深度研究
- `mental-models` - 多视角思考
- `zlib-to-notebooklm` - 知识库构建

### 对于交易者
- `research` - 交易标的分析
- `notion-save-skill` - 交易笔记

---

## 📝 使用示例

### 快速学习一个行业

```
/chuinb 区块链
```

Claude 会问你 3 个问题（学习目标、背景、时间），然后自动：
1. 搜索最新信息
2. 下载相关图片/视频
3. 生成 AI 概念图
4. 输出完整学习笔记（Markdown）

### 发布公众号文章

```
/vchat
```

跟随交互式流程：选题 → 起标题 → 写正文 → 配图 → 发布

### 研究一只股票

```
研究一下比特币
```

自动生成交易研究报告并保存到 Notion。

---

## 🤝 贡献

欢迎 PR！如果你有好用的 skills，可以提交到这个仓库。

### 贡献指南

1. Fork 这个仓库
2. 创建你的 skill 目录（参考现有 skill 结构）
3. 编写 `SKILL.md`（必须包含 triggers、description）
4. 提交 PR

---

## 📄 许可证

MIT License

---

## 🔗 相关资源

- [Claude Code 官网](https://claude.ai/code)
- [Anthropic 官方 Skills](https://github.com/anthropics/claude-code-skills)
- [我的博客](https://github.com/atxinsky)

---

**最后更新**: 2026-01-23
**维护者**: [@atxinsky](https://github.com/atxinsky)

如有问题，请提 [Issue](https://github.com/atxinsky/skills/issues)！
