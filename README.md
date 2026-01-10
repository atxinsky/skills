# Claude Code 技能与命令完整手册

**生成时间**: 2026-01-10
**Skills 数量**: 19
**Commands 数量**: 5
**Agents 数量**: 1

---

## 一、Skills（技能）

Skills 是 Claude Code 的核心能力模块，会根据上下文**自动触发**或通过 `/skill-name` 手动调用。

### 快速索引

| 技能 | 触发场景 | 自动触发 |
|------|----------|----------|
| brainstorming | 开始任何创意/功能开发前 | ✅ |
| writing-plans | 有需求/spec，准备写代码前 | ✅ |
| executing-plans | 有计划待执行时 | ✅ |
| test-driven-development | 实现任何功能/bugfix前 | ✅ |
| systematic-debugging | 遇到bug/测试失败/异常行为 | ✅ |
| verification-before-completion | 准备说"完成了"之前 | ✅ |
| requesting-code-review | 完成功能/PR前 | ✅ |
| receiving-code-review | 收到code review反馈时 | ✅ |
| dispatching-parallel-agents | 2+独立任务可并行时 | ✅ |
| subagent-driven-development | 执行有独立任务的计划时 | ✅ |
| using-git-worktrees | 需要隔离工作空间时 | ✅ |
| finishing-a-development-branch | 实现完成准备合并时 | ✅ |
| frontend-design | 构建前端组件/页面时 | ✅ |
| ui-ux-pro-max | UI/UX设计相关 | ✅ |
| research | "研究一下"、"分析一下" | ✅ |
| notion-save-skill | "保存到Notion" | ✅ |
| notebooklm | 查询NotebookLM笔记本 | 手动 |
| writing-skills | 创建/编辑skill | 手动 |
| using-superpowers | 技能调度核心（内部） | 自动 |

---

### 详细说明

#### 1. brainstorming
**触发条件**: 任何创意工作前 - 创建功能、构建组件、添加功能、修改行为
**作用**: 通过苏格拉底式对话将想法转化为完整的设计和规格
**工作流程**:
1. 一次问一个问题来澄清需求
2. 提出2-3个方案及其权衡
3. 分段呈现设计（200-300字/段），逐段确认
4. 将设计写入 `docs/plans/YYYY-MM-DD-<topic>-design.md`

**使用方式**: `/brainstorm 功能描述` 或自动触发

---

#### 2. writing-plans
**触发条件**: 有spec/需求，准备写代码前
**作用**: 创建分钟级的详细实施计划
**输出**: 任务清单，每个任务包含要修改的文件、代码示例、验证步骤

**使用方式**: `/write-plan` 或自动触发

---

#### 3. executing-plans
**触发条件**: 有计划文件待执行
**作用**: 分批执行计划，每批次后有review检查点
**特点**: 在新session中执行，保持计划与执行分离

**使用方式**: `/execute-plan` 或自动触发

---

#### 4. test-driven-development
**触发条件**: 实现任何功能或bugfix前
**作用**: 强制TDD流程 - 红→绿→重构
**核心原则**:
- 先写测试，看它失败
- 写最少代码让测试通过
- 重构，保持测试绿色

**使用方式**: 自动触发

---

#### 5. systematic-debugging
**触发条件**: 遇到bug、测试失败、异常行为
**作用**: 结构化调试，避免随机尝试
**流程**:
1. 复现问题
2. 收集证据
3. 形成假设
4. 验证假设
5. 修复并验证

**使用方式**: 自动触发

---

#### 6. verification-before-completion
**触发条件**: 准备声明工作完成前
**作用**: 运行验证命令，确认输出后再声明成功
**原则**: 证据在前，断言在后

**使用方式**: 自动触发

---

#### 7. requesting-code-review
**触发条件**: 完成任务、实现主要功能、合并前
**作用**: 调度code-reviewer子代理检查问题

**使用方式**: 自动触发

---

#### 8. receiving-code-review
**触发条件**: 收到代码审查反馈时
**作用**: 技术评估反馈，而非盲目同意或实现
**原则**: 验证建议的技术正确性，不要表演性同意

**使用方式**: 自动触发

---

#### 9. dispatching-parallel-agents
**触发条件**: 2+独立任务可并行
**作用**: 并行派发子代理处理独立任务
**适用场景**: 不同测试文件失败、不同子系统bug

**使用方式**: 自动触发

---

#### 10. subagent-driven-development
**触发条件**: 执行有独立任务的实施计划
**作用**: 每个任务派发新子代理，两阶段review（spec合规→代码质量）

**使用方式**: 自动触发

---

#### 11. using-git-worktrees
**触发条件**: 需要隔离工作空间的功能开发
**作用**: 创建git worktree，共享仓库但隔离分支

**使用方式**: 自动触发

---

#### 12. finishing-a-development-branch
**触发条件**: 实现完成、测试通过、准备集成
**作用**: 呈现完成选项（merge/PR/cleanup）

**使用方式**: 自动触发

---

#### 13. frontend-design
**触发条件**: 构建前端组件、页面、应用
**作用**: 创建有设计感的前端代码，避免"AI味"
**特点**: 注重美学细节，生成可用的真实代码

**使用方式**: 自动触发

---

#### 14. ui-ux-pro-max
**触发条件**: UI/UX设计相关任务
**内容**:
- 50种设计风格
- 21个调色板
- 50组字体搭配
- 20种图表类型
- 8种技术栈（React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind）

**使用方式**: 自动触发

---

#### 15. research
**触发条件**: "研究一下"、"帮我研究"、"分析一下"
**作用**: 深度研究分析，用于股票/加密货币/商品期货
**输出**: 可直接用于交易决策的研究报告，自动保存到Notion

**使用方式**: `/research 标的` 或自动触发

---

#### 16. notion-save-skill
**触发条件**: "保存到Notion"、"记录到Notion"
**作用**: 将内容保存到Notion数据库

**使用方式**: `/savenotion` 或自动触发

---

#### 17. notebooklm
**触发条件**: 查询Google NotebookLM笔记本
**作用**: 从上传的文档中获取Gemini的源引用答案
**特点**: 减少幻觉，答案仅来自文档

**使用方式**: 手动调用

---

#### 18. writing-skills
**触发条件**: 创建/编辑skill
**作用**: Skill开发的TDD - 写测试、验证、部署

**使用方式**: 手动调用

---

#### 19. using-superpowers
**触发条件**: 每次对话开始（内部）
**作用**: 技能调度核心，决定调用哪些skill
**原则**: 即使1%可能适用，也必须调用skill

**使用方式**: 自动（内部）

---

## 二、Commands（命令）

命令是用户可直接调用的快捷方式。

| 命令 | 描述 | 使用场景 |
|------|------|----------|
| `/brainstorm` | 启动需求澄清对话 | 开始新功能开发 |
| `/write-plan` | 创建详细实施计划 | 有需求/spec后 |
| `/execute-plan` | 分批执行计划 | 有计划待执行 |
| `/save` | 导出对话到Markdown | 保存到 D:\claude md |
| `/savenotion` | 保存到Notion数据库 | 持久化内容 |

---

## 三、Agents（子代理）

Agents 是专门的子代理，由 Skills 自动调度。

### code-reviewer
**描述**: 高级代码审查员，检查计划对齐和代码质量
**调度时机**: 完成主要项目步骤后
**审查内容**:
1. **计划对齐分析** - 对比实现与原计划
2. **代码质量评估** - 模式、错误处理、类型安全
3. **架构设计审查** - SOLID原则、关注点分离
4. **文档标准检查** - 注释、文档完整性
5. **问题分类** - Critical/Important/Suggestion

---

## 四、交互式选择功能

关于你图片中的多选界面，这是 **AskUserQuestion** 工具的功能。

### 如何触发

这个功能**可以自动触发**！当 Claude 需要：
- 澄清需求
- 选择方案
- 确认配置

它会自动弹出这种交互式选择界面。

### 示例

比如我现在就可以问你：

---

## 五、典型工作流

```
用户: "给期货系统加个网格交易策略"
     ↓
[自动] brainstorming → 苏格拉底对话澄清需求
     ↓
[自动] writing-plans → 生成实施计划
     ↓
[自动] test-driven-development → 先写测试
     ↓
[自动] systematic-debugging → 修bug
     ↓
[自动] verification-before-completion → 验证完成
     ↓
[自动] requesting-code-review → 代码审查
     ↓
[自动] finishing-a-development-branch → 合并/PR
```

---

## 六、更新方式

```bash
# 更新 superpowers
cd C:\Users\atxin\.claude\superpowers && git pull

# 重新复制 skills
Copy-Item -Path 'C:\Users\atxin\.claude\superpowers\skills\*' -Destination 'C:\Users\atxin\.claude\skills\' -Recurse -Force

# 重新复制 commands
Copy-Item -Path 'C:\Users\atxin\.claude\superpowers\commands\*' -Destination 'C:\Users\atxin\.claude\commands\' -Recurse -Force
```

---

**文件位置**:
- Skills: `C:\Users\atxin\.claude\skills\`
- Commands: `C:\Users\atxin\.claude\commands\`
- Superpowers源码: `C:\Users\atxin\.claude\superpowers\`
