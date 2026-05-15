# 预约服务小程序 - 后端技术方案

## 1. 技术选型

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | NestJS | 10.4.15 | 后端主框架 |
| ORM | Drizzle ORM | 0.45.1 | 轻量 TypeScript ORM |
| 数据库 | SQLite (better-sqlite3) | - | MVP 阶段零配置，文件级存储 |
| 校验 | Zod | 4.3.5 | 请求参数校验 |
| 文件存储 | TOS (S3 兼容) | - | 服务封面图存储 |

---

## 2. 项目结构

```
server/src/
├── main.ts                          # 入口（已存在）
├── app.module.ts                    # 根模块（已存在）
├── app.controller.ts                # 健康检查（已存在）
├── app.service.ts                   # 健康检查（已存在）
├── interceptors/
│   └── http-status.interceptor.ts   # 201→200 拦截器（已存在）
│
├── db/                              # 数据库层
│   ├── index.ts                     # Drizzle 实例 + 连接初始化
│   ├── schema.ts                    # 全量表定义（Drizzle schema）
│   └── seed.ts                      # 种子数据（初始服务项目）
│
├── modules/
│   ├── service/                     # 服务项目模块
│   │   ├── service.module.ts
│   │   ├── service.controller.ts
│   │   └── service.service.ts
│   │
│   ├── appointment/                 # 预约模块
│   │   ├── appointment.module.ts
│   │   ├── appointment.controller.ts
│   │   └── appointment.service.ts
│   │
│   └── time-slot/                   # 时段模块
│       ├── time-slot.module.ts
│       ├── time-slot.controller.ts
│       └── time-slot.service.ts
│
└── common/                          # 公共层
    ├── dto/                         # Zod schema 定义
    │   ├── service.schema.ts
    │   ├── appointment.schema.ts
    │   └── time-slot.schema.ts
    └── utils/                       # 工具函数
        └── response.ts              # 统一响应格式
```

---

## 3. 数据库设计

### 3.1 Drizzle Schema 定义

#### services 表（服务项目）

```typescript
// server/src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),                    // 服务名称
  description: text('description').notNull(),      // 服务描述
  price: integer('price').notNull(),               // 价格（分）
  duration: integer('duration').notNull(),          // 服务时长（分钟）
  imageUrl: text('image_url').notNull(),            // 封面图 URL
  category: text('category', {
    enum: ['beauty', 'fitness', 'food']
  }).notNull(),                                     // 分类
  status: text('status', {
    enum: ['active', 'inactive']
  }).notNull().default('active'),                   // 状态
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})
```

#### appointments 表（预约记录）

```typescript
export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id').notNull().references(() => services.id),
  serviceName: text('service_name').notNull(),      // 冗余：服务名称
  servicePrice: integer('service_price').notNull(), // 冗余：服务价格
  appointmentDate: text('appointment_date').notNull(), // YYYY-MM-DD
  timeSlot: text('time_slot').notNull(),            // HH:mm
  contactName: text('contact_name').notNull(),      // 联系人姓名
  contactPhone: text('contact_phone').notNull(),    // 联系人电话
  status: text('status', {
    enum: ['pending', 'completed', 'cancelled']
  }).notNull().default('pending'),                  // 状态
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})
```

#### time_slots 表（时段配置）

```typescript
export const timeSlots = sqliteTable('time_slots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id').notNull().references(() => services.id),
  date: text('date').notNull(),                     // YYYY-MM-DD
  startTime: text('start_time').notNull(),          // HH:mm
  maxCapacity: integer('max_capacity').notNull().default(1), // 最大容量
  bookedCount: integer('booked_count').notNull().default(0), // 已预约数
})
```

### 3.2 表关系

```
services (1) ──── (N) appointments
services (1) ──── (N) time_slots
```

---

## 4. 统一响应格式

所有接口统一信封格式：

```typescript
// 成功响应
{
  "code": 200,
  "msg": "success",
  "data": { ... } | [ ... ]
}

// 错误响应
{
  "code": 400,       // 业务错误码
  "msg": "错误描述",
  "data": null
}
```

**工具函数**：

```typescript
// server/src/common/utils/response.ts
export function success<T>(data: T, msg = 'success') {
  return { code: 200, msg, data }
}

export function fail(code: number, msg: string) {
  return { code, msg, data: null }
}
```

---

## 5. API 接口详细设计

### 5.1 服务模块

#### GET /api/services — 获取服务列表

**Query 参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | 分类筛选：beauty / fitness / food |

**响应**：
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "name": "经典剪发",
      "description": "资深发型师一对一服务",
      "price": 6800,
      "duration": 60,
      "imageUrl": "https://tos-xxx/xxx.jpg",
      "category": "beauty",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**逻辑**：
1. 若传 category，按分类筛选；否则返回全部
2. 仅返回 status=active 的服务
3. 按 createdAt 倒序排列

---

#### GET /api/services/:id — 获取服务详情

**Path 参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 服务 ID |

**响应**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "name": "经典剪发",
    "description": "资深发型师一对一服务，包含洗剪吹全套流程...",
    "price": 6800,
    "duration": 60,
    "imageUrl": "https://tos-xxx/xxx.jpg",
    "category": "beauty",
    "status": "active",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**异常**：
- id 不存在 → 404, "服务不存在"

---

### 5.2 预约模块

#### POST /api/appointments — 创建预约

**Body 参数**：
```json
{
  "serviceId": 1,
  "appointmentDate": "2025-06-15",
  "timeSlot": "10:00",
  "contactName": "张三",
  "contactPhone": "13800138000"
}
```

**Zod 校验**：
```typescript
const createAppointmentSchema = z.object({
  serviceId: z.number().int().positive(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/),
  contactName: z.string().min(1).max(20),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/),
})
```

**响应**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "serviceId": 1,
    "serviceName": "经典剪发",
    "servicePrice": 6800,
    "appointmentDate": "2025-06-15",
    "timeSlot": "10:00",
    "contactName": "张三",
    "contactPhone": "138****0000",
    "status": "pending",
    "createdAt": "2025-06-14T10:00:00.000Z"
  }
}
```

**逻辑**：
1. 校验 serviceId 存在且 status=active
2. 校验该时段未被约满（bookedCount < maxCapacity）
3. 查询服务信息，冗余写入 serviceName / servicePrice
4. 创建预约记录，同时 time_slots.bookedCount + 1
5. 返回时手机号脱敏（中间4位用 * 替代）

**异常**：
- 服务不存在 → 404, "服务不存在"
- 时段已满 → 400, "该时段已约满"
- 日期为过去 → 400, "预约日期不能早于今天"

---

#### GET /api/appointments — 获取预约列表

**Query 参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态筛选：pending / completed / cancelled |

**响应**：
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "serviceId": 1,
      "serviceName": "经典剪发",
      "servicePrice": 6800,
      "appointmentDate": "2025-06-15",
      "timeSlot": "10:00",
      "contactName": "张三",
      "contactPhone": "138****0000",
      "status": "pending",
      "createdAt": "2025-06-14T10:00:00.000Z"
    }
  ]
}
```

**逻辑**：
1. 若传 status，按状态筛选；否则返回全部
2. 按 createdAt 倒序排列
3. 手机号脱敏

---

#### PUT /api/appointments/:id/cancel — 取消预约

**Path 参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 预约 ID |

**响应**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "status": "cancelled"
  }
}
```

**逻辑**：
1. 校验预约存在
2. 校验当前状态为 pending（仅待服务可取消）
3. 更新状态为 cancelled
4. 同时 time_slots.bookedCount - 1

**异常**：
- 预约不存在 → 404, "预约不存在"
- 状态非 pending → 400, "仅待服务的预约可取消"

---

### 5.3 时段模块

#### GET /api/time-slots — 获取可用时段

**Query 参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| serviceId | number | 是 | 服务 ID |
| date | string | 是 | 日期 YYYY-MM-DD |

**响应**：
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    { "startTime": "09:00", "maxCapacity": 1, "bookedCount": 0, "available": true },
    { "startTime": "10:00", "maxCapacity": 1, "bookedCount": 1, "available": false },
    { "startTime": "11:00", "maxCapacity": 1, "bookedCount": 0, "available": true }
  ]
}
```

**逻辑**：
1. 若 time_slots 表有记录，返回该日该服务的时段
2. 若无记录，自动生成默认时段（09:00~18:00，每小时一个时段），默认 maxCapacity=1
3. available = bookedCount < maxCapacity
4. 过去时段标记 available=false

---

## 6. 种子数据

应用启动时自动初始化 8 个服务项目：

| # | 名称 | 分类 | 价格(分) | 时长(分) |
|---|------|------|----------|----------|
| 1 | 经典剪发 | beauty | 6800 | 60 |
| 2 | 精致染发 | beauty | 19800 | 120 |
| 3 | 深层护理 | beauty | 12800 | 90 |
| 4 | 私教体验课 | fitness | 29800 | 60 |
| 5 | 瑜伽团课 | fitness | 8800 | 75 |
| 6 | 搏击训练 | fitness | 15800 | 60 |
| 7 | 精品套餐 | food | 12800 | 90 |
| 8 | 下午茶套餐 | food | 5800 | 60 |

---

## 7. 数据库初始化策略

采用**代码启动时自动建表 + 种子数据**方式：

```
应用启动
  ↓
Drizzle 连接 SQLite（文件: server/data/app.db）
  ↓
执行 push 操作（自动同步 schema → 建表）
  ↓
检测 services 表是否为空
  ↓
为空 → 插入种子数据
  ↓
服务就绪
```

**优点**：
- 零配置，无需手动建表
- 开发阶段 schema 变更自动同步
- 种子数据保证开箱即用

---

## 8. NestJS 模块依赖关系

```
AppModule
├── DbModule（全局）          — 提供 Drizzle 实例注入
├── ServiceModule
│   └── ServiceService       — CRUD services 表
├── AppointmentModule
│   ├── AppointmentService   — CRUD appointments 表
│   └── 依赖 ServiceService  — 查询服务信息
└── TimeSlotModule
    └── TimeSlotService      — 查询/生成时段
```

---

## 9. 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 数据库 | SQLite | MVP 零配置，Drizzle 原生支持，后续可平滑迁移 PG |
| ORM | Drizzle | 项目已有依赖，类型安全，轻量 |
| 校验 | Zod | 项目已有依赖，端到端类型推断 |
| 手机号存储 | 明文存 + 查询脱敏 | MVP 阶段无需加密，返回时中间4位替代为 * |
| 时段生成 | 懒生成 | 不预生成，按需计算，减少数据冗余 |
| 防重复提交 | 接口层校验 | 同一手机号+同日+同时段不允许重复预约 |

---

## 10. 接口安全与防护

### 10.1 防重复预约
```typescript
// 创建预约前检查
const existing = await db.select().from(appointments)
  .where(and(
    eq(appointments.contactPhone, phone),
    eq(appointments.appointmentDate, date),
    eq(appointments.timeSlot, slot),
    eq(appointments.status, 'pending')
  ))
if (existing.length > 0) throw new BadRequestException('您已预约该时段')
```

### 10.2 参数校验
所有写接口使用 Zod schema 校验，不合法直接 400

### 10.3 手机号脱敏
```typescript
function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}
```
