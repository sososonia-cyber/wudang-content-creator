import axios from 'axios';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import FormData from 'form-data';

interface VideoGenerationParams {
  prompt: string;
  imageUrl?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '3:4';
  resolution?: '360p' | '540p' | '720p' | '1080p';
  duration?: 5 | 10;
}

interface GenerationResult {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  progress?: number;
  error?: string;
}

export class SeedanceService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.apis.seedance;
    this.baseUrl = 'https://api.seedance.io/v1';
  }

  // 提交视频生成任务
  async submitGeneration(params: VideoGenerationParams): Promise<GenerationResult> {
    try {
      if (!this.apiKey) {
        logger.warn('Seedance API Key未配置，返回模拟任务ID');
        return {
          taskId: `mock-${Date.now()}`,
          status: 'pending'
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/videos/generations`,
        {
          prompt: params.prompt,
          image_url: params.imageUrl,
          aspect_ratio: params.aspectRatio || '9:16',
          resolution: params.resolution || '1080p',
          duration: params.duration || 10
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        taskId: response.data.task_id || response.data.id,
        status: 'pending'
      };

    } catch (error: any) {
      logger.error('提交视频生成任务失败:', error.message);
      throw new Error(`视频生成任务提交失败: ${error.message}`);
    }
  }

  // 查询任务状态
  async checkStatus(taskId: string): Promise<GenerationResult> {
    try {
      if (!this.apiKey || taskId.startsWith('mock-')) {
        // 模拟进度
        const progress = this.getMockProgress(taskId);
        return {
          taskId,
          status: progress >= 100 ? 'completed' : 'processing',
          progress,
          videoUrl: progress >= 100 ? `https://example.com/mock-video-${taskId}.mp4` : undefined
        };
      }

      const response = await axios.get(
        `${this.baseUrl}/videos/generations/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 10000
        }
      );

      const data = response.data;
      
      return {
        taskId,
        status: data.status || 'pending',
        progress: data.progress || 0,
        videoUrl: data.video_url || data.output?.video_url,
        error: data.error?.message
      };

    } catch (error: any) {
      logger.error('查询视频生成状态失败:', error.message);
      return {
        taskId,
        status: 'failed',
        error: error.message
      };
    }
  }

  // 批量生成视频
  async batchGenerate(
    basePrompt: string,
    count: number,
    variations: string[]
  ): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];

    for (let i = 0; i < count; i++) {
      const variation = variations[i] || '';
      const prompt = `${basePrompt}，${variation}`;
      
      try {
        const result = await this.submitGeneration({
          prompt,
          aspectRatio: '9:16',
          resolution: '1080p',
          duration: 10
        });
        
        results.push(result);
      } catch (error) {
        logger.error(`生成第${i + 1}个视频失败:`, error);
        results.push({
          taskId: `failed-${i}`,
          status: 'failed',
          error: '提交失败'
        });
      }
    }

    return results;
  }

  // 生成平台适配版本
  async generatePlatformVersions(
    basePrompt: string,
    platforms: string[]
  ): Promise<Record<string, GenerationResult>> {
    const platformConfigs: Record<string, { aspectRatio: '16:9' | '9:16' | '1:1' | '3:4'; prompt: string }> = {
      'douyin': { aspectRatio: '9:16', prompt: `${basePrompt}，竖屏短视频风格` },
      'xiaohongshu': { aspectRatio: '3:4', prompt: `${basePrompt}，小红书风格，精美画面` },
      'kuaishou': { aspectRatio: '9:16', prompt: `${basePrompt}，快手风格，接地气` },
      'bilibili': { aspectRatio: '16:9', prompt: `${basePrompt}，B站风格，横屏高清` },
      'wechat_video': { aspectRatio: '9:16', prompt: `${basePrompt}，视频号风格` }
    };

    const results: Record<string, GenerationResult> = {};

    for (const platform of platforms) {
      const config = platformConfigs[platform];
      if (!config) continue;

      try {
        const result = await this.submitGeneration({
          prompt: config.prompt,
          aspectRatio: config.aspectRatio,
          resolution: '1080p',
          duration: 10
        });
        
        results[platform] = result;
      } catch (error) {
        logger.error(`生成${platform}版本失败:`, error);
        results[platform] = {
          taskId: `failed-${platform}`,
          status: 'failed',
          error: '生成失败'
        };
      }
    }

    return results;
  }

  // 模拟进度
  private mockProgressMap = new Map<string, number>();

  private getMockProgress(taskId: string): number {
    const current = this.mockProgressMap.get(taskId) || 0;
    const increment = Math.floor(Math.random() * 20) + 5;
    const newProgress = Math.min(current + increment, 100);
    this.mockProgressMap.set(taskId, newProgress);
    return newProgress;
  }
}

export const seedanceService = new SeedanceService();
