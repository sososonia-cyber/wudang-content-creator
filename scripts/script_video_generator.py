#!/usr/bin/env python3
"""
剧本驱动视频生成器
根据剧本和分镜头智能生成视频

特点：
- 视频数量 = 分镜头数量
- 视频时长 = 分镜头定义的时长
- 视频提示词 = 分镜头生成的提示词
"""

import os
import sys
from typing import List, Dict, Optional
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seedance_video import SeedanceVideoClient
from script_parser import ScriptParser, Script, Shot


class ScriptBasedVideoGenerator:
    """剧本驱动的视频生成器"""
    
    def __init__(self, api_key: Optional[str] = None, model_id: Optional[str] = None):
        self.client = SeedanceVideoClient(api_key, model_id)
        self.parser = ScriptParser()
    
    def generate_from_script(self, script: Script, 
                            resolution: str = "1080p", 
                            ratio: str = "9:16") -> Dict:
        """
        根据剧本生成视频
        
        每个分镜头生成一个视频片段
        
        Args:
            script: 剧本对象
            resolution: 分辨率
            ratio: 视频比例
        
        Returns:
            生成结果
        """
        if not script.shots:
            return {
                "success": False,
                "error": "剧本中没有分镜头"
            }
        
        results = []
        total_shots = len(script.shots)
        
        print("=" * 60)
        print(f"🎬 剧本驱动视频生成")
        print(f"   剧本: {script.title}")
        print(f"   分镜头数: {total_shots}")
        print(f"   预计总时长: {script.total_duration}秒")
        print("=" * 60)
        
        for i, shot in enumerate(script.shots, 1):
            print(f"\n📹 [{i}/{total_shots}] 生成镜头: {shot.shot_id}")
            print(f"   类型: {shot.shot_type}")
            print(f"   时长: {shot.duration}秒")
            print(f"   描述: {shot.description[:50]}...")
            
            # 根据分镜头生成视频
            result = self.client.generate_video(
                prompt=shot.prompt,
                resolution=resolution,
                duration=shot.duration,
                ratio=ratio
            )
            
            if result.get("success"):
                results.append({
                    "shot_id": shot.shot_id,
                    "shot_type": shot.shot_type,
                    "duration": shot.duration,
                    "task_id": result["task_id"],
                    "prompt": shot.prompt,
                    "status": "pending"
                })
                print(f"   ✅ 已提交，Task ID: {result['task_id']}")
            else:
                results.append({
                    "shot_id": shot.shot_id,
                    "shot_type": shot.shot_type,
                    "duration": shot.duration,
                    "task_id": None,
                    "prompt": shot.prompt,
                    "status": "failed",
                    "error": result.get("error", "未知错误")
                })
                print(f"   ❌ 提交失败: {result.get('error', '未知错误')}")
        
        successful = len([r for r in results if r["status"] == "pending"])
        
        return {
            "success": successful > 0,
            "script_id": script.script_id,
            "script_title": script.title,
            "total_shots": total_shots,
            "successful": successful,
            "failed": total_shots - successful,
            "shots": results,
            "total_duration": script.total_duration
        }
    
    def generate_from_text(self, text: str, title: str = "未命名剧本",
                          resolution: str = "1080p", 
                          ratio: str = "9:16") -> Dict:
        """
        从自然文本生成视频
        
        自动解析剧本 -> 生成视频
        
        Args:
            text: 剧本文本
            title: 剧本标题
            resolution: 分辨率
            ratio: 视频比例
        """
        # 1. 解析剧本
        print("📝 正在解析剧本...")
        script = self.parser.parse_from_text(text, title)
        
        # 2. 显示剧本报告
        print("\n" + self.parser.format_script_report(script))
        
        # 3. 生成视频
        return self.generate_from_script(script, resolution, ratio)
    
    def generate_from_manual_shots(self, title: str, shots_data: List[Dict],
                                   resolution: str = "1080p",
                                   ratio: str = "9:16") -> Dict:
        """
        从手动定义的分镜头生成视频
        
        Args:
            title: 剧本标题
            shots_data: 分镜头数据列表
            resolution: 分辨率
            ratio: 视频比例
        """
        # 创建剧本
        script = self.parser.create_manual_script(title, shots_data)
        
        # 显示剧本报告
        print("\n" + self.parser.format_script_report(script))
        
        # 生成视频
        return self.generate_from_script(script, resolution, ratio)
    
    def wait_all_complete(self, generate_result: Dict, timeout: int = 300) -> Dict:
        """等待所有视频生成完成"""
        shots = generate_result.get("shots", [])
        pending_shots = [s for s in shots if s["status"] == "pending"]
        
        if not pending_shots:
            return generate_result
        
        print(f"\n⏳ 等待 {len(pending_shots)} 个视频生成完成...")
        print(f"   超时设置: {timeout}秒")
        
        import time
        start_time = time.time()
        
        while pending_shots and (time.time() - start_time) < timeout:
            for shot in pending_shots[:]:
                if shot.get("task_id"):
                    status = self.client.get_task_status(shot["task_id"])
                    
                    if status.get("status") == "succeeded":
                        shot["status"] = "completed"
                        shot["video_url"] = status.get("video_url")
                        print(f"   ✅ {shot['shot_id']}: 完成")
                        pending_shots.remove(shot)
                    elif status.get("status") == "failed":
                        shot["status"] = "failed"
                        shot["error"] = status.get("error", "生成失败")
                        print(f"   ❌ {shot['shot_id']}: 失败")
                        pending_shots.remove(shot)
            
            if pending_shots:
                time.sleep(5)
        
        # 更新结果
        generate_result["shots"] = shots
        generate_result["all_completed"] = len(pending_shots) == 0
        
        return generate_result
    
    def format_result(self, result: Dict) -> str:
        """格式化生成结果"""
        lines = []
        lines.append("\n" + "=" * 60)
        lines.append("🎬 视频生成结果")
        lines.append("=" * 60)
        lines.append(f"剧本: {result.get('script_title', 'N/A')}")
        lines.append(f"总分镜头: {result.get('total_shots', 0)}")
        lines.append(f"成功: {result.get('successful', 0)}")
        lines.append(f"失败: {result.get('failed', 0)}")
        lines.append(f"总时长: {result.get('total_duration', 0)}秒")
        lines.append("")
        
        for shot in result.get("shots", []):
            status_icon = "✅" if shot["status"] == "completed" else "⏳" if shot["status"] == "pending" else "❌"
            lines.append(f"{status_icon} {shot['shot_id']} ({shot['shot_type']}, {shot['duration']}s)")
            if shot.get("video_url"):
                lines.append(f"   视频: {shot['video_url'][:60]}...")
        
        lines.append("=" * 60)
        return "\n".join(lines)


# 测试代码
if __name__ == "__main__":
    import os
    
    api_key = os.environ.get("VOLCENGINE_API_KEY")
    
    if not api_key:
        print("⚠️ 未配置 VOLCENGINE_API_KEY，仅演示剧本解析功能")
        
        # 仅测试剧本解析
        parser = ScriptParser()
        test_script = """
        清晨，武当山金顶云海翻腾，航拍展现壮观全景。
        道士在紫霄宫前练习太极拳，动作行云流水。
        特写镜头捕捉太极拳手部动作细节。
        阳光穿透晨雾，照亮金殿，温暖而神圣。
        """
        
        script = parser.parse_from_text(test_script, "武当山晨景")
        print(parser.format_script_report(script))
        
    else:
        print("🎬 测试剧本驱动视频生成")
        
        generator = ScriptBasedVideoGenerator(api_key)
        
        # 测试剧本
        test_script = """
        清晨，武当山金顶云海翻腾，航拍展现壮观全景。
        道士在紫霄宫前练习太极拳，动作行云流水。
        特写镜头捕捉太极拳手部动作细节。
        """
        
        result = generator.generate_from_text(
            text=test_script,
            title="武当山晨景",
            resolution="1080p",
            ratio="9:16"
        )
        
        print(generator.format_result(result))
