---
name: video-voiceover
description: 视频配音+字幕+BGM一条龙。给视频配上AI语音旁白、烧录字幕、添加背景音乐。用户提供视频文件+配音脚本（Markdown），自动完成全流程。触发词：'/voiceover'、'配音'、'给视频配音'、'加字幕'、'加旁白'。
---

# Video Voiceover — 视频配音工作流

本地 GPU 配音 + FFmpeg 合成的全自动流水线。

## 工具链

| 工具 | 位置 | 用途 |
|------|------|------|
| CosyVoice2-0.5B | `D:\AI-Tools\CosyVoice\` | 本地 TTS 配音（RTX 5080 GPU） |
| Python venv | `D:\AI-Tools\CosyVoice\venv\Scripts\python.exe` | CosyVoice 运行环境 |
| FFmpeg | 系统 PATH | 视频合并、字幕烧录、音频混合 |

## 可用音色

| 音色 Key | 参考音频 | 适用场景 |
|----------|----------|----------|
| narrator | `asset/ref/zh_male_narrator.wav` | 沉稳男声旁白 |
| deep | `asset/ref/zh_male_deep.wav` | 低沉男声 |
| sweet | `asset/ref/zh_female_sweet.wav` | 甜美女声 |
| angry | `asset/ref/zh_female_angry.wav` | 激昂女声 |

参考音频的 prompt_text（必须与参考音频内容匹配）：
- narrator: `在这个宁静的夜晚，远处的灯火逐渐亮了起来，仿佛在诉说着一个关于希望的故事。`
- deep: `唉，你看看这个情况，实在是让人心酸，我真的没有办法了。`
- sweet: `哎呀，这也太让人失望了吧，本来以为会很好的呢，结果全完了。`
- angry: `我真的太生气了，这件事情绝对不能就这么算了，我一定要讨个说法！`

## 完整工作流（按顺序执行）

### Step 0: 用户输入

用户需要提供：
1. **视频文件路径**（如 `D:\xxx\video.mp4`）
2. **配音脚本**（Markdown 格式，包含时间轴+台词）

如果用户没有配音脚本，先用 FFmpeg 获取视频信息，然后帮用户写脚本。

### Step 1: 解析配音脚本

从 Markdown 中提取：
- 每段配音的 **时间窗口**（开始时间 — 结束时间）
- **台词文本**
- **音色选择**（默认 narrator）
- **语速**（默认 0.85，脚本要求慢就 0.75-0.8，正常 0.85-0.9）

### Step 2: 生成配音（CosyVoice2）

生成 Python 脚本并用 CosyVoice venv 执行：

```python
"""配音生成脚本模板"""
import sys, os, time
sys.path.insert(0, '.')
sys.path.insert(0, 'third_party/Matcha-TTS')
import torch, soundfile as sf
from cosyvoice.cli.cosyvoice import CosyVoice2

model = CosyVoice2('pretrained_models/CosyVoice2-0.5B', load_jit=False, load_trt=False)

# 音色定义
VOICES = {
    'narrator': {
        'wav': 'asset/ref/zh_male_narrator.wav',
        'text': '在这个宁静的夜晚，远处的灯火逐渐亮了起来，仿佛在诉说着一个关于希望的故事。',
    },
    'deep': {
        'wav': 'asset/ref/zh_male_deep.wav',
        'text': '唉，你看看这个情况，实在是让人心酸，我真的没有办法了。',
    },
    'sweet': {
        'wav': 'asset/ref/zh_female_sweet.wav',
        'text': '哎呀，这也太让人失望了吧，本来以为会很好的呢，结果全完了。',
    },
    'angry': {
        'wav': 'asset/ref/zh_female_angry.wav',
        'text': '我真的太生气了，这件事情绝对不能就这么算了，我一定要讨个说法！',
    },
}

# SCENES = [(文件名, 台词, 音色key, 语速), ...]
# 根据用户脚本填充

output_dir = '<项目输出目录>/配音'
os.makedirs(output_dir, exist_ok=True)

for idx, (filename, tts_text, voice_key, speed) in enumerate(SCENES, 1):
    voice = VOICES[voice_key]
    for result in model.inference_zero_shot(
        tts_text,
        prompt_text=voice['text'],
        prompt_wav=voice['wav'],
        stream=False,
        speed=speed,
    ):
        audio = result['tts_speech'].squeeze().cpu().numpy()
        sf.write(f'{output_dir}/{filename}.wav', audio, model.sample_rate)
```

**执行命令**：
```bash
cd D:/AI-Tools/CosyVoice && D:/AI-Tools/CosyVoice/venv/Scripts/python.exe <脚本路径>
```

**关键注意事项**：
- venv 路径是 `venv/` 不是 `.venv/`
- 必须 `cd D:/AI-Tools/CosyVoice` 后再执行（模型路径是相对路径）
- f-string 内不能有反斜杠，需提前用变量存储
- RTX 5080 上 10 段配音约 40-50 秒

### Step 3: 合并音频轨道

用 FFmpeg `adelay` + `amix` 将多段配音按时间轴合并为一条音轨：

```bash
ffmpeg -y \
  -i clip1.wav -i clip2.wav ... \
  -filter_complex \
  "[0:a]adelay=1000|1000[a0]; [1:a]adelay=4000|4000[a1]; ... \
   [a0][a1]...amix=inputs=N:duration=longest[out]" \
  -map "[out]" -ar 48000 merged_voice.wav
```

### Step 4: 生成 BGM（可选）

两种方式：
1. **合成音**：用 numpy 生成五声音阶 pad + 旋律点缀（简约风）
2. **用户提供**：用户自带 BGM 文件

合成 BGM 模板见 `merge_suzhou.py` 中的 `generate_bgm()` 函数。

### Step 5: 生成字幕文件

生成 SRT 字幕文件，长句拆分为每条 2-3 秒：

```
1
00:00:01,000 --> 00:00:04,000
第一行字幕文本
第二行（可选）
```

### Step 6: 最终合并

输出两个版本：

**版本1 — 无字幕**（视频流直接 copy，速度快）：
```bash
ffmpeg -y -i video.mp4 -i merged_voice.wav -i bgm.wav \
  -filter_complex "[1:a]volume=1.0[voice]; [2:a]volume=0.3[bgm]; \
   [voice][bgm]amix=inputs=2:duration=first[audio]" \
  -map 0:v -map "[audio]" -c:v copy -c:a aac -b:a 192k -shortest output.mp4
```

**版本2 — 带字幕**（用 drawtext 烧录，不用 subtitles filter）：
```bash
ffmpeg -y -i video.mp4 -i merged_voice.wav -i bgm.wav \
  -filter_complex \
  "[0:v]drawtext=text='字幕':fontfile=C\\:/Windows/Fonts/msyh.ttc:\
   fontsize=38:fontcolor=white:borderw=2:bordercolor=black:\
   x=(w-text_w)/2:y=h-150:enable='between(t,1,4)', \
   ... 更多 drawtext ...[v]; \
   [1:a]volume=1.0[voice]; [2:a]volume=0.3[bgm]; \
   [voice][bgm]amix=inputs=2:duration=first[audio]" \
  -map "[v]" -map "[audio]" \
  -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k \
  -shortest output_字幕.mp4
```

**关键教训（Windows 环境）**：
- **用 drawtext 不用 subtitles filter**：subtitles filter 在含中文路径时容易失败
- drawtext 中冒号要转义 `\\:`
- 字体路径用 `C\\:/Windows/Fonts/msyh.ttc`（微软雅黑）
- 双行字幕分两个 drawtext，y 坐标分别设为 `h-180` 和 `h-130`
- subprocess 用 `capture_output=True` 时加 `encoding='utf-8', errors='replace'` 避免 GBK 解码错误

## 产出清单

每次执行完毕后应产出：

| 文件 | 说明 |
|------|------|
| `<项目>_配音/` 目录 | 所有配音 WAV 片段 |
| `<项目>_字幕.srt` | SRT 字幕文件 |
| `<项目>_bgm.wav` | 背景音乐 |
| `<项目>_完整版.mp4` | 无字幕版本 |
| `<项目>_完整版_字幕.mp4` | 带字幕版本 |

## 历史项目参考

| 项目 | 脚本位置 | 产出 |
|------|----------|------|
| 湛蓝科技 | `D:\AI-Tools\CosyVoice\generate_all.py` | 11段配音，3种音色 |
| 太极圈宣传片 | `D:\BaiduNetdiskDownload\视频素材\太极圈\` | 14段配音，Playwright录制 |
| 苏州重组 | `D:\BaiduNetdiskDownload\generate_suzhou_voice.py` | 10段配音 |
