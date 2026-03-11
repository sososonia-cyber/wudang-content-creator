#!/usr/bin/env python3
"""
武当内容创作者 - 内容生成辅助脚本

功能：
- 热点内容格式化
- 选题评分计算
- 发布排期规划
"""

import json
import datetime
from typing import Dict, List, Tuple

def calculate_topic_score(hotness: int, relevance: int, feasibility: int, timeliness: int) -> Tuple[int, str]:
    """
    计算选题综合评分
    
    参数：
        hotness: 热度 (1-10)
        relevance: 关联度 (1-10)
        feasibility: 可行性 (1-10)
        timeliness: 时效性 (1-10)
    
    返回：
        (总分, 评级)
    """
    # 权重配置
    weights = {
        'hotness': 0.3,
        'relevance': 0.3,
        'feasibility': 0.2,
        'timeliness': 0.2
    }
    
    total_score = int(
        hotness * weights['hotness'] +
        relevance * weights['relevance'] +
        feasibility * weights['feasibility'] +
        timeliness * weights['timeliness']
    )
    
    # 评级
    if total_score >= 8:
        rating = "A级-立即执行"
    elif total_score >= 6:
        rating = "B级-快速跟进"
    elif total_score >= 4:
        rating = "C级-视资源决定"
    else:
        rating = "D级-不建议执行"
    
    return total_score, rating


def format_hotspot_data(platform: str, topic: str, heat_level: str, wudang_angle: str) -> Dict:
    """
    格式化热点数据
    
    参数：
        platform: 平台名称
        topic: 热点话题
        heat_level: 热度等级 (高/中/低)
        wudang_angle: 武当融合角度
    
    返回：
        结构化热点数据
    """
    return {
        "platform": platform,
        "topic": topic,
        "heat_level": heat_level,
        "wudang_angle": wudang_angle,
        "timestamp": datetime.datetime.now().isoformat(),
        "status": "pending_review"
    }


def generate_content_calendar(start_date: str, days: int = 7) -> List[Dict]:
    """
    生成内容发布日历
    
    参数：
        start_date: 开始日期 (YYYY-MM-DD)
        days: 天数
    
    返回：
        发布计划列表
    """
    calendar = []
    start = datetime.datetime.strptime(start_date, "%Y-%m-%d")
    
    content_types = [
        {"type": "短视频", "platform": "抖音", "best_time": "12:00"},
        {"type": "短视频", "platform": "视频号", "best_time": "18:00"},
        {"type": "图文", "platform": "小红书", "best_time": "10:00"},
        {"type": "中视频", "platform": "B站", "best_time": "20:00"},
    ]
    
    for i in range(days):
        current_date = start + datetime.timedelta(days=i)
        content_type = content_types[i % len(content_types)]
        
        calendar.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "content_type": content_type["type"],
            "platform": content_type["platform"],
            "publish_time": content_type["best_time"],
            "status": "planned"
        })
    
    return calendar


def analyze_content_performance(views: int, likes: int, comments: int, shares: int) -> Dict:
    """
    分析内容表现数据
    
    参数：
        views: 播放量
        likes: 点赞数
        comments: 评论数
        shares: 分享数
    
    返回：
        分析报告
    """
    # 计算互动率
    engagement_rate = (likes + comments + shares) / views * 100 if views > 0 else 0
    
    # 计算各指标占比
    like_rate = likes / views * 100 if views > 0 else 0
    comment_rate = comments / views * 100 if views > 0 else 0
    share_rate = shares / views * 100 if views > 0 else 0
    
    # 评级
    if engagement_rate >= 10:
        performance = "优秀"
    elif engagement_rate >= 5:
        performance = "良好"
    elif engagement_rate >= 2:
        performance = "一般"
    else:
        performance = "需优化"
    
    return {
        "views": views,
        "engagement_rate": round(engagement_rate, 2),
        "like_rate": round(like_rate, 2),
        "comment_rate": round(comment_rate, 2),
        "share_rate": round(share_rate, 2),
        "performance": performance
    }


def main():
    """主函数 - 示例用法"""
    print("=" * 50)
    print("武当内容创作者 - 辅助工具")
    print("=" * 50)
    
    # 示例1：选题评分
    print("\n【示例1】选题评分计算")
    score, rating = calculate_topic_score(
        hotness=8,
        relevance=9,
        feasibility=7,
        timeliness=8
    )
    print(f"综合评分: {score}/10")
    print(f"评级: {rating}")
    
    # 示例2：格式化热点数据
    print("\n【示例2】热点数据格式化")
    hotspot = format_hotspot_data(
        platform="抖音",
        topic="太极拳养生",
        heat_level="高",
        wudang_angle="道长分享养生秘诀"
    )
    print(json.dumps(hotspot, ensure_ascii=False, indent=2))
    
    # 示例3：生成发布日历
    print("\n【示例3】发布日历生成")
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    calendar = generate_content_calendar(today, 3)
    for item in calendar:
        print(f"{item['date']} | {item['content_type']} | {item['platform']} | {item['publish_time']}")
    
    # 示例4：内容表现分析
    print("\n【示例4】内容表现分析")
    analysis = analyze_content_performance(
        views=10000,
        likes=800,
        comments=120,
        shares=50
    )
    print(f"播放量: {analysis['views']}")
    print(f"互动率: {analysis['engagement_rate']}%")
    print(f"表现评级: {analysis['performance']}")
    
    print("\n" + "=" * 50)


if __name__ == "__main__":
    main()
