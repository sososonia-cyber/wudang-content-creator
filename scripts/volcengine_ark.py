#!/usr/bin/env python3
"""
火山方舟 API 调用脚本
用于内容生成时调用火山方舟大模型

环境变量：
- VOLCENGINE_API_KEY: 火山方舟API密钥
- VOLCENGINE_MODEL_ID: 模型ID（默认：doubao-pro-32k）
- VOLCENGINE_ENDPOINT: API端点（默认：https://ark.cn-beijing.volces.com/api/v3）
"""

import os
import sys
import json
import argparse
from typing import List, Dict, Optional
try:
    import requests
except ImportError:
    print("Error: requests module not found. Install with: pip install requests")
    sys.exit(1)


class VolcengineArkClient:
    """火山方舟客户端"""
    
    def __init__(self, api_key: Optional[str] = None, model_id: Optional[str] = None, endpoint: Optional[str] = None):
        self.api_key = api_key or os.environ.get("VOLCENGINE_API_KEY")
        self.model_id = model_id or os.environ.get("VOLCENGINE_MODEL_ID", "doubao-pro-32k")
        self.endpoint = endpoint or os.environ.get("VOLCENGINE_ENDPOINT", "https://ark.cn-beijing.volces.com/api/v3")
        
        if not self.api_key:
            raise ValueError("API Key is required. Set VOLCENGINE_API_KEY environment variable.")
    
    def chat_completion(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 4096) -> str:
        """
        调用对话API
        
        参数：
            messages: 消息列表，格式 [{"role": "system"|"user"|"assistant", "content": "..."}]
            temperature: 温度参数（0-2）
            max_tokens: 最大生成token数
        
        返回：
            生成的文本内容
        """
        url = f"{self.endpoint}/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model_id,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()
            result = response.json()
            
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            else:
                return "Error: Empty response from API"
        
        except requests.exceptions.RequestException as e:
            return f"Error: API request failed - {str(e)}"
        except json.JSONDecodeError as e:
            return f"Error: Failed to parse API response - {str(e)}"
        except KeyError as e:
            return f"Error: Unexpected API response format - {str(e)}"
    
    def generate_content(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        简化的内容生成接口
        
        参数：
            prompt: 用户提示词
            system_prompt: 系统提示词（可选）
        
        返回：
            生成的内容
        """
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        return self.chat_completion(messages)


def generate_video_script(topic: str, platform: str = "douyin", duration: int = 30) -> str:
    """
    生成短视频脚本
    
    参数：
        topic: 视频主题
        platform: 平台（douyin/kuaishou/xiaohongshu）
        duration: 时长（15/30/60秒）
    """
    client = VolcengineArkClient()
    
    system_prompt = """你是一个专业的短视频脚本创作专家，擅长创作武当山文旅内容的短视频脚本。
你的脚本应该：
1. 符合平台调性和时长要求
2. 有吸引力的开头（黄金3秒）
3. 清晰的分镜和对白
4. 引导互动的结尾
请使用标准短视频脚本格式输出。"""
    
    platform_names = {
        "douyin": "抖音",
        "kuaishou": "快手",
        "xiaohongshu": "小红书",
        "bilibili": "B站",
        "shipinhao": "视频号"
    }
    
    prompt = f"""请为"{topic}"创作一个{duration}秒的短视频脚本，发布在{platform_names.get(platform, platform)}平台。

要求：
- 时长：{duration}秒
- 平台：{platform_names.get(platform, platform)}
- 包含：分镜描述、对白/旁白、字幕、BGM建议
- 风格：年轻化、有吸引力、符合武当山文旅调性

请按照以下格式输出：

【标题】
【时长】
【BGM建议】

【镜头1】
画面：
对白：
字幕：
时长：

【镜头2】
...
"""
    
    return client.generate_content(prompt, system_prompt)


def generate_short_drama(plot: str, duration: int = 2, genre: str = "治愈") -> str:
    """
    生成短剧剧本
    
    参数：
        plot: 剧情梗概
        duration: 时长（1-3分钟）
        genre: 类型（治愈/喜剧/武侠/悬疑/爱情）
    """
    client = VolcengineArkClient()
    
    system_prompt = """你是一个专业的短剧剧本创作专家，擅长创作武当山文旅主题的短剧。
你的剧本应该：
1. 有完整的故事结构（起承转合）
2. 符合时长要求
3. 自然融入武当文化元素
4. 人物对话生动自然
请使用标准剧本格式输出。"""
    
    prompt = f"""请根据以下剧情创作一个{duration}分钟的短剧剧本：

剧情梗概：{plot}
类型：{genre}
时长：{duration}分钟

要求：
- 包含场景描述、人物对白、动作指示
- 融入武当山元素（文化、风景、人物）
- 适合短视频平台播放

请按照以下格式输出：

【剧集信息】
剧名：
时长：
类型：

【人物介绍】

【场景列表】

【正文】
场景1：
...
"""
    
    return client.generate_content(prompt, system_prompt)


def generate_creative_idea(hot_topic: str, wudang_ip: str, target_audience: str = "z世代") -> str:
    """
    生成创意策划
    
    参数：
        hot_topic: 热点话题
        wudang_ip: 武当IP元素
        target_audience: 目标受众
    """
    client = VolcengineArkClient()
    
    system_prompt = """你是一个资深的内容创意策划专家，擅长将热点话题与武当山文化IP融合。
你的创意应该：
1. 热点与武当元素自然融合
2. 有新意，能吸引目标受众
3. 可操作性强
4. 符合平台传播规律"""
    
    prompt = f"""请为以下内容创作创意策划方案：

热点话题：{hot_topic}
武当IP元素：{wudang_ip}
目标受众：{target_audience}

请提供：
1. 内容角度（3个不同角度）
2. 建议内容形式（短视频/图文/短剧等）
3. 核心创意点
4. 执行要点
5. 预期效果
"""
    
    return client.generate_content(prompt, system_prompt)


def main():
    parser = argparse.ArgumentParser(description="火山方舟API内容生成工具")
    parser.add_argument("--mode", choices=["script", "drama", "idea"], required=True, help="生成模式")
    parser.add_argument("--topic", help="主题/剧情")
    parser.add_argument("--platform", default="douyin", help="平台（douyin/kuaishou/xiaohongshu）")
    parser.add_argument("--duration", type=int, default=30, help="时长（秒或分钟）")
    parser.add_argument("--genre", default="治愈", help="短剧类型")
    parser.add_argument("--hot-topic", help="热点话题")
    parser.add_argument("--wudang-ip", help="武当IP元素")
    
    args = parser.parse_args()
    
    try:
        if args.mode == "script":
            if not args.topic:
                print("Error: --topic is required for script mode")
                sys.exit(1)
            result = generate_video_script(args.topic, args.platform, args.duration)
        
        elif args.mode == "drama":
            if not args.topic:
                print("Error: --topic is required for drama mode")
                sys.exit(1)
            result = generate_short_drama(args.topic, args.duration, args.genre)
        
        elif args.mode == "idea":
            if not args.hot_topic or not args.wudang_ip:
                print("Error: --hot-topic and --wudang-ip are required for idea mode")
                sys.exit(1)
            result = generate_creative_idea(args.hot_topic, args.wudang_ip)
        
        print(result)
    
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
