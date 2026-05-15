# SQLite + Drizzle ORM 开发避坑指南

> 适用项目：Taro + NestJS + SQLite + Drizzle ORM 技术栈的小程序项目

## 核心原则：三文件同步修改

修改数据库时，以下三个文件**必须同步更新**：

| 文件 | 作用 | 改错后果 |
|------|------|---------|
| `server/src/db/schema.ts` | Drizzle ORM 类型定义 | TSC 编译失败 / INSERT 类型错误 |
| `server/src/db/index.ts` | `CREATE TABLE IF NOT EXISTS` SQL | 运行时 SQLITE_ERROR |
| `server/src/db/seed.ts` | 种子数据 INSERT | 运行时 SQLITE_ERROR |

### 变更检查清单（强制执行）

- [ ] schema.ts 中表定义已更新
- [ ] db/index.ts 中 CREATE TABLE SQL 已同步（字段名、类型、约束完全一致）
- [ ] seed.ts 中 INSERT 数据已同步
- [ ] 所有引用该表的 Service/Controller 已更新
- [ ] 删除旧数据库文件：`rm -f server/data/*.db`

## 5 大高频踩坑

### 坑1：新增字段 CREATE TABLE 漏改
**现象**：`SQLITE_ERROR: table xxx has no column named yyy`
**预防**：改 schema 后立即对照改 CREATE TABLE，逐一核对。

### 坑2：NOT NULL 字段没给默认值
**现象**：`NOT NULL constraint failed: xxx.yyy`
**预防**：
- `created_at` 必须加 `DEFAULT (datetime('now'))`
- 可选字段不加 `NOT NULL`，或给 DEFAULT
- 新增字段尽量给 DEFAULT：`sort_order INTEGER NOT NULL DEFAULT 0`

### 坑3：废弃字段删不干净
**现象**：Drizzle INSERT 引用已删字段
**预防**：删字段时全局搜索，确保4处全部清理：
```bash
grep -rn "旧字段名" server/src/
```

### 坑4：Drizzle insert 类型推断失败
**现象**：TSC 报 `Object literal may only specify known properties`
**预防**：
- 删除 `server/dist` 目录后重新编译
- 实在绕不过去用 `as any`，加注释说明

### 坑5：数据库重建后 seed 仍失败
**预防**：
```bash
rm -f server/data/*.db   # 用通配符，避免记错文件名
cd /workspace/projects && coze dev   # 重启后端，不依赖热更新
```

## 数据库变更 SOP

```
Step 1: 修改 schema.ts
Step 2: 修改 CREATE TABLE SQL（逐一对照 schema）
Step 3: 修改 seed.ts
Step 4: grep 全局搜索旧字段引用并清理
Step 5: rm -f server/data/*.db
Step 6: 重启后端验证
```

## NOT NULL 字段默认值模板

```sql
created_at TEXT NOT NULL DEFAULT (datetime('now'))
sort_order INTEGER NOT NULL DEFAULT 0
status TEXT NOT NULL DEFAULT 'active'
category_id INTEGER NOT NULL DEFAULT 1
```
