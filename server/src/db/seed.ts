import { eq, count } from 'drizzle-orm'
import { services } from './schema'
import type BetterSqlite3 from 'better-sqlite3'

export async function seed(db: ReturnType<typeof import('drizzle-orm/better-sqlite3').drizzle>) {
  // 检查是否已有数据
  const result = await db.select({ count: count() }).from(services)
  if (result[0].count > 0) return

  // 插入种子服务项目
  await db.insert(services).values([
    {
      name: '经典剪发',
      description:
        '资深发型师量身定制，打造专属造型。包含洗剪吹全套流程，适合所有发质和脸型。专业发型师一对一咨询，精细剪裁，造型定型，确保效果持久。',
      price: 6800,
      duration: 60,
      imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop',
      category: 'beauty',
    },
    {
      name: '精致染发',
      description:
        '进口植物染剂，持久显色不伤发。专业色彩顾问根据肤色推荐最适合的发色，全程约120分钟，让您的发色焕然一新。',
      price: 19800,
      duration: 120,
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop',
      category: 'beauty',
    },
    {
      name: '深层护理',
      description:
        '修复受损发质，重现柔顺光泽。采用高端护理产品，深层滋养发丝，改善干枯毛躁，约90分钟全程享受。',
      price: 12800,
      duration: 90,
      imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&h=300&fit=crop',
      category: 'beauty',
    },
    {
      name: '私教体验课',
      description:
        '一对一指导，定制专属训练方案。专业私教根据您的体能状况和目标，制定个性化训练计划，高效达成健身目标。',
      price: 29800,
      duration: 60,
      imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=300&fit=crop',
      category: 'fitness',
    },
    {
      name: '瑜伽团课',
      description:
        '小班教学，放松身心提升柔韧。适合各水平学员，专业瑜伽老师指导，在舒缓的音乐中释放压力。',
      price: 8800,
      duration: 75,
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=300&fit=crop',
      category: 'fitness',
    },
    {
      name: '搏击训练',
      description:
        '燃脂塑形，释放压力提升体能。专业搏击教练指导，学习基础拳法组合，高效燃脂的同时提升身体协调性。',
      price: 15800,
      duration: 60,
      imageUrl: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=300&h=300&fit=crop',
      category: 'fitness',
    },
    {
      name: '精品套餐',
      description:
        '精心搭配主厨推荐菜品，包含前菜、主菜和甜品。食材新鲜，烹饪精致，为您带来味蕾的极致享受。',
      price: 12800,
      duration: 90,
      imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&fit=crop',
      category: 'food',
    },
    {
      name: '下午茶套餐',
      description:
        '精选糕点搭配香醇茶饮，享受悠闲午后时光。包含三款精致甜点和一壶精选花茶，是闺蜜聚会的绝佳选择。',
      price: 5800,
      duration: 60,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=300&fit=crop',
      category: 'food',
    },
  ])
}
