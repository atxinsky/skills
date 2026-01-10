---
description: Save conversation or content to Notion database
allowed-tools: Bash(*), Write, Read
argument-hint: [title] [content]
---

# Save to Notion

Save content to your Notion database with full Markdown formatting support.

## Prerequisites

环境变量 `NOTION_API_KEY` 必须已设置。

## Instructions

1. Parse arguments:
   - First argument: title (required, default to date+topic if empty)
   - Remaining: content (optional, or summarize conversation)

2. If no content provided, summarize the key points from current conversation

3. **For long content (recommended)**: Write to temp file first, then upload

   ```bash
   # Step 1: Write content to temp file using Write tool
   # File path: C:\Users\atxin\temp_notion_content.md

   # Step 2: Upload (uses NOTION_API_KEY env var automatically)
   python "C:\Users\atxin\.claude\skills\notion-save-skill\scripts\save_to_notion.py" --title "TITLE" --file "C:\Users\atxin\temp_notion_content.md"
   ```

4. **For short content**: Use inline (but avoid $ signs in bash)

   ```bash
   python "C:\Users\atxin\.claude\skills\notion-save-skill\scripts\save_to_notion.py" --title "TITLE" --content "SHORT_CONTENT"
   ```

5. Report success/failure to user with the Notion page URL

## Markdown Support

- Headings: # ## ###
- Lists: - item, 1. item
- Tables: | col | col |
- Code blocks: \`\`\`language
- Bold/Italic/Links

## Important Notes

- API key from `NOTION_API_KEY` environment variable
- Use temp file for content with $ signs or >500 chars
