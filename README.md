# 预约服务小程序 - 项目文档

## 1. 项目概述

基于 Taro 框架开发的预约服务小程序，面向美业、健身、餐饮等服务型商家提供线上预约解决方案。包含**小程序端**（C端用户预约）和**管理后台**（B端商家管理）两部分。

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Taro + React | 跨端小程序 + H5 |
| 样式 | Tailwind CSS 4 + weapp-tailwindcss | 原子化样式，跨端适配 |
| UI 组件库 | shadcn/ui (Taro版) | `@/components/ui/*` |
| 图标 | lucide-react-taro | Taro 适配版 Lucide 图标 |
| 后端框架 | NestJS | RESTful API |
| ORM | Drizzle ORM | 轻量 TypeScript ORM |
| 数据库 | SQLite (better-sqlite3) | 零配置文件级存储 |
| 认证 | JWT + Passport | 管理后台身份验证 |
| 密码加密 | bcryptjs | 安全哈希存储 |

---

## 2. 页面结构

### 2.1 小程序端（6个页面）

| 页面 | 路径 | 类型 | 功能 |
|------|------|------|------|
| 首页 | `/pages/index/index` | TabBar | 分类筛选 + 服务卡片列表 + 搜索 |
| 预约记录 | `/pages/appointments/index` | TabBar | Tab 状态筛选 + 预约列表 + 取消预约 |
| 我的 | `/pages/profile/index` | TabBar | 用户信息 + 预约统计 + 编辑昵称/电话 + 管理后台入口 |
| 服务详情 | `/pages/service-detail/index` | 二级页 | 封面大图 + 服务信息 + 立即预约 |
| 预约提交 | `/pages/booking/index` | 二级页 | 选日期 + 选时段 + 联系信息 + 确认提交 |
| 预约成功 | `/pages/booking-success/index` | 二级页 | 成功图标 + 预约摘要 + 操作按钮 |

### 2.2 管理后台（5个页面）

| 页面 | 路径 | 功能 |
|------|------|------|
| 登录 | `/pages/admin/login/index` | 用户名 + 密码登录，首次登录强制改密码 |
| 仪表盘 | `/pages/admin/dashboard/index` | 预约统计 + 修改密码弹窗 |
| 服务管理 | `/pages/admin/services/index` | 新增 / 编辑 / 删除服务项目 |
| 预约管理 | `/pages/admin/appointments/index` | 查看预约列表 + 修改预约状态 |
| 用户管理 | `/pages/admin/users/index` | 新增 / 删除管理员用户 |

### 2.3 TabBar 配置

3 个一级页面：首页（House）、预约（Calendar）、我的（User），橙色选中态。

---

## 3. 后端 API

### 3.1 公开接口（小程序端，无需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/services` | 服务列表（支持 `category` 筛选） |
| GET | `/api/services/:id` | 服务详情 |
| GET | `/api/time-slots` | 可用时段查询（`serviceId` + `date`） |
| POST | `/api/appointments` | 创建预约 |
| GET | `/api/appointments` | 预约列表（支持 `status` 筛选） |
| PUT | `/api/appointments/:id/cancel` | 取消预约 |

### 3.2 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录（返回 JWT + mustChangePassword） |
| GET | `/api/auth/profile` | 获取当前用户信息 |
| PUT | `/api/auth/change-password` | 修改密码 |

### 3.3 管理接口（需 JWT + admin 角色）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 用户列表 |
| POST | `/api/users` | 新增用户 |
| DELETE | `/api/users/:id` | 删除用户 |
| POST | `/api/services` | 新增服务 |
| PUT | `/api/services/:id` | 更新服务 |
| DELETE | `/api/services/:id` | 删除服务 |
| GET | `/api/appointments/admin/list` | 管理端预约列表 |
| PUT | `/api/appointments/admin/:id/status` | 修改预约状态 |

---

## 4. 数据库设计

### 4.1 services 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| name | TEXT | 服务名称 |
| description | TEXT | 服务描述 |
| price | INTEGER | 价格（分） |
| duration | INTEGER | 时长（分钟） |
| image_url | TEXT | 封面图 URL |
| category | TEXT | 分类（beauty/fitness/food） |
| created_at | TEXT | 创建时间 |

### 4.2 appointments 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| service_id | INTEGER FK | 关联服务 |
| appointment_date | TEXT | 预约日期 |
| time_slot | TEXT | 预约时段 |
| contact_name | TEXT | 联系人姓名 |
| contact_phone | TEXT | 联系人电话 |
| status | TEXT | 状态（pending/completed/cancelled） |
| created_at | TEXT | 创建时间 |

### 4.3 users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| username | TEXT UNIQUE | 用户名 |
| password | TEXT | bcrypt 加密密码 |
| role | TEXT | 角色（admin/user） |
| must_change_password | INTEGER | 是否需要修改密码（0/1） |
| created_at | TEXT | 创建时间 |

### 4.4 种子数据

- 8 个预设服务项目（美业3 + 健身3 + 餐饮2）
- 1 个默认管理员账号：`admin / admin`（首次登录需改密码）

---

## 5. 核心业务流程

### 5.1 用户预约流程

```
首页(浏览服务) → 服务详情(查看) → 预约提交(选日期+时段)
  → POST /api/appointments → 后端校验(日期/时段/防重复)
  → 预约成功页(展示摘要)
  → 预约记录Tab(可查看/取消)
  → 取消时触发事件 → 我的页面统计刷新
```

### 5.2 用户信息流程

- 新用户首次进入【我的】页面，昵称和电话显示"请输入"提示
- 点击弹出输入弹窗，填写后保存到本地 Storage
- 电话保存后不可修改，显示脱敏号码 + 锁图标
- 预约提交页自动带入用户昵称和电话，联系信息不可编辑
- 未完善联系信息时点击"立即预约"提示先去【我的】页面完善

### 5.3 管理后台流程

```
登录(admin/admin) → 首次登录强制修改密码 → 仪表盘
  → 服务管理(CRUD)
  → 预约管理(查看/修改状态)
  → 用户管理(新增/删除)
```

---

## 6. 安全机制

- **JWT 认证**：管理后台所有接口需携带 Bearer Token
- **全局 Guard**：JwtAuthGuard 全局生效，小程序端接口 @Public() 放行
- **角色守卫**：@Roles('admin') 限制管理接口仅管理员可访问
- **密码加密**：bcryptjs 哈希存储，永不存明文
- **默认密码**：admin 首次登录 mustChangePassword=true，强制修改
- **登录校验**：前端 useAuthGuard Hook，未登录自动跳转登录页

---

## 7. 跨端适配

- 平台检测：`Taro.getEnv()` 判断 WEAPP/TT/H5
- TabBar 图标：本地 PNG（小程序强制要求），`npx taro-lucide-tabbar` 生成
- 样式：Tailwind 预设类名优先，禁止硬编码 px
- Text 换行：垂直排列的 Text 加 `block` 类
- Input 样式：View 包裹，样式放外层
- Fixed + Flex：使用 inline style，H5 端 Tailwind 失效
- 跨页面通信：Taro.eventCenter 事件机制

---

## 8. 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发环境（前端5000 + 后端3000）
coze dev

# 校验代码
pnpm validate

# 编译构建
pnpm build

# 重置数据库
rm -f server/data/appointment.db
```

### 默认账号

| 系统 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理后台 | admin | admin | 首次登录强制修改密码 |

---

## 9. 文件结构

```
├── src/                          # 前端源码
│   ├── pages/
│   │   ├── index/                # 首页（服务展示）
│   │   ├── appointments/         # 预约记录
│   │   ├── profile/              # 我的
│   │   ├── service-detail/       # 服务详情
│   │   ├── booking/              # 预约提交
│   │   ├── booking-success/      # 预约成功
│   │   └── admin/                # 管理后台
│   │       ├── login/            #   登录
│   │       ├── dashboard/        #   仪表盘
│   │       ├── services/         #   服务管理
│   │       ├── appointments/     #   预约管理
│   │       └── users/            #   用户管理
│   ├── components/ui/            # UI 组件库（shadcn/ui）
│   ├── hooks/
│   │   └── use-auth-guard.ts     # 管理后台登录校验 Hook
│   ├── network.ts                # 网络请求封装
│   ├── app.config.ts             # 应用配置（页面路由 + TabBar）
│   └── app.css                   # 全局样式 + Design Token
│
├── server/                       # 后端源码
│   └── src/
│       ├── db/
│       │   ├── schema.ts         # 数据库表定义
│       │   ├── index.ts          # 数据库初始化 + 种子执行
│       │   └── seed.ts           # 种子数据
│       ├── modules/
│       │   ├── service/          # 服务管理模块
│       │   ├── appointment/      # 预约管理模块
│       │   ├── time-slot/        # 时段查询模块
│       │   ├── auth/             # 认证模块（JWT + Passport）
│       │   └── user/             # 用户管理模块
│       ├── common/
│       │   ├── guards/           # JWT Guard + Roles Guard
│       │   ├── decorators/       # @Public() + @Roles()
│       │   └── utils/            # 统一响应格式
│       └── data/                 # SQLite 数据库文件
│
├── .cozeproj/prototype/mobile/   # 移动端原型（HTML）
├── PRD.md                        # 产品需求文档
├── BACKEND_DESIGN.md             # 后端技术方案
└── DESIGN.md                     # 设计风格文档
```
