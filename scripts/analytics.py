#!/usr/bin/env python3
"""
数据分析模块
记录生成数据，提供简单统计分析
"""

import json
import os
import datetime
from typing import Dict, List, Optional


class Analytics:
    """数据分析器"""
    
    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = data_dir or os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "data"
        )
        self.analytics_file = os.path.join(self.data_dir, "analytics.json")
        self._ensure_data_dir()
        self.data = self._load_data()
    
    def _ensure_data_dir(self):
        """确保数据目录存在"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def _load_data(self) -> Dict:
        """加载分析数据"""
        if os.path.exists(self.analytics_file):
            try:
                with open(self.analytics_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return self._init_data()
        return self._init_data()
    
    def _init_data(self) -> Dict:
        """初始化数据结构"""
        return {
            "daily_stats": {},
            "hotspot_usage": {},
            "theme_usage": {},
            "success_rate": {"total": 0, "success": 0},
            "first_record": datetime.datetime.now().isoformat()
        }
    
    def _save_data(self):
        """保存分析数据"""
        try:
            with open(self.analytics_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)
            return True
        except IOError as e:
            print(f"保存分析数据失败：{e}")
            return False
    
    def record_generation(self, success: bool, theme: str = "", 
                         hotspot: str = "", duration: int = 0):
        """
        记录一次生成
        
        参数：
            success: 是否成功
            theme: 主题
            hotspot: 热点词
            duration: 生成时长（秒）
        """
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        
        # 每日统计
        if today not in self.data["daily_stats"]:
            self.data["daily_stats"][today] = {
                "generated": 0,
                "success": 0,
                "failed": 0,
                "total_time": 0
            }
        
        self.data["daily_stats"][today]["generated"] += 1
        if success:
            self.data["daily_stats"][today]["success"] += 1
        else:
            self.data["daily_stats"][today]["failed"] += 1
        self.data["daily_stats"][today]["total_time"] += duration
        
        # 主题统计
        if theme:
            self.data["theme_usage"][theme] = self.data["theme_usage"].get(theme, 0) + 1
        
        # 热点统计
        if hotspot:
            self.data["hotspot_usage"][hotspot] = self.data["hotspot_usage"].get(hotspot, 0) + 1
        
        # 成功率统计
        self.data["success_rate"]["total"] += 1
        if success:
            self.data["success_rate"]["success"] += 1
        
        self._save_data()
    
    def get_daily_stats(self, days: int = 7) -> Dict:
        """
        获取最近N天统计
        
        参数：
            days: 天数
        
        返回：
            统计数据
        """
        result = {}
        today = datetime.datetime.now()
        
        for i in range(days):
            date = (today - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
            if date in self.data["daily_stats"]:
                result[date] = self.data["daily_stats"][date]
            else:
                result[date] = {"generated": 0, "success": 0, "failed": 0, "total_time": 0}
        
        return result
    
    def get_summary(self, days: int = 7) -> Dict:
        """
        获取汇总统计
        
        参数：
            days: 最近N天
        
        返回：
            汇总数据
        """
        daily = self.get_daily_stats(days)
        
        total_generated = sum(d["generated"] for d in daily.values())
        total_success = sum(d["success"] for d in daily.values())
        total_failed = sum(d["failed"] for d in daily.values())
        total_time = sum(d["total_time"] for d in daily.values())
        
        success_rate = (total_success / total_generated * 100) if total_generated > 0 else 0
        avg_time = (total_time / total_generated) if total_generated > 0 else 0
        
        # 热门主题TOP5
        top_themes = sorted(
            self.data["theme_usage"].items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]
        
        # 热门热点TOP5
        top_hotspots = sorted(
            self.data["hotspot_usage"].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        return {
            "period_days": days,
            "total_generated": total_generated,
            "total_success": total_success,
            "total_failed": total_failed,
            "success_rate": round(success_rate, 1),
            "avg_time": round(avg_time, 1),
            "top_themes": top_themes,
            "top_hotspots": top_hotspots
        }
    
    def format_report(self, days: int = 7) -> str:
        """格式化统计报告"""
        summary = self.get_summary(days)
        
        lines = []
        lines.append("\n" + "=" * 60)
        lines.append(f"📊 使用统计报告（最近{days}天）")
        lines.append("=" * 60)
        
        lines.append(f"\n🎬 视频生成：")
        lines.append(f"   总计：{summary['total_generated']} 条")
        lines.append(f"   成功：{summary['total_success']} 条")
        lines.append(f"   失败：{summary['total_failed']} 条")
        lines.append(f"   成功率：{summary['success_rate']}%")
        lines.append(f"   平均耗时：{summary['avg_time']} 秒")
        
        if summary['top_themes']:
            lines.append(f"\n🏷️ 热门主题TOP5：")
            for i, (theme, count) in enumerate(summary['top_themes'], 1):
                lines.append(f"   {i}. {theme} - {count}次")
        
        if summary['top_hotspots']:
            lines.append(f"\n🔥 热门热点TOP5：")
            for i, (hotspot, count) in enumerate(summary['top_hotspots'], 1):
                lines.append(f"   {i}. {hotspot} - {count}次")
        
        lines.append("\n" + "=" * 60)
        
        return "\n".join(lines)


def main():
    """测试数据分析"""
    analytics = Analytics()
    
    # 模拟记录一些数据
    analytics.record_generation(True, theme="风景", hotspot="春天", duration=45)
    analytics.record_generation(True, theme="太极", hotspot="养生", duration=50)
    analytics.record_generation(False, theme="文化", hotspot="道教", duration=30)
    
    # 查看统计
    print(analytics.format_report(days=7))


if __name__ == "__main__":
    main()
