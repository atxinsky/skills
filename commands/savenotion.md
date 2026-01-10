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
   # File path: C:\Users\atxin\temp_notion_content.md

   # Step 2: Upload using --file parameter
   python "C:\Users\atxin\.claude\skills\notion-save-skill\scripts\save_to_notion.py" --api-key "YOUR_NOTION_API_KEY" --title "TITLE" --file "C:\Users\atxin\temp_notion_content.md"
   ```

4. **For short content**: Use inline (but avoid $ signs in bash)

   ```bash
   python "C:\Users\atxin\.claude\skills\notion-save-skill\scripts\save_to_notion.py" --api-key "YOUR_NOTION_API_KEY" --title "TITLE" --content "SHORT_CONTENT"
   ```

5. Report success/failure to user with the Notion page URL

## Markdown Support

The script now supports full Markdown formatting:
- Headings: # ## ###
- Lists: - item, 1. item
- Tables: | col | col |
- Code blocks: ```language
- Bold: **text**
- Italic: *text*
- Links: [text](url)
- Dividers: ---

## Important Notes

- Use temp file method for any content containing $ signs (prices, etc.)
- Use temp file method for content longer than 500 characters
- Content will be properly formatted in Notion with headings, lists, tables, etc.
