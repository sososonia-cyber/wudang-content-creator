#!/usr/bin/env python3
"""
视频状态管理模块
管理视频生成任务的状态、分类、检索
"""

import json
import os
import datetime
from typing import Dict, List, Optional


class VideoManager:
    """视频管理器"""
    
    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = data_dir or os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "data"
        )
        self.video_file = os.path.join(self.data_dir, "video_library.json")
        self._ensure_data_dir()
        self.videos = self._load_videos()
    
    def _ensure_data_dir(self):
        """确保数据目录存在"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def _load_videos(self) -> List[Dict]:
        """加载视频库"""
        if os.path.exists(self.video_file):
            try:
                with open(self.video_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get("videos", [])
            except (json.JSONDecodeError, IOError):
                return []
        return []
    
    def _save_videos(self):
        """保存视频库"""
        try:
            with open(self.video_file, 'w', encoding='utf-8') as f:
                json.dump({"videos": self.videos}, f, ensure_ascii=False, indent=2)
            return True
        except IOError as e:
            print(f"保存视频库失败：{e}")
            return False
    
    def add_video(self, video_info: Dict) -> str:
        """
        添加新视频记录
        
        参数：
            video_info: 视频信息字典
        
        返回：
            视频ID
        """
        video_id = f"vid_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(self.videos):03d}"
        
        video_record = {
            "id": video_id,
            "created_at": datetime.datetime.now().isoformat(),
            "updated_at": datetime.datetime.now().isoformat(),
            "status": video_info.get("status", "draft"),
            **video_info
        }
        
        self.videos.append(video_record)
        self._save_videos()
        
        return video_id
    
    def update_video(self, video_id: str, updates: Dict) -> bool:
        """
        更新视频信息
        
        参数：
            video_id: 视频ID
            updates: 要更新的字段
        
        返回：
            是否成功
        """
        for video in self.videos:
            if video["id"] == video_id:
                video.update(updates)
                video["updated_at"] = datetime.datetime.now().isoformat()
                self._save_videos()
                return True
        return False
    
    def get_video(self, video_id: str) -> Optional[Dict]:
        """
        获取单个视频信息
        
        参数：
            video_id: 视频ID
        
        返回：
            视频信息或None
        """
        for video in self.videos:
            if video["id"] == video_id:
                return video
        return None
    
    def list_videos(self, status: Optional[str] = None, limit: int = 20) -> List[Dict]:
        """
        列出视频
        
        参数：
            status: 状态过滤（draft/generating/completed/failed/published）
            limit: 返回数量限制
        
        返回：
            视频列表
        """
        videos = self.videos
        
        if status:
            videos = [v for v in videos if v.get("status") == status]
        
        # 按时间倒序
        videos = sorted(videos, key=lambda x: x.get("created_at", ""), reverse=True)
        
        return videos[:limit]
    
    def get_stats(self) -> Dict:
        """获取视频统计信息"""
        stats = {
            "total": len(self.videos),
            "draft": len([v for v in self.videos if v.get("status") == "draft"]),
            "generating": len([v for v in self.videos if v.get("status") == "generating"]),
            "completed": len([v for v in self.videos if v.get("status") == "completed"]),
            "failed": len([v for v in self.videos if v.get("status") == "failed"]),
            "published": len([v for v in self.videos if v.get("status") == "published"])
        }
        
        # 今日生成
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        stats["today"] = len([
            v for v in self.videos 
            if v.get("created_at", "").startswith(today)
        ])
        
        return stats
    
    def delete_video(self, video_id: str) -> bool:
        """
        删除视频记录
        
        参数：
            video_id: 视频ID
        
        返回：
            是否成功
        """
        for i, video in enumerate(self.videos):
            if video["id"] == video_id:
                del self.videos[i]
                self._save_videos()
                return True
        return False
    
    def format_video_list(self, videos: List[Dict]) -> str:
        """格式化视频列表"""
        if not videos:
            return "暂无视频记录"
        
        lines = []
        lines.append("\n📁 视频库")
        lines.append("=" * 60)
        
        status_icons = {
            "draft": "📝",
            "generating": "⏳",
            "completed": "✅",
            "failed": "❌",
            "published": "🚀"
        }
        
        for i, video in enumerate(videos, 1):
            status = video.get("status", "unknown")
            icon = status_icons.get(status, "❓")
            
            created = video.get("created_at", "")[:16].replace("T", " ")
            title = video.get("title", video.get("base_prompt", "未命名"))[:30]
            
            lines.append(f"\n{i}. {icon} {title}")
            lines.append(f"   ID: {video['id']}")
            lines.append(f"   状态: {status} | 创建: {created}")
            
            # 显示版本信息
            if video.get("versions"):
                completed = len([v for v in video["versions"] if v.get("status") == "completed"])
                total = len(video["versions"])
                lines.append(f"   版本: {completed}/{total} 完成")
        
        lines.append("\n" + "=" * 60)
        lines.append(f"\n显示 {len(videos)} 条记录")
        
        return "\n".join(lines)
    
    def format_video_detail(self, video: Dict) -> str:
        """格式化视频详情"""
        lines = []
        lines.append("\n" + "=" * 60)
        lines.append("📹 视频详情")
        lines.append("=" * 60)
        
        lines.append(f"\nID: {video.get('id', 'N/A')}")
        lines.append(f"标题: {video.get('title', video.get('base_prompt', '未命名'))}")
        lines.append(f"状态: {video.get('status', 'unknown')}")
        lines.append(f"创建时间: {video.get('created_at', 'N/A')}")
        lines.append(f"更新时间: {video.get('updated_at', 'N/A')}")
        
        # 参数信息
        if video.get("params"):
            lines.append("\n📋 生成参数:")
            params = video["params"]
            lines.append(f"   主题: {params.get('theme', 'N/A')}")
            lines.append(f"   风格: {params.get('mood', 'N/A')}")
            lines.append(f"   时长: {params.get('duration', 'N/A')}s")
            lines.append(f"   分辨率: {params.get('resolution', 'N/A')}")
            lines.append(f"   比例: {params.get('ratio', 'N/A')}")
        
        # 版本信息
        if video.get("versions"):
            lines.append("\n🎬 生成版本:")
            for v in video["versions"]:
                status_icon = "✅" if v.get("status") == "completed" else "❌" if v.get("status") == "failed" else "⏳"
                lines.append(f"\n   {status_icon} 版本{v.get('version', '?')}: {v.get('version_name', 'N/A')}")
                if v.get("video_url"):
                    lines.append(f"      下载: {v['video_url']}")
                elif v.get("error"):
                    lines.append(f"      错误: {v['error']}")
        
        lines.append("\n" + "=" * 60)
        
        return "\n".join(lines)


def main():
    """测试视频管理"""
    manager = VideoManager()
    
    # 添加测试视频
    video_id = manager.add_video({
        "title": "春天武当山测试",
        "base_prompt": "武当山春天风景",
        "status": "completed",
        "params": {
            "theme": "landscape",
            "duration": 10,
            "resolution": "1080p"
        },
        "versions": [
            {"version": 1, "status": "completed", "video_url": "http://..."}
        ]
    })
    
    print(f"添加视频：{video_id}")
    
    # 列出视频
    videos = manager.list_videos()
    print(manager.format_video_list(videos))
    
    # 统计
    stats = manager.get_stats()
    print(f"\n统计：{stats}")


if __name__ == "__main__":
    main()
