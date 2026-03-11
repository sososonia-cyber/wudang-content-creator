#!/usr/bin/env python3
"""
Seedance 视频生成 API 调用脚本
使用火山方舟 Seedance 1.5 Pro / 2.0 模型生成视频

正确的API端点：
- 基础URL: https://ark.cn-beijing.volces.com/api/v3
- 创建任务: POST /contents/generations/tasks
- 查询任务: GET /contents/generations/tasks/{task_id}

环境变量：
- VOLCENGINE_API_KEY: 火山方舟API密钥
- SEEDANCE_MODEL_ID: 模型ID（如：doubao-seedance-1-5-pro-xxx）
"""

import os
import sys
import json
import time
import argparse
from typing import Optional, List
try:
    import requests
except ImportError:
    print("Error: requests module not found. Install with: pip install requests")
    sys.exit(1)


class SeedanceVideoClient:
    """Seedance 视频生成客户端"""
    
    def __init__(self, api_key: Optional[str] = None, model_id: Optional[str] = None):
        self.api_key = api_key or os.environ.get("VOLCENGINE_API_KEY")
        # 模型ID - Seedance 1.5 Pro
        # 正确的模型ID格式：doubao-seedance-1-5-pro-251215
        self.model_id = model_id or os.environ.get("SEEDANCE_MODEL_ID", "doubao-seedance-1-5-pro-251215")
        # 正确的API端点
        self.endpoint = "https://ark.cn-beijing.volces.com/api/v3"
        
        if not self.api_key:
            raise ValueError("API Key is required. Set VOLCENGINE_API_KEY environment variable.")
    
    def generate_video(self, prompt: str, image_url: Optional[str] = None, 
                       resolution: str = "1080p", duration: int = 10, 
                       ratio: str = "9:16", camera_fixed: bool = False, 
                       seed: Optional[int] = None) -> dict:
        """
        提交视频生成任务
        
        参数：
            prompt: 视频描述提示词（详细描述想要的视频内容）
            image_url: 参考图片URL（可选，用于图生视频）
            resolution: 分辨率（360p/480p/540p/720p/1080p，默认1080p）
            duration: 视频时长（秒，默认10秒）
            ratio: 视频比例（16:9/9:16/1:1/3:4，默认9:16竖屏）
            camera_fixed: 镜头是否固定
            seed: 随机种子（可选）
        
        返回：
            包含task_id的字典
        """
        # 正确的API端点：/contents/generations/tasks
        url = f"{self.endpoint}/contents/generations/tasks"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # 构建content数组
        content = []
        
        # 文本提示词（必须包含参数后缀）
        # 添加竖屏提示词引导
        if ratio == "9:16":
            prompt = f"竖屏视频，9:16比例，{prompt}"
        prompt_with_params = f"{prompt} --resolution {resolution} --duration {duration} --camerafixed {'true' if camera_fixed else 'false'}"
        content.append({
            "type": "text",
            "text": prompt_with_params
        })
        
        # 如果有参考图片，添加图片URL
        if image_url:
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": image_url
                }
            })
        
        payload = {
            "model": self.model_id,
            "content": content
        }
        
        if seed:
            payload["seed"] = seed
        
        try:
            print(f"Request URL: {url}")
            print(f"Model: {self.model_id}")
            print(f"Prompt: {prompt_with_params}")
            
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            
            print(f"Response Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"Error Response: {response.text}")
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
            
            result = response.json()
            
            if "id" in result:
                return {
                    "success": True,
                    "task_id": result["id"],
                    "status": result.get("status", "pending"),
                    "message": "Video generation task submitted successfully",
                    "raw_response": result
                }
            else:
                return {
                    "success": False,
                    "error": "Unexpected API response format",
                    "response": result
                }
        
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"API request failed: {str(e)}"
            }
        except json.JSONDecodeError as e:
            return {
                "success": False,
                "error": f"Failed to parse API response: {str(e)}"
            }
    
    def get_task_status(self, task_id: str) -> dict:
        """
        查询视频生成任务状态
        
        参数：
            task_id: 任务ID
        
        返回：
            任务状态信息
        """
        # 正确的API端点：/contents/generations/tasks/{task_id}
        url = f"{self.endpoint}/contents/generations/tasks/{task_id}"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            # 获取视频URL（可能在不同字段）
            video_url = result.get("video_url")
            if not video_url and "content" in result:
                content_data = result["content"]
                # content可能是列表或字典
                if isinstance(content_data, list) and len(content_data) > 0:
                    video_url = content_data[0].get("video_url")
                elif isinstance(content_data, dict):
                    video_url = content_data.get("video_url")
            
            return {
                "success": True,
                "task_id": task_id,
                "status": result.get("status"),
                "video_url": video_url,
                "progress": result.get("progress", 0),
                "created_at": result.get("created_at"),
                "completed_at": result.get("completed_at"),
                "error": result.get("error"),
                "raw_response": result
            }
        
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"API request failed: {str(e)}"
            }
    
    def wait_for_completion(self, task_id: str, timeout: int = 600, poll_interval: int = 10) -> dict:
        """
        等待视频生成完成
        
        参数：
            task_id: 任务ID
            timeout: 超时时间（秒，默认600秒=10分钟）
            poll_interval: 轮询间隔（秒，默认10秒）
        
        返回：
            最终结果
        """
        print(f"Waiting for video generation (task_id: {task_id})...")
        print(f"Timeout: {timeout}s, Poll interval: {poll_interval}s")
        print("-" * 50)
        
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            status = self.get_task_status(task_id)
            
            if not status["success"]:
                print(f"Error checking status: {status.get('error')}")
                return status
            
            current_status = status.get("status")
            progress = status.get("progress", 0)
            
            print(f"Status: {current_status} | Progress: {progress}%", end="\r")
            
            if current_status == "completed":
                print("\n" + "-" * 50)
                print("✅ Video generation completed!")
                video_url = status.get('video_url')
                if video_url:
                    print(f"Video URL: {video_url}")
                return status
            
            elif current_status == "failed":
                print("\n" + "-" * 50)
                print("❌ Video generation failed!")
                print(f"Error: {status.get('error')}")
                return status
            
            time.sleep(poll_interval)
        
        print("\n" + "-" * 50)
        print("⏱️ Timeout! Video generation is still in progress.")
        print(f"Task ID: {task_id}")
        print("You can check the status later using:")
        print(f"  python3 seedance_video.py --check {task_id}")
        
        return {
            "success": False,
            "error": "Timeout",
            "task_id": task_id
        }


def create_wudang_video_prompt(scene_type: str, mood: str, elements: List[str]) -> str:
    """
    创建武当山主题视频提示词
    
    参数：
        scene_type: 场景类型（landscape/martial_arts/taichi/culture）
        mood: 氛围（serene/dynamic/epic/peaceful）
        elements: 元素列表
    
    返回：
        优化后的提示词
    """
    base_prompts = {
        "landscape": "Wudang Mountain landscape, ancient Taoist architecture, misty mountains",
        "martial_arts": "Wudang martial arts performance, traditional kung fu, tai chi",
        "taichi": "Tai Chi practice, slow graceful movements, Wudang mountain background",
        "culture": "Taoist culture, traditional Chinese spirituality, temple rituals"
    }
    
    mood_descriptions = {
        "serene": "peaceful atmosphere, soft morning light, gentle breeze",
        "dynamic": "energetic movements, dramatic angles, flowing motion",
        "epic": "grand scale, majestic views, cinematic composition, golden hour",
        "peaceful": "calm and tranquil, meditative, zen atmosphere"
    }
    
    base = base_prompts.get(scene_type, "Wudang Mountain scene")
    mood_desc = mood_descriptions.get(mood, "beautiful scenery")
    
    elements_str = ", ".join(elements) if elements else ""
    
    prompt = f"{base}, {mood_desc}"
    if elements_str:
        prompt += f", {elements_str}"
    
    prompt += ", high quality, professional cinematography, smooth camera movement"
    
    return prompt


def main():
    parser = argparse.ArgumentParser(description="Seedance 视频生成工具")
    parser.add_argument("--prompt", "-p", help="视频生成提示词")
    parser.add_argument("--image-url", "-i", help="参考图片URL（可选）")
    parser.add_argument("--resolution", "-r", default="1080p", 
                        choices=["360p", "480p", "540p", "720p", "1080p"],
                        help="视频分辨率（默认1080p）")
    parser.add_argument("--duration", "-d", type=int, default=10, 
                        help="视频时长（秒，默认10秒）")
    parser.add_argument("--ratio", choices=["16:9", "9:16", "1:1", "3:4"],
                        default="9:16", help="视频比例（默认9:16竖屏）")
    parser.add_argument("--camera-fixed", action="store_true", 
                        help="镜头固定不动")
    parser.add_argument("--seed", type=int, help="随机种子（可选）")
    parser.add_argument("--check", help="查询任务状态（传入task_id）")
    parser.add_argument("--wait", action="store_true", help="等待任务完成")
    parser.add_argument("--scene-type", 
                        choices=["landscape", "martial_arts", "taichi", "culture"], 
                        help="武当山场景类型")
    parser.add_argument("--mood", choices=["serene", "dynamic", "epic", "peaceful"],
                        default="serene", help="视频氛围")
    parser.add_argument("--elements", nargs="+", help="额外元素（如：云海 日出 金顶）")
    
    args = parser.parse_args()
    
    try:
        client = SeedanceVideoClient()
        
        # 查询任务状态
        if args.check:
            result = client.get_task_status(args.check)
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return
        
        # 生成视频
        if not args.prompt and not args.scene_type:
            print("Error: 请提供 --prompt 或 --scene-type")
            sys.exit(1)
        
        # 构建提示词
        if args.scene_type:
            prompt = create_wudang_video_prompt(
                args.scene_type, 
                args.mood, 
                args.elements or []
            )
            print(f"Generated prompt: {prompt}")
        else:
            prompt = args.prompt
        
        # 提交任务
        result = client.generate_video(
            prompt=prompt,
            image_url=args.image_url,
            resolution=args.resolution,
            duration=args.duration,
            ratio=args.ratio,
            camera_fixed=args.camera_fixed,
            seed=args.seed
        )
        
        print("\n" + "=" * 50)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # 等待完成
        if args.wait and result.get("success"):
            task_id = result.get("task_id")
            final_result = client.wait_for_completion(task_id)
            print("\n" + "=" * 50)
            print(json.dumps(final_result, ensure_ascii=False, indent=2))
    
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
