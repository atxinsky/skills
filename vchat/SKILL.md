---
description: WeChat Draft - 公众号一键发布
allowed-tools: Bash(*), Write, Read
argument-hint: [话题或文章路径]
---

# WeChat Draft - 公众号一键发布

将内容自动发布到微信公众号草稿箱。

## Instructions

1. 如果参数是 .md 文件路径，直接用该文件发布
2. 如果参数是话题/主题，先生成公众号风格文章，保存为 temp md，再发布
3. 生成文章时注意公众号风格：段落短、金句多、善用小标题、开头抓眼球

### 生成文章流程

1. Write content to `/Users/tretra/temp_wechat_article.md`
2. Also save to Obsidian: `/Users/tretra/Desktop/tretra本地ob仓库/tretra本地仓库/`
3. Also save to Notion via: `python3 "/Users/tretra/.claude/commands/notion-save-skill/scripts/save_to_notion.py" --title "TITLE" --file FILE --api-key "YOUR_NOTION_API_TOKEN"`
4. Publish to WeChat draft:

```bash
node "/Users/tretra/.claude/commands/wechat-draft/wechat-publisher.js" "/Users/tretra/temp_wechat_article.md"
```

### 直接发布已有文件

```bash
node "/Users/tretra/.claude/commands/wechat-draft/wechat-publisher.js" "文章路径.md" ["封面图.png"]
```

## Config

- AppID: wxf2f1ac4b86085ef8
- AppSecret: YOUR_WECHAT_APP_SECRET
- 公众号名称: 新资产通证研究
- 默认作者: 新资产通证研究

## Notes

- 只创建草稿，不会直接发布
- 发布前在公众号后台预览确认
- 无封面图时草稿可能显示异常，建议准备封面
