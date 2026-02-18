#!/usr/bin/env bash
# Claude Code 本地记忆系统 — Stop 自动提醒保存记忆
# 在 Claude 完成响应后提醒自动保存会话记忆
set -uo pipefail

cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "Stop",
    "additionalContext": "<auto-remember-reminder>\n如果本次会话有重要内容（关键决策、代码修改、发现教训、待办事项），请自动执行 /remember skill 保存记忆。\n不需要用户手动触发，直接保存即可。\n如果本次只是简单问答或闲聊，则忽略此提醒。\n</auto-remember-reminder>"
  }
}
EOF

exit 0
