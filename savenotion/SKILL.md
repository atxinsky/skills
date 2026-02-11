---
description: Save conversation or content to Notion database
allowed-tools: Bash(*), Write, Read
argument-hint: [title] [content]
---

# Save to Notion

Save content to your Notion database with full Markdown formatting support.

## Instructions

1. Parse arguments:
   - First argument: title (required, default to date+topic if empty)
   - Remaining: content (optional, or summarize conversation)

2. If no content provided, summarize the key points from current conversation

3. **For long content (recommended)**: Write to temp file first, then upload

   ```bash
   # Step 1: Write content to temp file using Write tool
   # File path: /Users/tretra/temp_notion_content.md

   # Step 2: Upload
   python3 "/Users/tretra/.claude/commands/notion-save-skill/scripts/save_to_notion.py" --title "TITLE" --file "/Users/tretra/temp_notion_content.md" --api-key "YOUR_NOTION_API_TOKEN"
   ```

4. **For short content**: Use inline (but avoid $ signs in bash)

   ```bash
   python3 "/Users/tretra/.claude/commands/notion-save-skill/scripts/save_to_notion.py" --title "TITLE" --content "SHORT_CONTENT" --api-key "YOUR_NOTION_API_TOKEN"
   ```

5. Report success/failure to user with the Notion page URL

## Markdown Support

- Headings: # ## ###
- Lists: - item, 1. item
- Tables: | col | col |
- Code blocks: \`\`\`language
- Bold/Italic/Links

## Important Notes

- Database ID: 2f9cc7dd-3404-8073-b096-da5576c8bc9d
- Use temp file for content with $ signs or >500 chars
