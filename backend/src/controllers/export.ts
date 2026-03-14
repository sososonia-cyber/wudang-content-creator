import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createObjectCsvWriter } from 'csv-writer';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

export const exportController = {
  // 导出CSV
  exportCSV: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type = 'videos', startDate, endDate } = req.query;

      let data: any[] = [];
      let headers: any[] = [];

      if (type === 'videos') {
        data = await prisma.video.findMany({
          where: {
            createdAt: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          },
          include: {
            platformContents: true
          }
        });

        headers = [
          { id: 'id', title: 'ID' },
          { id: 'title', title: '标题' },
          { id: 'theme', title: '主题' },
          { id: 'status', title: '状态' },
          { id: 'versions', title: '版本数' },
          { id: 'createdAt', title: '创建时间' }
        ];
      } else if (type === 'stats') {
        data = await prisma.dailyStats.findMany({
          where: {
            date: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          }
        });

        headers = [
          { id: 'date', title: '日期' },
          { id: 'platform', title: '平台' },
          { id: 'videoCount', title: '视频数' },
          { id: 'viewCount', title: '播放量' },
          { id: 'likeCount', title: '点赞数' },
          { id: 'commentCount', title: '评论数' },
          { id: 'shareCount', title: '分享数' }
        ];
      }

      const tempFile = path.join('/tmp', `export-${Date.now()}.csv`);
      
      const csvWriter = createObjectCsvWriter({
        path: tempFile,
        header: headers
      });

      await csvWriter.writeRecords(data);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
      
      const fileStream = fs.createReadStream(tempFile);
      fileStream.pipe(res);

      // 清理临时文件
      fileStream.on('end', () => {
        fs.unlinkSync(tempFile);
      });

    } catch (error) {
      next(error);
    }
  },

  // 导出Excel
  exportExcel: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;

      // 获取数据
      const [videos, stats, tasks] = await Promise.all([
        prisma.video.findMany({
          where: {
            createdAt: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          }
        }),
        prisma.dailyStats.findMany({
          where: {
            date: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          }
        }),
        prisma.task.findMany({
          where: {
            createdAt: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          }
        })
      ]);

      // 创建工作簿
      const workbook = XLSX.utils.book_new();

      // 视频数据表
      const videoSheet = XLSX.utils.json_to_sheet(videos);
      XLSX.utils.book_append_sheet(workbook, videoSheet, '视频数据');

      // 统计数据表
      const statsSheet = XLSX.utils.json_to_sheet(stats);
      XLSX.utils.book_append_sheet(workbook, statsSheet, '统计数据');

      // 任务数据表
      const taskSheet = XLSX.utils.json_to_sheet(tasks);
      XLSX.utils.book_append_sheet(workbook, taskSheet, '任务数据');

      // 生成文件
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=data-export-${Date.now()}.xlsx`);
      
      res.send(buffer);

    } catch (error) {
      next(error);
    }
  },

  // 导出PDF报告
  exportPDF: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reportType = 'weekly', startDate, endDate } = req.query;

      // 生成报告HTML
      const html = await generateReportHTML(reportType as string, startDate as string, endDate as string);

      // 使用Puppeteer生成PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report-${Date.now()}.pdf`);
      
      res.send(pdf);

    } catch (error) {
      logger.error('PDF导出失败:', error);
      next(error);
    }
  }
};

// 生成报告HTML
async function generateReportHTML(reportType: string, startDate: string, endDate: string): Promise<string> {
  // 获取数据
  const stats = await prisma.dailyStats.findMany({
    where: {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
  });

  const videos = await prisma.video.findMany({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
  });

  const totalViews = stats.reduce((sum, s) => sum + s.viewCount, 0);
  const totalLikes = stats.reduce((sum, s) => sum + s.likeCount, 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #1677ff; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f5f5f5; padding: 15px; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1677ff; }
        .stat-label { color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #1677ff; color: white; }
      </style>
    </head>
    <body>
      <h1>武当内容创作系统 - ${reportType === 'weekly' ? '周报' : '数据报告'}</h1>
      <p>报告周期: ${startDate} 至 ${endDate}</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalViews.toLocaleString()}</div>
          <div class="stat-label">总播放量</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalLikes.toLocaleString()}</div>
          <div class="stat-label">总点赞数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${videos.length}</div>
          <div class="stat-label">发布视频数</div>
        </div>
      </div>

      <h2>视频列表</h2>
      <table>
        <thead>
          <tr>
            <th>标题</th>
            <th>主题</th>
            <th>状态</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          ${videos.map(v => `
            <tr>
              <td>${v.title}</td>
              <td>${v.theme}</td>
              <td>${v.status}</td>
              <td>${v.createdAt.toISOString().split('T')[0]}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
}
