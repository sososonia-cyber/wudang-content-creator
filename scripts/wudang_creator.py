#!/usr/bin/env python3
"""
武当文旅AI短视频生成器 - 主控脚本
整合所有MVP功能：节日提醒、多版本生成、合规检查、视频管理、数据分析
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from festival_reminder import FestivalReminder
from batch_video_generator import BatchVideoGenerator
from compliance_checker import ComplianceChecker
from video_manager import VideoManager
from analytics import Analytics
from seedance_video import SeedanceVideoClient

import json
import argparse


class WudangVideoCreator:
    """武当视频创作助手"""
    
    def __init__(self):
        api_key = os.environ.get("VOLCENGINE_API_KEY")
        model_id = os.environ.get("SEEDANCE_MODEL_ID", "doubao-seedance-1-5-pro-251215")
        
        self.festival = FestivalReminder()
        self.generator = BatchVideoGenerator(api_key, model_id) if api_key else None
        self.checker = ComplianceChecker()
        self.manager = VideoManager()
        self.analytics = Analytics()
        self.client = SeedanceVideoClient(api_key, model_id) if api_key else None
    
    def check_festivals(self) -> str:
        """检查节日提醒"""
        upcoming = self.festival.check_upcoming(days_ahead=7)
        if upcoming:
            return self.festival.format_reminder(upcoming)
        return ""
    
    def check_compliance(self, text: str) -> dict:
        """检查合规性"""
        return self.checker.check_text(text)
    
    def create_video(self, prompt: str, theme: str = "landscape", 
                    mood: str = "serene", duration: int = 10,
                    wait: bool = False) -> dict:
        """
        创建视频（完整流程）
        
        参数：
            prompt: 创意描述
            theme: 主题
            mood: 氛围
            duration: 时长
            wait: 是否等待完成
        
        返回：
            结果字典
        """
        if not self.generator:
            return {"success": False, "error": "未配置API密钥"}
        
        # 1. 合规检查
        print("🔍 正在进行内容合规自检...")
        compliance_result = self.checker.check_text(prompt)
        print(self.checker.format_report(compliance_result))
        
        if compliance_result["risk_level"] == "high":
            return {
                "success": False, 
                "error": "内容存在高风险，请修改后再试",
                "compliance": compliance_result
            }
        
        # 2. 生成3个版本
        print("\n🎬 开始生成3个版本视频...")
        result = self.generator.generate_three_versions(
            base_prompt=prompt,
            theme=theme,
            mood=mood,
            duration=duration
        )
        
        if not result["success"]:
            return result
        
        # 3. 添加到视频库
        video_id = self.manager.add_video({
            "title": prompt[:30] + "..." if len(prompt) > 30 else prompt,
            "base_prompt": prompt,
            "status": "generating",
            "params": result["params"],
            "versions": result["versions"],
            "compliance_check": compliance_result["passed"]
        })
        
        print(f"\n📁 已添加到视频库，ID: {video_id}")
        
        # 4. 等待完成
        if wait:
            print("\n⏳ 等待所有版本完成...")
            final_result = self.generator.wait_all_complete(result, timeout=300)
            
            # 更新视频库状态
            for version in final_result["versions"]:
                if version["status"] == "completed":
                    self.manager.update_video(video_id, {
                        "status": "completed",
                        "versions": final_result["versions"]
                    })
                    # 记录成功
                    self.analytics.record_generation(
                        success=True,
                        theme=theme,
                        hotspot=prompt[:10]
                    )
                elif version["status"] == "failed":
                    self.analytics.record_generation(
                        success=False,
                        theme=theme
                    )
            
            print(self.generator.format_result(final_result))
            return final_result
        
        return result
    
    def list_videos(self, status: str = None, limit: int = 10) -> str:
        """列出视频"""
        videos = self.manager.list_videos(status=status, limit=limit)
        return self.manager.format_video_list(videos)
    
    def get_video(self, video_id: str) -> str:
        """获取视频详情"""
        video = self.manager.get_video(video_id)
        if video:
            return self.manager.format_video_detail(video)
        return f"未找到视频: {video_id}"
    
    def check_video_status(self, video_id: str) -> str:
        """检查视频状态"""
        video = self.manager.get_video(video_id)
        if not video:
            return f"未找到视频: {video_id}"
        
        if not video.get("versions"):
            return "该视频没有版本信息"
        
        print(f"\n📊 检查视频 {video_id} 的状态...")
        
        # 检查每个版本的状态
        for version in video["versions"]:
            if version["status"] in ["completed", "failed"]:
                continue
            
            task_id = version.get("task_id")
            if task_id and self.client:
                status_result = self.client.get_task_status(task_id)
                if status_result.get("success"):
                    version["status"] = status_result.get("status")
                    version["video_url"] = status_result.get("video_url")
        
        # 更新视频库
        self.manager.update_video(video_id, {"versions": video["versions"]})
        
        return self.manager.format_video_detail(video)
    
    def get_stats(self, days: int = 7) -> str:
        """获取统计报告"""
        return self.analytics.format_report(days)


def interactive_mode():
    """交互模式"""
    creator = WudangVideoCreator()
    
    print("\n" + "=" * 60)
    print("🎬 武当文旅AI视频创作助手")
    print("=" * 60)
    
    # 检查节日提醒
    reminder = creator.check_festivals()
    if reminder:
        print(f"\n{reminder}")
        print("\n是否基于节日创作？")
        choice = input("1. 是  2. 否，日常创作  > ").strip()
        if choice == "1":
            print("\n请输入节日相关创意（或留空使用推荐）：")
            prompt = input("> ").strip()
            if not prompt:
                upcoming = creator.festival.check_upcoming(days_ahead=7)
                if upcoming:
                    ideas = creator.festival.get_festival_ideas(upcoming[0]["name"])
                    print(f"\n推荐创意：")
                    for i, idea in enumerate(ideas, 1):
                        print(f"{i}. {idea['title']}")
                    idea_choice = input("\n请选择（1-3）或输入创意 > ").strip()
                    if idea_choice.isdigit() and 1 <= int(idea_choice) <= 3:
                        prompt = ideas[int(idea_choice)-1]["content"]
                    else:
                        prompt = idea_choice
    else:
        print("\n1. 创建新视频")
        print("2. 查看视频库")
        print("3. 查看统计")
        choice = input("\n请选择 > ").strip()
        
        if choice == "1":
            prompt = input("\n请输入视频创意描述 > ").strip()
        elif choice == "2":
            print(creator.list_videos())
            return
        elif choice == "3":
            print(creator.get_stats())
            return
        else:
            return
    
    if not prompt:
        print("创意不能为空")
        return
    
    # 选择主题
    print("\n选择主题：")
    print("1. 风景 (landscape)")
    print("2. 太极 (taichi)")
    print("3. 武术 (martial_arts)")
    print("4. 文化 (culture)")
    theme_choice = input("> ").strip()
    
    themes = {
        "1": "landscape",
        "2": "taichi",
        "3": "martial_arts",
        "4": "culture"
    }
    theme = themes.get(theme_choice, "landscape")
    
    # 创建视频
    print(f"\n🎬 开始创建视频...")
    result = creator.create_video(
        prompt=prompt,
        theme=theme,
        wait=True
    )
    
    if result.get("success"):
        print("\n✅ 视频创建完成！")
    else:
        print(f"\n❌ 创建失败: {result.get('error', '未知错误')}")


def main():
    parser = argparse.ArgumentParser(description="武当文旅AI视频创作助手")
    parser.add_argument("--interactive", "-i", action="store_true", help="交互模式")
    parser.add_argument("--create", "-c", help="创建视频（提供创意描述）")
    parser.add_argument("--theme", "-t", default="landscape", 
                       choices=["landscape", "taichi", "martial_arts", "culture"],
                       help="视频主题")
    parser.add_argument("--list", "-l", action="store_true", help="列出视频")
    parser.add_argument("--status", "-s", help="检查视频状态（提供视频ID）")
    parser.add_argument("--stats", action="store_true", help="查看统计")
    parser.add_argument("--festival", "-f", action="store_true", help="查看节日提醒")
    
    args = parser.parse_args()
    
    creator = WudangVideoCreator()
    
    if args.festival:
        reminder = creator.check_festivals()
        if reminder:
            print(reminder)
        else:
            print("未来7天没有特殊的节日或节气")
    
    elif args.create:
        result = creator.create_video(
            prompt=args.create,
            theme=args.theme,
            wait=True
        )
        if not result.get("success"):
            print(f"错误: {result.get('error')}")
            sys.exit(1)
    
    elif args.list:
        print(creator.list_videos())
    
    elif args.status:
        print(creator.check_video_status(args.status))
    
    elif args.stats:
        print(creator.get_stats())
    
    elif args.interactive:
        interactive_mode()
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
