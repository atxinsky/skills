# GitHub Stars to Notion Sync

## Description

Sync GitHub starred repos to a Notion database. Fetches all starred repos, classifies them by category, creates Notion pages with metadata and README content, and updates a categorized directory.

## Trigger

When the user says "同步stars", "stars to notion", "github stars整理", "更新stars数量", "更新github stars", or "/github-stars-to-notion".

## Configuration

- **GitHub User**: `atxinsky` (from `gh api`)
- **Notion Database**: `github base` at data_source `collection://325cc7dd-3404-80d8-874a-000b767ae11e`
- **Parent Page**: `好用的github` at `2e6cc7dd34048086af72ce0ad1a7e00d`
- **Categories** (10):
  1. Agent / 多智能体与方法论
  2. 浏览器自动化 / Browser for Agents
  3. 知识库 / 记忆（Memory）
  4. 研发平台 / DevOps
  5. 设计语言 / UI
  6. 基础设施 / 数据库方向
  7. 命令行 / Agent-Native 软件
  8. 自动研究 / 训练自动化
  9. 本地工具 UI

## Workflow

### Step 1: Fetch All Stars

```bash
gh api "users/atxinsky/starred?per_page=100&page={1,2,3,...}" \
  --jq '.[] | {full_name, html_url, description, language, stargazers_count, topics}'
```

Paginate until no more results (check Link header for last page).

### Step 2: Get Existing Notion Entries

Use `mcp__claude_ai_Notion__notion-search` on data_source `collection://325cc7dd-3404-80d8-874a-000b767ae11e` to find already-added repos. Also skip user's own repos (`atxinsky/*`).

### Step 3: Classify New Repos

Use keyword matching on description + topics:

| Keywords | Category |
|----------|----------|
| agent, multi-agent, swarm, agentic, autonomous | Agent / 多智能体与方法论 |
| browser, cdp, playwright, puppeteer, headless | 浏览器自动化 / Browser for Agents |
| memory, knowledge, rag, corpus, dataset, nlp | 知识库 / 记忆（Memory） |
| devops, ci/cd, pipeline, deploy, docker, k8s | 研发平台 / DevOps |
| design, ui, ux, component, icon, theme, css | 设计语言 / UI |
| database, db, sql, storage, cache, observab | 基础设施 / 数据库方向 |
| cli, terminal, shell, claude-code, skill, mcp | 命令行 / Agent-Native 软件 |
| research, paper, learn, tutorial, train, llm | 自动研究 / 训练自动化 |
| Default fallback | 本地工具 UI |

Priority: check agent keywords first, then browser, then others. If both agent and browser match, use browser.

### Step 4: Create Notion Pages

Use `mcp__claude_ai_Notion__notion-create-pages` with:

```json
{
  "parent": {"data_source_id": "325cc7dd-3404-80d8-874a-000b767ae11e"},
  "pages": [
    {
      "properties": {
        "Name": "[**{repo_name}**]({github_url})",
        "about": "{description, max 200 chars}",
        "type": "{category}",
        "Stars": {stargazers_count}
      },
      "content": "## {repo_name}\n\n**Stars:** {stars} | **Language:** {language}\n\n### 简介\n\n{description}\n\n[GitHub 仓库]({github_url})"
    }
  ]
}
```

Batch 10 pages per API call. Use background agents for parallel processing if >30 repos.

### Step 6: Update Stars for Existing Entries

Periodically refresh star counts for all existing entries:

1. Fetch parent page `2e6cc7dd34048086af72ce0ad1a7e00d` to get all `<mention-page>` entries
2. For each page, fetch it to extract GitHub URL from the Name property: `[**name**](https://github.com/owner/repo)`
3. Call GitHub API: `gh api repos/{owner}/{repo} --jq '.stargazers_count'`
4. Update the page: `mcp__claude_ai_Notion__notion-update-page` with `{"page_id": "...", "command": "update_properties", "properties": {"Stars": <number>}}`

Process pages in parallel batches of 5-8. Skip pages without a valid GitHub URL in the Name field.

### Step 5: Update Directory

Fetch page `2e6cc7dd34048086af72ce0ad1a7e00d` to get current directory content. Use `mcp__claude_ai_Notion__notion-update-page` with `update_content` to add new `<mention-page>` entries under each category section.

## Database Schema

```sql
CREATE TABLE "collection://325cc7dd-3404-80d8-874a-000b767ae11e" (
  url TEXT UNIQUE,
  createdTime TEXT,
  "type" TEXT,     -- category string
  "about" TEXT,    -- repo description
  "Stars" FLOAT,   -- GitHub stargazers_count (number)
  "Name" TEXT      -- markdown link: [**name**](url)
)
```

## Notes

- Stars count in description: use "X.XK" format for 1000+
- Skip repos with no description: use repo name as about
- Chinese descriptions: keep as-is, don't translate
- Emoji in descriptions: keep as-is
