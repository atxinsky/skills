#!/usr/bin/env python3
"""
media-downloader - 下载 YouTube 视频和图片
"""
import os
import sys
import argparse
import subprocess

def download_youtube(url, output_dir, end_time=None):
    """下载 YouTube 视频并可选裁剪"""

    # 检查 yt-dlp 是否安装
    try:
        subprocess.run(['yt-dlp', '--version'], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ 错误: 未安装 yt-dlp")
        print("安装方法: pip install yt-dlp")
        sys.exit(1)

    # 确保输出目录存在
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 下载视频
    output_template = os.path.join(output_dir, '%(title)s.%(ext)s')

    cmd = [
        'yt-dlp',
        '-f', 'best[ext=mp4]',
        '-o', output_template,
        url
    ]

    print(f"📥 正在下载: {url}")

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(result.stdout)

        # 找到下载的文件
        for line in result.stdout.split('\n'):
            if 'Destination:' in line or 'has already been downloaded' in line:
                # 提取文件路径
                video_file = line.split(': ')[-1].strip()
                if os.path.exists(video_file):
                    print(f"✅ 视频已下载: {video_file}")

                    # 如果需要裁剪
                    if end_time:
                        print(f"✂️ 裁剪视频到 {end_time} 秒...")
                        output_file = video_file.replace('.mp4', '_trimmed.mp4')
                        trim_cmd = [
                            'ffmpeg',
                            '-i', video_file,
                            '-t', str(end_time),
                            '-c', 'copy',
                            output_file,
                            '-y'
                        ]
                        subprocess.run(trim_cmd, capture_output=True, check=True)
                        print(f"✅ 裁剪完成: {output_file}")
                        return output_file

                    return video_file

        print("✅ 下载完成")
        return None

    except subprocess.CalledProcessError as e:
        print(f"❌ 下载失败: {e}")
        print(e.stderr)
        sys.exit(1)

def download_image(keyword, output_dir, count=1):
    """下载图片（占位符，需要配置 API）"""

    pexels_key = os.environ.get('PEXELS_API_KEY')
    pixabay_key = os.environ.get('PIXABAY_API_KEY')

    if not pexels_key and not pixabay_key:
        print("⚠️ 警告: 未配置图片下载 API Key")
        print("建议: 使用 zimage-skill 生成图片代替下载")
        print("\n配置方法:")
        print("  export PEXELS_API_KEY='your-key'")
        print("  export PIXABAY_API_KEY='your-key'")
        return None

    print("ℹ️ 图片下载功能需要配置 API Key")
    print("建议使用 zimage-skill 生成图片")
    return None

def check_status():
    """检查依赖状态"""

    print("依赖状态检查\n")

    # 检查 yt-dlp
    try:
        result = subprocess.run(['yt-dlp', '--version'], capture_output=True, text=True, check=True)
        print(f"[OK] yt-dlp: {result.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("[FAIL] yt-dlp: 未安装")

    # 检查 ffmpeg
    try:
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True, check=True)
        version_line = result.stdout.split('\n')[0]
        print(f"[OK] ffmpeg: {version_line}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("[FAIL] ffmpeg: 未安装")

    # 检查 API Keys
    print("\nAPI Keys:")
    pexels = os.environ.get('PEXELS_API_KEY')
    pixabay = os.environ.get('PIXABAY_API_KEY')

    if pexels:
        print(f"[OK] PEXELS_API_KEY: {pexels[:10]}...")
    else:
        print("[WARN] PEXELS_API_KEY: 未配置")

    if pixabay:
        print(f"[OK] PIXABAY_API_KEY: {pixabay[:10]}...")
    else:
        print("[WARN] PIXABAY_API_KEY: 未配置")

def main():
    parser = argparse.ArgumentParser(description='媒体下载工具')
    subparsers = parser.add_subparsers(dest='command', help='命令')

    # YouTube 命令
    youtube_parser = subparsers.add_parser('youtube', help='下载 YouTube 视频')
    youtube_parser.add_argument('url', help='YouTube URL')
    youtube_parser.add_argument('-o', '--output', default='.', help='输出目录')
    youtube_parser.add_argument('--end', type=int, help='裁剪到指定秒数')

    # 图片命令
    image_parser = subparsers.add_parser('image', help='下载图片')
    image_parser.add_argument('keyword', help='搜索关键词')
    image_parser.add_argument('-n', '--count', type=int, default=1, help='下载数量')
    image_parser.add_argument('-o', '--output', default='.', help='输出目录')

    # 状态命令
    subparsers.add_parser('status', help='检查依赖状态')

    args = parser.parse_args()

    if args.command == 'youtube':
        download_youtube(args.url, args.output, args.end)
    elif args.command == 'image':
        download_image(args.keyword, args.output, args.count)
    elif args.command == 'status':
        check_status()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
