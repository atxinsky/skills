---
description: 从YouTube视频提取音频，按章节分歌曲保存为MP3。输入YouTube链接即可。
allowed-tools: Bash(*), Write, Read
argument-hint: <YouTube链接> [文件夹名]
---

# YouTube 音频提取 & 分歌曲

从YouTube视频提取高质量MP3音频，自动按章节（chapters）分割为单独歌曲文件。

## 参数

- `$ARGUMENTS` 中第一个参数：YouTube链接（必须）
- 第二个参数（可选）：桌面文件夹名，不提供则自动从视频标题生成

## 工作流程

### 1. 获取视频信息

```bash
yt-dlp --dump-json "YOUTUBE_URL" 2>nul > "$TEMP/yt_video_info.json"
```

然后用Python解析JSON，提取：
- 视频标题（title）
- 时长（duration）
- 章节列表（chapters）

```python
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
with open(r'路径/yt_video_info.json', 'r', encoding='utf-8') as f:
    d = json.load(f)
print('Title:', d.get('title',''))
print('Duration:', d.get('duration',''))
chapters = d.get('chapters', [])
print('Chapters:', len(chapters))
for i, c in enumerate(chapters):
    start = c.get('start_time', 0)
    end = c.get('end_time', 0)
    title = c.get('title', '')
    m1, s1 = divmod(int(start), 60)
    m2, s2 = divmod(int(end), 60)
    print(f'  {i+1:2d}. [{m1:02d}:{s1:02d} - {m2:02d}:{s2:02d}] {title}')
```

### 2. 创建桌面文件夹

- 如果用户提供了文件夹名，使用用户指定的名称
- 否则从视频标题中提取关键词作为文件夹名（简短、有意义）
- 路径：`C:\Users\atxin\Desktop\{文件夹名}\`

### 3. 下载并分割

**有章节信息时**（自动分歌曲）：

```bash
yt-dlp -x --audio-format mp3 --audio-quality 0 --split-chapters \
  -o "chapter:C:\Users\atxin\Desktop\{文件夹名}\%(section_number)02d. %(section_title)s.%(ext)s" \
  "YOUTUBE_URL" 2>&1
```

**无章节信息时**（保存为单个文件）：

```bash
yt-dlp -x --audio-format mp3 --audio-quality 0 \
  -o "C:\Users\atxin\Desktop\{文件夹名}\%(title)s.%(ext)s" \
  "YOUTUBE_URL" 2>&1
```

### 4. 清理文件名

下载完成后，用Python清理文件名中的重复编号：

```python
import os, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
folder = r'C:\Users\atxin\Desktop\{文件夹名}'
for f in sorted(os.listdir(folder)):
    if f.endswith('.mp3'):
        # 去除重复编号: "01. 01..标题" -> "01. 标题"
        new_name = re.sub(r'^(\d{2})\. \d{2}\.\.', r'\1. ', f)
        if new_name != f:
            os.rename(os.path.join(folder, f), os.path.join(folder, new_name))
```

### 5. 汇报结果

以表格形式列出所有提取的歌曲：

| # | 歌曲名 | 时长 |
|---|--------|------|
| 01 | ... | MM:SS |

## 注意事项

- 如果遇到 403 错误，先尝试更新 yt-dlp：`pip install --upgrade yt-dlp`
- 如果提示需要 JS runtime，添加 `--js-runtimes node` 参数
- 所有Python输出必须用 `sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')` 处理编码
- JSON临时文件存放在 scratchpad 目录，不要放在用户项目中
- 音质使用最高质量（`--audio-quality 0`，即 V0 VBR）
- 下载超时设置为 600000ms（10分钟）
