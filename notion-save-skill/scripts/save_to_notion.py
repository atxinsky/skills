#!/usr/bin/env python3
"""Save markdown content to Notion database via API."""

import argparse
import json
import os
import re
import sys
import urllib.request
import urllib.error

DEFAULT_DB_ID = "2f9cc7dd-3404-8073-b096-da5576c8bc9d"
NOTION_VERSION = "2022-06-28"


def parse_inline(text):
    """Parse inline markdown (bold, italic, code, links) into Notion rich_text."""
    rich_texts = []
    pattern = re.compile(
        r'(\*\*(.+?)\*\*)'        # bold
        r'|(\*(.+?)\*)'           # italic
        r'|(`(.+?)`)'             # code
        r'|(\[(.+?)\]\((.+?)\))' # link
    )
    pos = 0
    for m in pattern.finditer(text):
        if m.start() > pos:
            rich_texts.append({"type": "text", "text": {"content": text[pos:m.start()]}})
        if m.group(2):  # bold
            rich_texts.append({"type": "text", "text": {"content": m.group(2)}, "annotations": {"bold": True}})
        elif m.group(4):  # italic
            rich_texts.append({"type": "text", "text": {"content": m.group(4)}, "annotations": {"italic": True}})
        elif m.group(6):  # code
            rich_texts.append({"type": "text", "text": {"content": m.group(6)}, "annotations": {"code": True}})
        elif m.group(8):  # link
            rich_texts.append({"type": "text", "text": {"content": m.group(8), "link": {"url": m.group(9)}}})
        pos = m.end()
    if pos < len(text):
        rich_texts.append({"type": "text", "text": {"content": text[pos:]}})
    if not rich_texts:
        rich_texts.append({"type": "text", "text": {"content": text}})
    return rich_texts


def text_block(content):
    return {"type": "text", "text": {"content": content}}


def md_to_blocks(md_text):
    """Convert markdown text to Notion blocks."""
    blocks = []
    lines = md_text.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]

        # Empty line
        if not line.strip():
            i += 1
            continue

        # Divider
        if line.strip() in ('---', '***', '___'):
            blocks.append({"type": "divider", "divider": {}})
            i += 1
            continue

        # Headings
        if line.startswith('### '):
            blocks.append({"type": "heading_3", "heading_3": {"rich_text": parse_inline(line[4:])}})
            i += 1
            continue
        if line.startswith('## '):
            blocks.append({"type": "heading_2", "heading_2": {"rich_text": parse_inline(line[3:])}})
            i += 1
            continue
        if line.startswith('# '):
            blocks.append({"type": "heading_1", "heading_1": {"rich_text": parse_inline(line[2:])}})
            i += 1
            continue

        # Code block
        if line.strip().startswith('```'):
            lang = line.strip()[3:].strip() or "plain text"
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code_lines.append(lines[i])
                i += 1
            i += 1  # skip closing ```
            code_content = '\n'.join(code_lines)
            # Notion limit: 2000 chars per code block
            if len(code_content) > 2000:
                code_content = code_content[:2000]
            blocks.append({
                "type": "code",
                "code": {
                    "rich_text": [text_block(code_content)],
                    "language": lang
                }
            })
            continue

        # Table
        if '|' in line and i + 1 < len(lines) and re.match(r'^[\s|:-]+$', lines[i + 1]):
            headers = [c.strip() for c in line.strip().strip('|').split('|')]
            i += 2  # skip header and separator
            rows = []
            while i < len(lines) and '|' in lines[i] and lines[i].strip():
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                rows.append(cells)
                i += 1
            width = len(headers)
            table_rows = []
            # header row
            table_rows.append({
                "type": "table_row",
                "table_row": {"cells": [[text_block(h)] for h in headers]}
            })
            for row in rows:
                while len(row) < width:
                    row.append("")
                table_rows.append({
                    "type": "table_row",
                    "table_row": {"cells": [[text_block(c)] for c in row[:width]]}
                })
            blocks.append({
                "type": "table",
                "table": {
                    "table_width": width,
                    "has_column_header": True,
                    "has_row_header": False,
                    "children": table_rows
                }
            })
            continue

        # Blockquote
        if line.startswith('> '):
            quote_lines = []
            while i < len(lines) and lines[i].startswith('> '):
                quote_lines.append(lines[i][2:])
                i += 1
            blocks.append({
                "type": "quote",
                "quote": {"rich_text": parse_inline('\n'.join(quote_lines))}
            })
            continue

        # Numbered list
        m = re.match(r'^(\d+)\.\s+(.*)', line)
        if m:
            blocks.append({
                "type": "numbered_list_item",
                "numbered_list_item": {"rich_text": parse_inline(m.group(2))}
            })
            i += 1
            continue

        # Bullet list
        if line.startswith('- ') or line.startswith('* '):
            blocks.append({
                "type": "bulleted_list_item",
                "bulleted_list_item": {"rich_text": parse_inline(line[2:])}
            })
            i += 1
            continue

        # Paragraph (default)
        # Notion limit: 2000 chars per rich_text
        content = line.strip()
        if len(content) > 2000:
            content = content[:2000]
        blocks.append({
            "type": "paragraph",
            "paragraph": {"rich_text": parse_inline(content)}
        })
        i += 1

    return blocks


def notion_request(url, data, api_key, method=None, retries=3):
    """Make a request to Notion API with retry logic."""
    import time
    body = json.dumps(data).encode('utf-8') if data else None
    if method is None:
        method = 'POST' if data else 'GET'

    last_error = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=body, method=method)
            req.add_header('Authorization', f'Bearer {api_key}')
            req.add_header('Content-Type', 'application/json')
            req.add_header('Notion-Version', NOTION_VERSION)
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            last_error = f"HTTP {e.code}: {e.read().decode('utf-8')}"
            if e.code >= 500 or e.code == 429:  # Server error or rate limit
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            break  # Client error, don't retry
        except (urllib.error.URLError, TimeoutError) as e:
            last_error = str(e)
            time.sleep(2 ** attempt)
            continue

    print(f"Notion API Error after {retries} attempts: {last_error}", file=sys.stderr)
    sys.exit(1)


def create_page(title, blocks, api_key, db_id):
    """Create a Notion page with blocks."""
    # Notion allows max 100 blocks per request
    first_batch = blocks[:100]
    remaining = blocks[100:]

    page_data = {
        "parent": {"database_id": db_id},
        "properties": {
            "Doc name": {
                "title": [{"text": {"content": title}}]
            }
        },
        "children": first_batch
    }

    result = notion_request("https://api.notion.com/v1/pages", page_data, api_key)
    page_id = result['id']
    page_url = result['url']

    # Append remaining blocks in batches (PATCH method required)
    while remaining:
        batch = remaining[:100]
        remaining = remaining[100:]
        notion_request(
            f"https://api.notion.com/v1/blocks/{page_id}/children",
            {"children": batch},
            api_key,
            method='PATCH'
        )

    return page_id, page_url


def main():
    parser = argparse.ArgumentParser(description='Save markdown to Notion')
    parser.add_argument('--title', required=True, help='Page title')
    parser.add_argument('--content', help='Inline markdown content')
    parser.add_argument('--file', help='Read content from file')
    parser.add_argument('--api-key', help='Notion API key')
    parser.add_argument('--db-id', help='Notion database ID')
    parser.add_argument('--list', action='store_true', help='List recent pages')
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get('NOTION_API_KEY', '')
    db_id = args.db_id or DEFAULT_DB_ID

    if not api_key:
        print("Error: No API key. Use --api-key or set NOTION_API_KEY", file=sys.stderr)
        sys.exit(1)

    if args.list:
        result = notion_request(
            f"https://api.notion.com/v1/databases/{db_id}/query",
            {"page_size": 10, "sorts": [{"timestamp": "created_time", "direction": "descending"}]},
            api_key
        )
        for page in result.get('results', []):
            title = page['properties'].get('Name', {}).get('title', [{}])
            name = title[0].get('plain_text', 'Untitled') if title else 'Untitled'
            print(f"  {name} — {page['url']}")
        return

    # Get content
    if args.file:
        with open(args.file, 'r', encoding='utf-8') as f:
            content = f.read()
    elif args.content:
        content = args.content
    else:
        print("Error: Provide --content or --file", file=sys.stderr)
        sys.exit(1)

    blocks = md_to_blocks(content)
    page_id, page_url = create_page(args.title, blocks, api_key, db_id)
    print(f"Saved to Notion: {page_url}")


if __name__ == '__main__':
    main()
