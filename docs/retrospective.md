# 预约服务小程序 — 开发复盘

> 项目周期：完整开发 + 6轮迭代优化
> 最终产出：12个前端页面 + 19个后端模块文件 + 3741行代码
> 20次 Git 提交

---

## 一、项目全貌

### 里程碑时间线

| 阶段 | 内容 | 产出 |
|------|------|------|
| 需求分析 | 分析 proginn.com 外链，梳理3大模块 | PRD.md |
| 技术方案 | 后端架构设计 | BACKEND_DESIGN.md |
| 原型设计 | 6个移动端HTML原型 | .cozeproj/prototype/mobile/ |
| 首次开发 | 前端6页+后端6接口+数据库 | 完整可运行版本 |
| 迭代1 | UI修复+预约统计联动 | Tab样式/分隔线/事件刷新 |
| 迭代2 | 管理后台全栈开发 | 5个管理页+JWT认证+用户管理 |
| 迭代3 | 登录校验+信息联动 | useAuthGuard+联系人自动带入 |
| 迭代4 | 新用户引导+信息校验 | 昵称/手机号输入引导+预约拦截 |
| 迭代5 | 分类管理+排序功能 | categories表+排序API+管理页 |

### 交付物清单

| 类别 | 数量 | 说明 |
|------|------|------|
| 前端页面 | 12个 | 小程序6页 + 管理后台6页(含登录) |
| 后端API | 18个 | 服务5+预约5+分类6+认证3+用户管理3 |
| 数据表 | 4张 | services, appointments, time_slots, users, categories(5张) |
| 种子数据 | 3分类+8服务+1管理员 | 首次启动自动初始化 |
| 文档 | 4份 | PRD/后端方案/README/SQLite避坑指南 |

---

## 二、经验总结（按优先级排序）

### 🔴 P0 — 数据库变更是最大风险源

**问题**：分类管理需求涉及 schema 变更，一轮"小改动"花了59分钟、1.4万积分，占总开发的约30%。

**根因**：`schema.ts` / `CREATE TABLE SQL` / `seed.ts` 三者反复不一致，导致循环：
```
改schema → 忘改CREATE TABLE → SQLITE_ERROR → 删库重启 → 
seed又报错 → 改seed → Drizzle类型推断失败 → 改as any → 
又发现废弃字段没删 → 再删库...
```
循环了5-6轮，每轮约8-10分钟。

**预防方案**：
1. **变更前三文件同步检查**（强制）
   - [ ] schema.ts：新增/删除字段
   - [ ] db/index.ts CREATE TABLE：对应SQL同步修改
   - [ ] seed.ts：种子数据是否包含新字段/移除旧字段
2. **废弃字段一步到位**：删字段时，schema + CREATE TABLE + seed + service 中所有引用一次性全部删除
3. **NOT NULL 字段必给 DEFAULT**：避免 seed INSERT 缺字段报错
4. **Drizzle 类型用 `as any` 兜底**：drizzle-orm 对复合类型的推断经常失败，`as any` 比 debug 类型更省时

---

### 🔴 P0 — 后端先测再写前端

**问题**：首次开发时，先写完所有前端页面再写后端，导致：
- 前端调用的字段名与后端不匹配（如 `startTime` vs `timeSlot`）
- 响应数据层级错误（`res.data` vs `res.data.data`）
- 需要回头改前端代码

**正确流程**：
```
前端页面(含调用逻辑) → 后端接口(立即curl测试) → 前后端匹配验证 → 下一个模块
```
每个后端接口写完后**立即** curl 测试，确认 200 + 数据结构正确，再继续。

---

### 🟡 P1 — 跨端兼容要提前规避

**问题清单与解法**：

| 坑 | 解法 | 发现阶段 |
|---|---|---|
| `py-1.5` 小数类名被 ESLint 拦截 | 统一用整数类名 `py-2` / `py-1` | validate 阶段 |
| `Input` 要用 `@/components/ui/input` | 先查组件库再写页面 | validate 阶段 |
| `CheckCircle` 图标不存在 | 用 `npx taro-lucide-find` 预验证 | 编译阶段 |
| `type="password"` TSC 报错 | 用 `type={'password' as any}` | 编译阶段 |
| `Input` H5 端 inline 样式失效 | View 包裹 + 样式放外层 | 开发阶段 |

**预防方案**：写页面之前先确认 1) 图标名 2) UI 组件路径 3) Tailwind 类名合规。

---

### 🟡 P1 — 状态联动用事件中心

**问题**：预约创建/取消后，"我的"页面的统计数字不更新。

**解法**：`Taro.eventCenter` 跨页面通信
```typescript
// 发布方
Taro.eventCenter.trigger('appointment:changed')

// 订阅方
useEffect(() => {
  Taro.eventCenter.on('appointment:changed', fetchStats)
  return () => Taro.eventCenter.off('appointment:changed', fetchStats)
}, [])
```

**适用场景**：TabBar 页面间的数据同步、操作后刷新关联页面。

---

### 🟡 P1 — 管理后台必须做登录校验

**问题**：管理页面可直接通过 URL 访问，无需登录。

**解法**：`useAuthGuard` Hook
```typescript
export function useAuthGuard() {
  useEffect(() => {
    const token = Taro.getStorageSync('admin_token')
    if (!token) {
      Taro.redirectTo({ url: '/pages/admin/login/index' })
    }
  }, [])
}
```

每个管理页面组件顶部调用即可，未登录自动跳转。

---

### 🟢 P2 — 原型设计减少返工

**收益**：先出原型再开发，用户在原型阶段就提出了修改意见（Tab样式、空白区域、编辑头像），避免了开发后大改。

**流程**：`需求 → 原型(6页HTML) → 用户确认 → 代码开发`

**注意**：设计引导开启时，以原型 HTML 为唯一视觉标准，跳过 design_guidelines.md 生成。

---

### 🟢 P2 — 种子数据与默认账号

**问题**：API 测试时修改了 admin 密码，导致后续"登录不进去"。

**预防方案**：
1. 种子数据写入后打印日志确认
2. 提供重置命令：`rm -f server/data/appointment.db && 重启后端`
3. 测试时用测试账号而非默认管理员

---

## 三、开发效率基准

### 正常耗时参考

| 任务 | 预估耗时 | 实际耗时 | 偏差原因 |
|------|---------|---------|---------|
| 需求分析+PRD | 10min | 10min | — |
| 原型设计 | 15min | 15min | — |
| 前端6页(首次) | 30min | 45min | 跨端兼容踩坑 |
| 后端6接口(首次) | 20min | 25min | better-sqlite3导入问题 |
| 管理后台全栈 | 40min | 50min | JWT+Guard配置 |
| 分类管理+排序 | 15min | 59min | **数据库变更循环** |

### 效率公式

**正常开发**：需求分析10% + 编码60% + 验证30%

**踩坑开发**：需求分析5% + 编码30% + 调试修复65%

**关键洞察**：调试修复耗时与"数据库变更次数"正相关。改一次DB = 额外20分钟。

---

## 四、检查清单（未来项目参考）

### 开发前
- [ ] 确认所有图标名 (`npx taro-lucide-find xxx --json`)
- [ ] 确认 UI 组件路径 (`ls src/components/ui`)
- [ ] 确认 Tailwind 类名合规（无小数、无 px 值）

### 数据库变更时
- [ ] schema.ts 字段增/删
- [ ] db/index.ts CREATE TABLE SQL 同步
- [ ] seed.ts 种子数据同步
- [ ] service/controller 中废弃引用清理
- [ ] NOT NULL 字段给 DEFAULT
- [ ] Drizzle 类型推断用 `as any` 兜底
- [ ] `rm -f server/data/*.db` 重建验证

### 后端接口开发
- [ ] 写完立即 curl 测试（200 + 数据结构）
- [ ] 前后端匹配验证（URL/方法/参数名/响应层级）
- [ ] 小程序端接口加 @Public()
- [ ] 管理端接口加 @Roles() + JWT Guard

### 交付前
- [ ] `pnpm validate` 零错误
- [ ] `pnpm build` 编译成功
- [ ] 日志健康检查
- [ ] 小程序打包配置（project.config.json / project.tt.json）

---

## 五、技术债务

| 项目 | 优先级 | 说明 |
|------|--------|------|
| 文件上传 | P1 | 头像更换目前只有前端交互，需接入 TOS 对象存储 |
| 用户认证(小程序端) | P2 | 当前无登录机制，用 storage 模拟用户身份 |
| 时段配置 | P2 | 营业时间硬编码在 time-slot service，需可配置化 |
| 预约通知 | P3 | 预约成功/取消后无消息通知 |
| 数据统计 | P3 | Dashboard 统计数据较简单，可增加图表 |
