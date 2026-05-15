# Taro 小程序开发最佳实践

> 适用项目：Taro + NestJS + Tailwind CSS 技术栈的小程序项目

## 一、数据库变更（最高优先级）

详见 [sqlite-drizzle/SKILL.md](../sqlite-drizzle/SKILL.md)

核心：**schema.ts / CREATE TABLE SQL / seed.ts 三者必须同步修改**，否则一轮小改动可能浪费30分钟。

## 二、后端先测再写前端

**错误流程**：写完所有前端 → 写后端 → 发现字段名不匹配
**正确流程**：
```
前端页面(含调用逻辑) → 后端接口(立即curl测试) → 前后端匹配验证 → 下一个模块
```

每个后端接口写完后**立即** curl 测试：
```bash
curl -s http://localhost:3000/api/xxx | python3 -m json.tool
```

## 三、跨端兼容提前规避

| 坑 | 解法 |
|---|---|
| `py-1.5` 小数类名被 ESLint 拦截 | 统一用整数类名 |
| `Input` 要用 `@/components/ui/input` | 先查组件库再写页面 |
| 图标名可能不存在 | `npx taro-lucide-find IconName --json` 预验证 |
| `type="password"` TSC 报错 | `type={'password' as any}` |
| Input H5 inline 样式失效 | View 包裹 + 样式放外层 |
| Fixed + Flex H5 失效 | `style={{ position:'fixed', display:'flex' }}` |
| 底部 TabBar 遮挡 | 固定元素 `bottom: 50+` |

**写页面之前先确认**：1) 图标名 2) UI 组件路径 3) Tailwind 类名合规

## 四、状态联动用事件中心

跨 TabBar 页面数据同步：
```typescript
// 发布方
Taro.eventCenter.trigger('appointment:changed')

// 订阅方
useEffect(() => {
  Taro.eventCenter.on('appointment:changed', fetchStats)
  return () => Taro.eventCenter.off('appointment:changed', fetchStats)
}, [])
```

## 五、管理后台必须登录校验

```typescript
export function useAuthGuard() {
  useEffect(() => {
    const token = Taro.getStorageSync('admin_token')
    if (!token) {
      Taro.redirectTo({ url: '/pages/admin/login/index' })
    }
  }, [])
}
// 每个管理页面组件内调用：useAuthGuard()
```

## 六、新用户信息引导

- 昵称/手机号未填写时显示灰色提示文字
- 电话保存后不可修改（锁图标 + 脱敏显示）
- 预约操作前检查联系信息是否完善
- Storage 键名规范：`user_nickname` / `user_phone` / `user_phone_raw`

## 七、页面开发前置检查

创建页面前逐项确认：

- [ ] 需要哪些 UI 组件（Button/Input/Card/Tabs/Dialog...）→ 优先 `@/components/ui/*`
- [ ] 需要哪些图标 → `npx taro-lucide-find` 验证
- [ ] 是否是 TabBar 页面 → 配置 app.config.ts
- [ ] 是否需要导航 → 一级页 TabBar / 二级页 header 返回
- [ ] 页面配置文件 → `index.config.ts` 用 `definePageConfig` 兼容写法

## 八、API 接口前后端匹配验证

后端接口完成后立即检查：

| 检查项 | 说明 |
|---|---|
| URL 路径 | 前端 `/api/xxx` 与后端 `@Controller('xxx')` 一致 |
| HTTP 方法 | 前端 `method: 'POST'` 与后端 `@Post()` 一致 |
| 参数名 | 前端 `data: { name }` 与后端 `@Body() { name }` 一致 |
| 响应层级 | `res.data.data.xxx`（信封模式） |
| 文件上传 name | 前端 `name: 'file'` 与后端 `FileInterceptor('file')` 一致 |

## 九、种子数据与默认账号管理

- 种子数据只在 `count === 0` 时插入（避免重复）
- 默认管理员：admin/admin，首次登录 `mustChangePassword: true`
- 测试时改了密码后需重置：`rm -f server/data/*.db && 重启后端`
- **不要用数据库文件名硬编码**，用通配符 `*.db` 删除

## 十、validate 阶段常见错误速查

| 错误 | 原因 | 解法 |
|---|---|---|
| `no-unused-vars` | 导入了未使用的 hook/变量 | 立即删除未使用的 import |
| `Tailwind 小数类名` | `py-1.5` / `gap-2.5` | 改为整数 `py-2` / `gap-3` |
| `no-native-input` | 直接用 `@tarojs/components Input` | 改用 `@/components/ui/input` |
| `type="password"` 报错 | TaroInput 类型定义不包含 | `type={'password' as any}` |
