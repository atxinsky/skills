#!/usr/bin/env bash
# Claude Code 本地记忆系统 — SessionStart 回忆钩子
# 每次开启新会话时，自动读取与当前项目相关的历史记忆并注入上下文
set -uo pipefail

# ===== 记忆目录 =====
MEMORY_BASE="$HOME/.claude/memory"

# ===== 项目检测 =====
# 根据当前工作目录匹配项目名，按需修改此映射
detect_project() {
  local cwd
  cwd="$(pwd)"
  case "$cwd" in
    # === 在此添加你的项目映射 ===
    # *project-name*)  echo "project-name" ;;
    # *another-one*)   echo "another" ;;
    *)                 echo "general" ;;
  esac
}

PROJECT="$(detect_project)"

# ===== 收集记忆 =====
memories=""

# 项目记忆（最近 5 条）
if [ -d "$MEMORY_BASE/$PROJECT" ]; then
  files=$(ls -t "$MEMORY_BASE/$PROJECT"/*.md 2>/dev/null | head -5)
  if [ -n "$files" ]; then
    memories+="## 项目记忆 [$PROJECT]\n\n"
    for f in $files; do
      memories+="$(cat "$f")\n\n---\n\n"
    done
  fi
fi

# 全局记忆（最近 3 条）
if [ -d "$MEMORY_BASE/global" ]; then
  files=$(ls -t "$MEMORY_BASE/global"/*.md 2>/dev/null | head -3)
  if [ -n "$files" ]; then
    memories+="## 全局记忆\n\n"
    for f in $files; do
      memories+="$(cat "$f")\n\n---\n\n"
    done
  fi
fi

# ===== 无记忆则静默退出 =====
if [ -z "$memories" ]; then
  exit 0
fi

# ===== 输出 JSON 注入上下文 =====
escape_for_json() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

escaped="$(escape_for_json "$(echo -e "$memories")")"

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<long-term-memory>\n以下是从本地记忆库中检索到的与当前项目相关的历史记忆。请参考这些记忆来理解项目背景、避免重复错误、延续之前的决策。\n\n${escaped}\n</long-term-memory>"
  }
}
EOF

exit 0
