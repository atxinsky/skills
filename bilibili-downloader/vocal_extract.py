#!/usr/bin/env python3
"""
人声分离脚本 - 使用 demucs 模型去除背景音乐，保留人声
依赖: demucs, torch, soundfile
"""
import os
import sys
import glob
import argparse
import subprocess


def find_ffmpeg():
    """查找 ffmpeg 路径"""
    search_paths = [
        os.path.join(os.path.expanduser('~'), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Links'),
    ]
    try:
        subprocess.run(['ffmpeg', '--version'], capture_output=True, check=True)
        return 'ffmpeg'
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    for p in search_paths:
        full = os.path.join(p, 'ffmpeg.exe')
        if os.path.exists(full):
            return full
    return None


def separate_vocals(input_path, output_dir):
    """使用 demucs 分离人声，然后用 ffmpeg 转换"""
    import torch
    import soundfile as sf
    import numpy as np
    from demucs.pretrained import get_model
    from demucs.apply import apply_model

    os.makedirs(output_dir, exist_ok=True)

    print(f"[LOAD] 加载模型 htdemucs...")
    model = get_model('htdemucs')
    model.eval()

    print(f"[READ] 读取: {os.path.basename(input_path)}")
    # 用 ffmpeg 转 wav，再用 soundfile 读取（完全绕过 torchaudio）
    ffmpeg = find_ffmpeg()
    tmp_wav = input_path + ".tmp.wav"
    subprocess.run([ffmpeg, '-i', input_path, '-ar', '44100', '-ac', '2', tmp_wav, '-y'],
                   capture_output=True, check=True)
    audio_np, sr = sf.read(tmp_wav)  # (samples, channels)
    os.remove(tmp_wav)
    wav = torch.from_numpy(audio_np.T).float()  # (channels, samples)

    # 重采样到模型要求的采样率
    if sr != model.samplerate:
        print(f"[RESAMPLE] {sr} -> {model.samplerate}")
        # 用 julius 重采样（demucs 自带）
        from julius import resample_frac
        wav = resample_frac(wav, sr, model.samplerate)
        sr = model.samplerate

    # 添加 batch 维度
    wav = wav.unsqueeze(0)

    print(f"[SEP] 正在分离人声...")
    with torch.no_grad():
        sources = apply_model(model, wav)

    # sources shape: (batch, num_sources, channels, samples)
    # 获取 vocals 的索引
    vocals_idx = model.sources.index('vocals')
    vocals = sources[0, vocals_idx]  # (channels, samples)

    # 保存为 wav 临时文件，再转 mp3
    basename = os.path.splitext(os.path.basename(input_path))[0]
    wav_path = os.path.join(output_dir, f"{basename}_vocals.wav")
    mp3_path = os.path.join(output_dir, f"{basename}_vocals.mp3")

    # 用 soundfile 保存 wav
    import soundfile as sf
    import numpy as np
    vocals_np = vocals.cpu().numpy().T  # (samples, channels)
    sf.write(wav_path, vocals_np, sr)
    print(f"[OK] WAV 保存: {os.path.basename(wav_path)}")

    # 用 ffmpeg 转 mp3
    ffmpeg = find_ffmpeg()
    if ffmpeg:
        cmd = [ffmpeg, '-i', wav_path, '-acodec', 'libmp3lame', '-q:a', '2', mp3_path, '-y']
        subprocess.run(cmd, capture_output=True, check=True)
        os.remove(wav_path)
        size_kb = os.path.getsize(mp3_path) // 1024
        print(f"[OK] MP3 保存: {os.path.basename(mp3_path)} ({size_kb}KB)")
        return mp3_path
    else:
        print("[WARN] ffmpeg 未找到，保留 WAV 格式")
        return wav_path


def main():
    parser = argparse.ArgumentParser(description='人声分离 - 去除背景音乐')
    parser.add_argument('input', nargs='+', help='输入音频文件或目录')
    parser.add_argument('--output', '-o', default=None,
                        help='输出目录 (默认: 输入文件同目录/vocals)')
    args = parser.parse_args()

    # 收集所有输入文件
    files = []
    for inp in args.input:
        if os.path.isdir(inp):
            files.extend(glob.glob(os.path.join(inp, '*.mp3')))
            files.extend(glob.glob(os.path.join(inp, '*.wav')))
            files.extend(glob.glob(os.path.join(inp, '*.m4a')))
        elif os.path.isfile(inp):
            files.append(inp)
        else:
            # glob pattern
            files.extend(glob.glob(inp))

    if not files:
        print("[FAIL] 未找到音频文件")
        sys.exit(1)

    print(f"[INFO] 共 {len(files)} 个文件待处理\n")

    for i, f in enumerate(sorted(files), 1):
        print(f"--- [{i}/{len(files)}] {os.path.basename(f)} ---")
        output_dir = args.output or os.path.join(os.path.dirname(f), 'vocals')
        separate_vocals(f, output_dir)
        print()

    print("[DONE] 全部处理完成")


if __name__ == '__main__':
    main()
