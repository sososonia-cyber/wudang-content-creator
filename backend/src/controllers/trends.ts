import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/env';
import axios from 'axios';

// 验证Schema
const createResponseSchema = z.object({
  trendId: z.string(),
  title: z.string().min(1),
  theme: z.enum(['LANDSCAPE', 'TAICHI', 'MARTIAL_ARTS', 'CULTURE'])
});

export const trendController = {
  // 获取热点列表
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { source, limit = '20' } = req.query;

      const where: any = {};
      if (source) where.source = source;

      const trends = await prisma.trend.findMany({
        where,
        take: parseInt(limit as string),
        orderBy: [
          { heatScore: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      next(error);
    }
  },

  // 获取热点预测 (MiroFish)
  prediction: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 获取Top 3热点进行预测
      const topTrends = await prisma.trend.findMany({
        take: 3,
        orderBy: { heatScore: 'desc' }
      });

      // 调用LLM进行预测分析
      const predictions = await Promise.all(
        topTrends.map(async (trend) => {
          const prediction = await analyzeTrendImpact(trend);
          return {
            ...trend,
            prediction
          };
        })
      );

      res.json({
        success: true,
        data: predictions
      });
    } catch (error) {
      next(error);
    }
  },

  // 获取武当相关热点
  wudang: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trends = await prisma.trend.findMany({
        where: {
          isWudangRelated: true
        },
        orderBy: [
          { heatScore: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 20
      });

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      next(error);
    }
  },

  // 创建热点响应内容
  createResponse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createResponseSchema.parse(req.body);

      // 获取热点信息
      const trend = await prisma.trend.findUnique({
        where: { id: validatedData.trendId }
      });

      if (!trend) {
        throw new AppError('热点不存在', 404);
      }

      // 生成创意建议
      const recommendations = await generateTrendRecommendations(trend, validatedData.theme);

      // 创建视频草稿
      const video = await prisma.video.create({
        data: {
          title: validatedData.title,
          theme: validatedData.theme,
          status: 'DRAFT',
          metadata: {
            sourceTrend: trend.title,
            recommendations
          }
        }
      });

      res.json({
        success: true,
        message: '热点响应内容创建成功',
        data: {
          videoId: video.id,
          trend: trend.title,
          recommendations
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 手动触发热点抓取
  fetchTrends: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: 调用Qveris API获取最新热点
      const mockTrends = [
        {
          title: '#武当山雪景',
          source: 'weibo',
          heatScore: 985000,
          heatLevel: 'HIGH',
          riskLevel: 'LOW',
          sentiment: 'POSITIVE',
          isWudangRelated: true,
          keywords: ['武当山', '雪景', '冬季']
        },
        {
          title: '#春季养生',
          source: 'xiaohongshu',
          heatScore: 652000,
          heatLevel: 'MEDIUM',
          riskLevel: 'MEDIUM',
          sentiment: 'POSITIVE',
          isWudangRelated: true,
          keywords: ['养生', '太极', '健康']
        }
      ];

      // 保存到数据库
      for (const trendData of mockTrends) {
        await prisma.trend.create({
          data: trendData as any
        });
      }

      res.json({
        success: true,
        message: '热点抓取完成',
        data: { count: mockTrends.length }
      });
    } catch (error) {
      next(error);
    }
  }
};

// 使用LLM分析热点影响
async function analyzeTrendImpact(trend: any) {
  try {
    // 如果配置了LLM API，调用进行分析
    if (config.apis.llm) {
      const response = await axios.post(
        config.apis.llmBaseUrl,
        {
          model: config.apis.llmModel,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的文旅内容分析师，擅长评估热点对武当山品牌的影响。'
            },
            {
              role: 'user',
              content: `分析热点 "${trend.title}" 对武当山品牌的潜在影响。返回JSON格式：{"risk": "高/中/低", "sentiment": "正面/负面/中性", "recommendation": "一句话建议", "confidence": 0-1}`
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apis.llm}`
          }
        }
      );

      const result = response.data.choices[0].message.content;
      return JSON.parse(result);
    }

    // 默认返回基于规则的预测
    return generateRuleBasedPrediction(trend);
  } catch (error) {
    return generateRuleBasedPrediction(trend);
  }
}

// 基于规则的预测 (备用)
function generateRuleBasedPrediction(trend: any) {
  const keywords = {
    positive: ['武当', '太极', '道教', '养生', '风景', '旅游', '文化'],
    negative: ['事故', '负面', '争议'],
    risky: ['政治', '宗教争议']
  };

  const title = trend.title.toLowerCase();
  
  // 检查关键词
  const hasPositive = keywords.positive.some(k => title.includes(k));
  const hasNegative = keywords.negative.some(k => title.includes(k));
  const hasRisky = keywords.risky.some(k => title.includes(k));

  // 风险判断
  let risk = 'LOW';
  if (hasRisky) risk = 'HIGH';
  else if (hasNegative) risk = 'MEDIUM';

  // 情感判断
  let sentiment = 'NEUTRAL';
  if (hasPositive) sentiment = 'POSITIVE';
  if (hasNegative) sentiment = 'NEGATIVE';

  // 建议
  let recommendation = '可以结合创作';
  if (risk === 'HIGH') recommendation = '谨慎评估后再创作';
  else if (risk === 'MEDIUM') recommendation = '注意内容导向';
  else if (sentiment === 'POSITIVE') recommendation = '建议立即创作';

  return {
    risk,
    sentiment,
    recommendation,
    confidence: 0.75,
    source: 'rule-based'
  };
}

// 生成热点创作建议
async function generateTrendRecommendations(trend: any, theme: string) {
  const themeSuggestions: Record<string, string[]> = {
    LANDSCAPE: [
      `结合"${trend.title}"展示武当山自然风光`,
      '突出金顶、云海等标志性景观',
      '建议发布时间: 早上7-9点'
    ],
    TAICHI: [
      `将"${trend.title}"与太极养生结合`,
      '展示太极拳与自然的和谐',
      '强调健康养生的生活方式'
    ],
    MARTIAL_ARTS: [
      `结合热点展示武当功夫`,
      '突出武术的力量与美感',
      '建议加入动作教学元素'
    ],
    CULTURE: [
      `从文化角度解读"${trend.title}"`,
      '融入道教文化元素',
      '强调历史底蕴和文化传承'
    ]
  };

  return themeSuggestions[theme] || themeSuggestions.LANDSCAPE;
}
