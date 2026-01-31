#!/usr/bin/env python3
"""
bilibili-downloader - B站视频批量下载 + 音频提取
依赖: yt-dlp, ffmpeg
"""
import os
import sys
import glob
import argparse
import subprocess
import json


def find_executable(name):
    """查找可执行文件路径"""
    # 常见路径
    search_paths = [
        os.path.join(os.path.expanduser('~'), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Links'),
        os.path.join(os.path.expanduser('~'), 'AppData', 'Local', 'Programs', 'Python', 'Python310', 'Scripts'),
        r'C:\ffmpeg\bin',
    ]
    # 先试直接调用
    try:
        subprocess.run([name, '--version'], capture_output=True, check=True)
        return name
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    # 搜索常见路径
    for p in search_paths:
        full = os.path.join(p, name + '.exe')
        if os.path.exists(full):
            return full
        full = os.path.join(p, name)
        if os.path.exists(full):
            return full
    return None


FFMPEG = None
YTDLP = None


def ensure_deps():
    """检查依赖是否就绪"""
    global FFMPEG, YTDLP
    YTDLP = find_executable('yt-dlp')
    FFMPEG = find_executable('ffmpeg')
    if not YTDLP:
        print("[FAIL] yt-dlp 未安装，安装: pip install yt-dlp")
        sys.exit(1)
    if not FFMPEG:
        print("[FAIL] ffmpeg 未安装")
        sys.exit(1)
    print(f"[OK] yt-dlp: {YTDLP}")
    print(f"[OK] ffmpeg: {FFMPEG}")


def extract_audio(video_path, delete_video=False):
    """从视频文件提取 MP3 音频"""
    base, _ = os.path.splitext(video_path)
    mp3_path = base + '.mp3'

    cmd = [
        FFMPEG, '-i', video_path,
        '-vn', '-acodec', 'libmp3lame', '-q:a', '2',
        mp3_path, '-y'
    ]

    try:
        subprocess.run(cmd, capture_output=True, check=True)
        size_kb = os.path.getsize(mp3_path) // 1024
        print(f"  [OK] 音频: {os.path.basename(mp3_path)} ({size_kb}KB)")

        if delete_video and os.path.exists(video_path):
            os.remove(video_path)
            print(f"  [DEL] 已删除视频: {os.path.basename(video_path)}")

        return mp3_path
    except subprocess.CalledProcessError as e:
        print(f"  [FAIL] 音频提取失败: {os.path.basename(video_path)}")
        print(f"  {e.stderr.decode('utf-8', errors='ignore')[:200] if e.stderr else ''}")
        return None


def separate_vocals(mp3_path, output_dir):
    """使用 demucs 分离人声，输出纯人声 MP3"""
    try:
        import torch
        import soundfile as sf
        import numpy as np
        from demucs.pretrained import get_model
        from demucs.apply import apply_model
    except ImportError:
        print("  [SKIP] demucs 未安装，跳过人声分离 (pip install demucs)")
        return None

    os.makedirs(output_dir, exist_ok=True)

    print(f"  [VOCAL] 分离人声: {os.path.basename(mp3_path)}")

    model = get_model('htdemucs')
    model.eval()

    # ffmpeg 转 wav 再用 soundfile 读取（绕过 torchaudio 兼容问题）
    tmp_wav = mp3_path + ".tmp.wav"
    subprocess.run([FFMPEG, '-i', mp3_path, '-ar', '44100', '-ac', '2', tmp_wav, '-y'],
                   capture_output=True, check=True)
    audio_np, sr = sf.read(tmp_wav)
    os.remove(tmp_wav)
    wav = torch.from_numpy(audio_np.T).float()

    if sr != model.samplerate:
        from julius import resample_frac
        wav = resample_frac(wav, sr, model.samplerate)
        sr = model.samplerate

    wav = wav.unsqueeze(0)

    with torch.no_grad():
        sources = apply_model(model, wav)

    vocals_idx = model.sources.index('vocals')
    vocals = sources[0, vocals_idx]

    # 保存 wav 再转 mp3
    basename = os.path.splitext(os.path.basename(mp3_path))[0]
    wav_path = os.path.join(output_dir, f"{basename}_vocals.wav")
    mp3_out = os.path.join(output_dir, f"{basename}_vocals.mp3")

    vocals_np = vocals.cpu().numpy().T
    sf.write(wav_path, vocals_np, sr)

    subprocess.run([FFMPEG, '-i', wav_path, '-acodec', 'libmp3lame', '-q:a', '2', mp3_out, '-y'],
                   capture_output=True, check=True)
    os.remove(wav_path)

    size_kb = os.path.getsize(mp3_out) // 1024
    print(f"  [OK] 纯人声: {os.path.basename(mp3_out)} ({size_kb}KB)")
    return mp3_out


def download_bilibili(url, output_dir, audio_only=False, keep_video=False,
                      all_pages=False, cookies=None, vocals=False):
    """下载B站视频"""
    os.makedirs(output_dir, exist_ok=True)

    # 记录下载前已有的文件
    existing_files = set(glob.glob(os.path.join(output_dir, '*')))

    output_template = os.path.join(output_dir, '%(title)s%(autonumber)s.%(ext)s')

    cmd = [
        YTDLP,
        '-o', output_template,
        '--encoding', 'utf-8',
        '--merge-output-format', 'mp4',
    ]

    if all_pages:
        cmd.append('--yes-playlist')
    else:
        cmd.append('--no-playlist')

    if cookies:
        cmd.extend(['--cookies-from-browser', cookies])

    cmd.append(url)

    print(f"[DL] 开始下载: {url}")
    print(f"[DIR] 输出目录: {output_dir}")

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            encoding='utf-8', errors='replace', check=True
        )
        print(result.stdout[-500:] if len(result.stdout) > 500 else result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"[FAIL] 下载失败")
        print(e.stderr[-500:] if e.stderr and len(e.stderr) > 500 else (e.stderr or ''))
        sys.exit(1)

    # 找到新下载的视频文件
    current_files = set(glob.glob(os.path.join(output_dir, '*')))
    new_files = current_files - existing_files
    video_files = [f for f in new_files if f.endswith(('.mp4', '.mkv', '.flv', '.webm'))]

    if not video_files:
        # 兜底：扫描目录中所有视频
        video_files = glob.glob(os.path.join(output_dir, '*.mp4'))

    print(f"\n[DONE] 下载完成，共 {len(video_files)} 个视频文件")

    # 提取音频
    if audio_only or keep_video:
        print("\n[AUDIO] 开始提取音频...")
        delete_video = audio_only and not keep_video
        mp3_files = []
        for vf in sorted(video_files):
            mp3 = extract_audio(vf, delete_video=delete_video)
            if mp3:
                mp3_files.append(mp3)

        print(f"\n[DONE] 音频提取完成，共 {len(mp3_files)} 个 MP3 文件")

        # 人声分离
        if vocals and mp3_files:
            vocals_dir = os.path.join(output_dir, 'vocals')
            print(f"\n[VOCAL] 开始人声分离（去背景音乐）...")
            vocal_files = []
            for mf in mp3_files:
                vf = separate_vocals(mf, vocals_dir)
                if vf:
                    vocal_files.append(vf)
            print(f"\n[DONE] 人声分离完成，共 {len(vocal_files)} 个纯人声 MP3")

    # 汇总
    print("\n--- 结果汇总 ---")
    final_files = sorted(glob.glob(os.path.join(output_dir, '*')))
    for f in final_files:
        size = os.path.getsize(f)
        unit = 'MB' if size > 1024 * 1024 else 'KB'
        size_val = size / (1024 * 1024) if unit == 'MB' else size / 1024
        print(f"  {os.path.basename(f)} ({size_val:.1f}{unit})")


def download_space(uid, output_dir, audio_only=False, keep_video=False,
                   cookies=None, vocals=False):
    """下载UP主全部投稿"""
    space_url = f"https://space.bilibili.com/{uid}/video"
    print(f"[SPACE] 下载UP主 {uid} 的全部投稿")
    print("[WARN] UP主全部投稿下载可能耗时较长，建议使用 --cookies 参数登录以获取更好的下载速度")
    download_bilibili(space_url, output_dir, audio_only=audio_only,
                      keep_video=keep_video, all_pages=True, cookies=cookies,
                      vocals=vocals)


def main():
    parser = argparse.ArgumentParser(description='B站视频批量下载 + 音频提取')

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--url', help='B站视频链接')
    group.add_argument('--space', help='UP主UID，下载全部投稿')

    parser.add_argument('--output', '-o',
                        default=os.path.join(os.path.expanduser('~'), 'Desktop', 'bilibili_downloads'),
                        help='输出目录 (默认: 桌面/bilibili_downloads)')
    parser.add_argument('--audio-only', action='store_true',
                        help='只保留MP3，删除视频')
    parser.add_argument('--keep-video', action='store_true',
                        help='提取音频同时保留视频')
    parser.add_argument('--all-pages', action='store_true',
                        help='下载合集所有分P')
    parser.add_argument('--vocals', action='store_true',
                        help='同时生成纯人声MP3（去背景音乐），需要 demucs')
    parser.add_argument('--cookies', default=None,
                        help='浏览器名称，用于获取cookies (chrome/edge/firefox)')

    args = parser.parse_args()

    ensure_deps()

    if args.space:
        download_space(args.space, args.output,
                       audio_only=args.audio_only,
                       keep_video=args.keep_video,
                       cookies=args.cookies,
                       vocals=args.vocals)
    else:
        download_bilibili(args.url, args.output,
                          audio_only=args.audio_only,
                          keep_video=args.keep_video,
                          all_pages=args.all_pages,
                          cookies=args.cookies,
                          vocals=args.vocals)


if __name__ == '__main__':
    main()
