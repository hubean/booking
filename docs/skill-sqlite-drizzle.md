# SQLite + Drizzle ORM 开发避坑指南

> 血泪教训：一个小需求（加分类表+排序字段）花了59分钟，核心原因是 schema / CREATE TABLE / seed 三者反复不一致。

## 核心原则：三者必须同步修改

当你修改数据库结构时，**以下三个位置必须同步更新**，漏改任何一个都会导致 SQLITE_ERROR 或 TSC 报错：

| 文件 | 作用 | 改错后果 |
|------|------|---------|
| `server/src/db/schema.ts` | Drizzle ORM 类型定义 | TSC 编译失败 / INSERT 类型错误 |
| `server/src/db/index.ts` | `CREATE TABLE IF NOT EXISTS` SQL | 运行时 SQLITE_ERROR（列不存在 / NOT NULL 约束） |
| `server/src/db/seed.ts` | 种子数据 INSERT | 运行时 SQLITE_ERROR（字段不匹配 / 缺少必填值） |

### 修改检查清单（强制执行）

每次修改数据库字段时，逐项确认：

- [ ] schema.ts 中的表定义已更新
- [ ] db/index.ts 中对应的 CREATE TABLE SQL 已同步更新（字段名、类型、约束完全一致）
- [ ] seed.ts 中该表的 INSERT 数据已同步更新
- [ ] 所有引用该表的 Service/Controller 已更新（select 字段、where 条件、insert/update 参数）
- [ ] 删除了旧数据库文件：`rm -f server/data/appointment.db`

## 高频踩坑记录

### 坑1：新增字段时 CREATE TABLE 漏改

**现象**：`SQLITE_ERROR: table xxx has no column named yyy`

**根因**：schema.ts 加了字段，但 CREATE TABLE SQL 没加对应列。

**预防**：修改 schema.ts 后，立即对照修改 CREATE TABLE，字段逐一核对。

### 坑2：NOT NULL 字段没有默认值

**现象**：`NOT NULL constraint failed: xxx.yyy`

**根因**：CREATE TABLE 中定义了 `NOT NULL` 但没给 `DEFAULT`，seed 的 INSERT 又没包含该字段。

**预防**：
- 所有 `created_at` 类字段必须加 `DEFAULT (datetime('now'))`
- 可选字段不要加 `NOT NULL`，或给 `DEFAULT` 值
- 新增字段尽量给 DEFAULT 值：`sort_order INTEGER NOT NULL DEFAULT 0`

### 坑3：废弃字段删不干净

**现象**：`SQLITE_ERROR: table xxx has no column named yyy`（Drizzle INSERT 引用了已删字段）

**根因**：想删掉旧字段（如 `category` 改为 `category_id`），但 schema.ts / CREATE TABLE / seed / Service 代码中仍残留引用。

**预防**：删除字段时全局搜索，确保4处全部清理：
```
grep -rn "category[^I]" server/src/
```

### 坑4：Drizzle insert 类型推断失败

**现象**：TSC 报 `Object literal may only specify known properties`

**根因**：Drizzle 的 insert 类型由 schema 推断，新增字段后类型缓存未刷新。

**预防**：
- 删除 `server/dist` 目录后重新编译
- 实在绕不过去用 `as any` 临时处理，但必须加注释说明原因

### 坑5：数据库重建后 seed 仍然失败

**现象**：删了 .db 文件重启，但 seed 插入仍然报错。

**根因**：`rm` 删的文件名不对（如实际叫 `appointment.db` 而非 `booking.db`），或热更新没有触发 `initDb()`。

**预防**：
```bash
# 统一用通配符删除，避免文件名记错
rm -f server/data/*.db
# 然后必须重启后端（不要依赖热更新）
cd /workspace/projects && coze dev
```

## 数据库变更 SOP（标准操作流程）

### Step 1：修改 schema.ts
添加/修改/删除字段，确认字段类型、约束、默认值。

### Step 2：修改 CREATE TABLE SQL
打开 `db/index.ts`，找到对应的 CREATE TABLE 语句，**逐一字段对照 schema.ts 同步修改**。

### Step 3：修改 seed.ts
更新种子数据，确保 INSERT 的字段与 schema 完全一致。

### Step 4：全局搜索旧字段引用
```bash
grep -rn "旧字段名" server/src/
```
清理所有 Service / Controller 中的引用。

### Step 5：删除旧数据库 + 重启
```bash
rm -f server/data/*.db
cd /workspace/projects && coze dev
```

### Step 6：验证
```bash
# 等后端启动后立即 curl 测试
curl -s http://localhost:3000/api/相关接口 | python3 -m json.tool
```

## 估算效率参考

| 操作 | 正常耗时 | 踩坑后耗时 | 差距原因 |
|------|---------|-----------|---------|
| 新增一张表 + CRUD 接口 | 15min | 40min | schema/CREATE/seed 不一致导致反复重启 |
| 新增字段 + 种子数据 | 5min | 20min | NOT NULL 约束 + 旧字段残留 |
| 整体数据库变更 | 20min | 59min | 上述问题叠加 |

**核心结论**：改数据库时，先花2分钟逐项检查三个文件的同步性，可以省下30分钟的调试时间。
