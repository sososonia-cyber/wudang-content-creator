#!/usr/bin/env python3
"""
多版本视频生成模块
基于同一创意生成多个不同版本的视频（不同镜头/角度/风格）
"""

import os
import sys
import json
import time
from typing import List, Dict, Optional

# 导入原有的Seedance客户端
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seedance_video import SeedanceVideoClient


class BatchVideoGenerator:
    """批量视频生成器 - 生成多版本视频"""
    
    def __init__(self, api_key: Optional[str] = None, model_id: Optional[str] = None):
        self.client = SeedanceVideoClient(api_key, model_id)
    
    def generate_three_versions(self, base_prompt: str, theme: str = "landscape", 
                                 mood: str = "serene", duration: int = 10,
                                 resolution: str = "1080p", ratio: str = "9:16") -> Dict:
        """
        生成3个不同版本的视频
        
        版本设计：
        - 版本1：远景/广角 - 展现宏大场面
        - 版本2：中景/人物 - 展现动作细节
        - 版本3：特写/情感 - 展现细腻情感
        
        参数：
            base_prompt: 基础创意描述
            theme: 主题类型
            mood: 氛围
            duration: 时长
            resolution: 分辨率
            ratio: 比例
        
        返回：
            包含3个版本任务信息的字典
        """
        
        # 根据主题生成不同角度的提示词
        version_prompts = self._create_version_prompts(base_prompt, theme)
        
        results = []
        print(f"🎬 开始生成3个版本视频...")
        print(f"   基础创意：{base_prompt[:50]}...")
        print("-" * 50)
        
        for i, (version_name, prompt) in enumerate(version_prompts, 1):
            print(f"\n📹 提交版本{i}：{version_name}")
            print(f"   提示词：{prompt[:60]}...")
            
            result = self.client.generate_video(
                prompt=prompt,
                resolution=resolution,
                duration=duration,
                ratio=ratio
            )
            
            if result.get("success"):
                results.append({
                    "version": i,
                    "version_name": version_name,
                    "task_id": result["task_id"],
                    "prompt": prompt,
                    "status": "pending",
                    "video_url": None
                })
                print(f"   ✅ 已提交，Task ID: {result['task_id']}")
            else:
                results.append({
                    "version": i,
                    "version_name": version_name,
                    "task_id": None,
                    "prompt": prompt,
                    "status": "failed",
                    "error": result.get("error", "Unknown error"),
                    "video_url": None
                })
                print(f"   ❌ 提交失败：{result.get('error', 'Unknown error')}")
        
        return {
            "success": len([r for r in results if r["status"] != "failed"]) > 0,
            "total_versions": 3,
            "submitted": len([r for r in results if r["status"] == "pending"]),
            "failed": len([r for r in results if r["status"] == "failed"]),
            "versions": results,
            "base_prompt": base_prompt,
            "params": {
                "theme": theme,
                "mood": mood,
                "duration": duration,
                "resolution": resolution,
                "ratio": ratio
            }
        }
    
    def _create_version_prompts(self, base_prompt: str, theme: str) -> List[tuple]:
        """
        创建3个版本的提示词
        
        返回：
            [(版本名称, 提示词), ...]
        """
        
        if theme == "landscape":
            # 风景主题
            return [
                ("远景航拍", f"{base_prompt}，远景航拍，宏大场面，展现全景，壮丽的自然风光，电影级构图"),
                ("中景过渡", f"{base_prompt}，中景，环境与人融合，自然过渡，富有层次感"),
                ("特写细节", f"{base_prompt}，特写镜头，精美细节，光影变化，意境深远")
            ]
        
        elif theme == "taichi":
            # 太极主题
            return [
                ("全景演示", f"{base_prompt}，全景，完整动作演示，展现太极韵律，环境融合"),
                ("动作细节", f"{base_prompt}，中景，动作细节，手势步伐，行云流水"),
                ("神态特写", f"{base_prompt}，特写，专注神态，呼吸节奏，内心平静")
            ]
        
        elif theme == "martial_arts":
            # 武术主题
            return [
                ("功夫展示", f"{base_prompt}，全景，完整招式，力量与美感，行云流水"),
                ("动作分解", f"{base_prompt}，中景，动作分解，力道展现，精准到位"),
                ("气势特写", f"{base_prompt}，特写，眼神气势，力量爆发，震撼人心")
            ]
        
        elif theme == "culture":
            # 文化主题
            return [
                ("场景展现", f"{base_prompt}，全景，文化场景，建筑环境，庄严神圣"),
                ("人物活动", f"{base_prompt}，中景，人物活动，仪式过程，文化传承"),
                ("细节刻画", f"{base_prompt}，特写，文化细节，符号象征，精雕细琢")
            ]
        
        else:
            # 通用版本
            return [
                ("广角版", f"{base_prompt}，广角镜头，宏大场面，气势恢宏"),
                ("标准版", f"{base_prompt}，标准视角，平衡构图，主次分明"),
                ("细节版", f"{base_prompt}，特写镜头，精美细节，意境深远")
            ]
    
    def check_all_status(self, batch_result: Dict) -> Dict:
        """
        检查所有版本的状态
        
        参数：
            batch_result: generate_three_versions的返回结果
        
        返回：
            更新后的结果
        """
        print("\n" + "=" * 50)
        print("📊 检查所有版本状态...")
        print("=" * 50)
        
        completed = 0
        failed = 0
        
        for version in batch_result["versions"]:
            if version["status"] in ["completed", "failed"]:
                continue
            
            task_id = version["task_id"]
            if not task_id:
                continue
            
            status_result = self.client.get_task_status(task_id)
            
            if status_result.get("success"):
                version["status"] = status_result.get("status", "unknown")
                version["video_url"] = status_result.get("video_url")
                
                if version["status"] == "completed":
                    completed += 1
                    print(f"\n✅ 版本{version['version']} [{version['version_name']}] - 完成")
                    print(f"   下载链接：{version['video_url'][:80]}...")
                elif version["status"] == "failed":
                    failed += 1
                    print(f"\n❌ 版本{version['version']} [{version['version_name']}] - 失败")
            else:
                print(f"\n⏳ 版本{version['version']} [{version['version_name']}] - 生成中...")
        
        batch_result["completed"] = completed
        batch_result["failed_count"] = failed + len([v for v in batch_result["versions"] if v["status"] == "failed"])
        
        return batch_result
    
    def wait_all_complete(self, batch_result: Dict, timeout: int = 600, 
                         poll_interval: int = 15) -> Dict:
        """
        等待所有版本完成
        
        参数：
            batch_result: 批次结果
            timeout: 超时时间（秒）
            poll_interval: 轮询间隔（秒）
        
        返回：
            最终结果
        """
        print(f"\n⏳ 等待所有版本完成（超时：{timeout}秒）...")
        print("-" * 50)
        
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            batch_result = self.check_all_status(batch_result)
            
            pending = len([v for v in batch_result["versions"] if v["status"] == "pending"])
            
            if pending == 0:
                print("\n" + "=" * 50)
                print("🎉 所有版本处理完成！")
                print("=" * 50)
                return batch_result
            
            print(f"\n⏳ 还有 {pending} 个版本生成中，{poll_interval}秒后检查...")
            time.sleep(poll_interval)
        
        print("\n" + "=" * 50)
        print("⏱️ 超时！部分版本可能仍在生成中")
        print("=" * 50)
        return batch_result
    
    def format_result(self, batch_result: Dict) -> str:
        """格式化输出结果"""
        lines = []
        lines.append("\n" + "=" * 60)
        lines.append("🎬 多版本视频生成结果")
        lines.append("=" * 60)
        lines.append(f"\n基础创意：{batch_result['base_prompt'][:50]}...")
        lines.append(f"参数：{batch_result['params']['duration']}秒 | {batch_result['params']['resolution']} | {batch_result['params']['ratio']}")
        lines.append("\n" + "-" * 60)
        
        for version in batch_result["versions"]:
            status_icon = "✅" if version["status"] == "completed" else "❌" if version["status"] == "failed" else "⏳"
            lines.append(f"\n{status_icon} 版本{version['version']}：{version['version_name']}")
            lines.append(f"   提示词：{version['prompt'][:50]}...")
            
            if version.get("video_url"):
                lines.append(f"   下载：{version['video_url']}")
            elif version.get("error"):
                lines.append(f"   错误：{version['error']}")
            else:
                lines.append(f"   Task ID：{version.get('task_id', 'N/A')}")
        
        lines.append("\n" + "=" * 60)
        
        success_count = len([v for v in batch_result["versions"] if v["status"] == "completed"])
        lines.append(f"\n完成：{success_count}/3")
        
        return "\n".join(lines)


def main():
    """测试多版本生成"""
    import os
    
    api_key = os.environ.get("VOLCENGINE_API_KEY")
    model_id = os.environ.get("SEEDANCE_MODEL_ID", "doubao-seedance-1-5-pro-251215")
    
    if not api_key:
        print("错误：请设置 VOLCENGINE_API_KEY 环境变量")
        return
    
    generator = BatchVideoGenerator(api_key, model_id)
    
    # 测试生成
    result = generator.generate_three_versions(
        base_prompt="武当山春天，漫山遍野杜鹃花盛开，道长漫步其中",
        theme="landscape",
        mood="serene",
        duration=10
    )
    
    if result["success"]:
        print("\n✅ 所有版本已提交，开始等待生成...")
        final_result = generator.wait_all_complete(result, timeout=300)
        print(generator.format_result(final_result))
    else:
        print("\n❌ 提交失败")
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
