# Feishu Post Skill

Send rich text messages (Post/富文本) to Feishu/Lark. 
Designed for messages containing code blocks or structured text that Feishu Cards handle poorly.

## Usage

```bash
node skills/feishu-post/send.js --target "ou_..." --text "Markdown content" --title "Optional Title"
```

## Features
- **Markdown Parsing:** Automatically converts Markdown code blocks (\`\`\`) to Feishu native code blocks.
- **Rich Text:** Supports basic text paragraphs.
- **Auto-Target:** Infers target from environment or context if omitted.

## Options
- `-t, --target <id>`: Target Open ID (`ou_`) or Chat ID (`oc_`).
- `-x, --text <text>`: Message content (Markdown).
- `-f, --text-file <path>`: Read content from file.
- `--title <title>`: Post title.
