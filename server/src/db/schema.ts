import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 分类表
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // 分类名称（如"美业"）
  key: text('key').notNull().unique(), // 分类标识（如"beauty"）
  icon: text('icon'), // 图标名称（可选）
  sortOrder: integer('sort_order').notNull().default(0), // 排序权重，越大越靠前
  status: text('status', {
    enum: ['active', 'inactive'],
  })
    .notNull()
    .default('active'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

// 服务项目表
export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(), // 价格（分）
  duration: integer('duration').notNull(), // 服务时长（分钟）
  imageUrl: text('image_url').notNull(), // 封面图 URL
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  sortOrder: integer('sort_order').notNull().default(0), // 排序权重，越大越靠前
  status: text('status', {
    enum: ['active', 'inactive'],
  })
    .notNull()
    .default('active'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

// 预约记录表
export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id')
    .notNull()
    .references(() => services.id),
  serviceName: text('service_name').notNull(),
  servicePrice: integer('service_price').notNull(),
  appointmentDate: text('appointment_date').notNull(), // YYYY-MM-DD
  timeSlot: text('time_slot').notNull(), // HH:mm
  contactName: text('contact_name').notNull(),
  contactPhone: text('contact_phone').notNull(),
  status: text('status', {
    enum: ['pending', 'completed', 'cancelled'],
  })
    .notNull()
    .default('pending'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

// 时段配置表
export const timeSlots = sqliteTable('time_slots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id')
    .notNull()
    .references(() => services.id),
  date: text('date').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(), // HH:mm
  maxCapacity: integer('max_capacity').notNull().default(1),
  bookedCount: integer('booked_count').notNull().default(0),
})

// 管理用户表
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // bcrypt hash
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  mustChangePassword: integer('must_change_password', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

// 类型导出
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Service = typeof services.$inferSelect
export type NewService = typeof services.$inferInsert
export type Appointment = typeof appointments.$inferSelect
export type NewAppointment = typeof appointments.$inferInsert
export type TimeSlot = typeof timeSlots.$inferSelect
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
