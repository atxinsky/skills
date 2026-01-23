#!/usr/bin/env python3
"""
zimage-skill - 使用 ModelScope Z-Image 生成图片
"""
import os
import sys

def generate_image(prompt, output_path, api_key=None):
    """使用 ModelScope Z-Image 生成图片"""

    if not api_key:
        api_key = os.environ.get('MODELSCOPE_API_KEY')

    if not api_key:
        print("[FAIL] 错误: 未设置 MODELSCOPE_API_KEY 环境变量")
        sys.exit(1)

    try:
        from modelscope.pipelines import pipeline
        from modelscope.utils.constant import Tasks
    except ImportError:
        print("[FAIL] 错误: 未安装 modelscope 库")
        print("安装方法: pip install modelscope")
        sys.exit(1)

    print("正在生成图片...")
    print(f"Prompt: {prompt}")

    try:
        # 设置 ModelScope token
        os.environ['MODELSCOPE_API_TOKEN'] = api_key

        # 创建文生图 pipeline
        pipe = pipeline(
            task=Tasks.text_to_image_synthesis,
            model='Tongyi-MAI/Z-Image-Turbo',
            model_revision='master',
            device='cuda'  # 强制使用 GPU
        )

        # 生成图片
        output = pipe({
            'text': prompt,
            'negative_prompt': 'low quality, blurry, distorted'
        })

        # 保存图片
        if 'output_imgs' in output:
            output_img = output['output_imgs'][0]
            output_img.save(output_path)
            print(f"[OK] 图片已保存: {output_path}")
            return output_path
        else:
            print(f"[FAIL] 生成失败: 未返回图片")
            sys.exit(1)

    except Exception as e:
        print(f"[FAIL] 生成失败: {e}")
        print("\n备选方案:")
        print("1. 检查网络连接")
        print("2. 确认 API Key 有效")
        print("3. 或者使用在线图片生成工具手动生成")
        sys.exit(1)

def main():
    if len(sys.argv) < 3:
        print("用法: python3 generate.py <prompt> <output_path>")
        print("\n示例:")
        print('  python3 generate.py "a beautiful sunset" output.jpg')
        print('\n环境变量:')
        print('  MODELSCOPE_API_KEY - ModelScope API 密钥')
        sys.exit(1)

    prompt = sys.argv[1]
    output_path = sys.argv[2]

    # 确保输出目录存在
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    generate_image(prompt, output_path)

if __name__ == "__main__":
    main()
