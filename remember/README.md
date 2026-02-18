# Remember — Claude Code 本地长期记忆系统

> 纯本地、零 API 开销的跨会话记忆方案。每次开新会话自动回忆历史上下文，会话结束自动保存记忆。

## 原理

```
会话开始 → SessionStart hook 自动读取记忆 → 注入对话上下文
会话结束 → Stop hook 提醒 Claude 自动保存记忆（无需手动 /remember）
手动保存 → /remember skill 可随时手动触发
```

## 快速安装

### 1. 创建目录

```bash
mkdir -p ~/.claude/memory/global
mkdir -p ~/.claude/hooks
mkdir -p ~/.claude/skills/remember
```

### 2. 复制文件

```bash
# 从本仓库复制（假设已 clone 到 ~/skills）
cp ~/skills/remember/SKILL.md ~/.claude/skills/remember/SKILL.md
cp ~/skills/remember/hooks/memory-recall.sh ~/.claude/hooks/memory-recall.sh
cp ~/skills/remember/hooks/memory-auto-save.sh ~/.claude/hooks/memory-auto-save.sh
chmod +x ~/.claude/hooks/memory-recall.sh
chmod +x ~/.claude/hooks/memory-auto-save.sh
```

### 3. 自定义项目映射

编辑 `~/.claude/hooks/memory-recall.sh` 中的 `detect_project()` 函数：

```bash
detect_project() {
  local cwd
  cwd="$(pwd)"
  case "$cwd" in
    *your-project*)  echo "your-project" ;;
    *another-one*)   echo "another" ;;
    *)               echo "general" ;;
  esac
}
```

### 4. 注册 Hooks 到 settings.json

编辑 `~/.claude/settings.json`：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/.claude/hooks/memory-recall.sh",
            "timeout": 15
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/.claude/hooks/memory-auto-save.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

> **注意**：
> - 不要删除已有的 hooks，在数组末尾追加即可
> - WSL 环境用绝对路径如 `/home/yourname/.claude/hooks/memory-recall.sh`
> - Windows Git Bash 用 `/c/Users/yourname/.claude/hooks/memory-recall.sh`

### 5. （可选）白名单记忆目录

如果 settings.json 中有 Write 工具的 `.md` 文件创建警告 hook，在 matcher 中排除记忆目录：

```
&& !(tool_input.file_path matches "\\.claude[/\\\\]memory[/\\\\]")
```

## 使用方式

| 场景 | 操作 | 说明 |
|------|------|------|
| 开新会话 | 自动 | SessionStart hook 自动读取最近 5 条项目记忆 + 3 条全局记忆 |
| 会话结束 | 自动 | Stop hook 提醒 Claude 自动保存重要记忆 |
| 手动保存 | `/remember` | 随时手动触发保存当前会话关键信息 |
| 全局记忆 | `/remember global` | 保存到全局目录（跨项目共享） |

## 目录结构

```
~/.claude/
├── hooks/
│   ├── memory-recall.sh        # SessionStart 自动回忆
│   └── memory-auto-save.sh     # Stop 自动保存提醒
├── skills/
│   └── remember/
│       └── SKILL.md            # /remember 手动保存
└── memory/                     # 记忆存储
    ├── global/                 # 跨项目通用记忆
    ├── project-a/              # 项目专属记忆
    ├── project-b/
    └── ...
```

## 设计原则

- **零依赖**：不需要 pip/npm install 任何东西
- **零 API 开销**：不调用 embedding/VLM，纯本地文件
- **零配置**：装完即用，项目自动识别
- **可迁移**：记忆是纯 markdown，可以 git 同步、复制到其他机器
- **自动化**：会话开始自动回忆，结束自动保存，不需要手动干预
