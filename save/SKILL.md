---
description: Export full conversation to markdown file in D:\claude md
allowed-tools: Bash(*), Write
argument-hint: [optional-topic]
---

# Export Full Conversation

Export the ENTIRE conversation (all messages from user and assistant) to a markdown file.

## Instructions

1. Create filename: `D:\claude md\{YYYY-MM-DD}_{HH-MM}_{topic}.md`
   - If topic provided: use $ARGUMENTS
   - If no topic: use "session"

2. Write ALL conversation content to the file:
   - Every user message
   - Every assistant response
   - Code blocks preserved
   - Tool outputs summarized

3. Format:
```markdown
# Claude Code Chat Log
**Date**: {full datetime}
**Topic**: {topic}

---

## User
{user message}

## Assistant
{assistant response}

---
(repeat for all messages)
```

4. Confirm save location to user

Save directory: `D:\claude md\`
