import { PrismaClient } from '@prisma/client';

// 全局 Prisma 实例
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// 连接测试
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
};

// 优雅关闭
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log('👋 数据库连接已关闭');
};
