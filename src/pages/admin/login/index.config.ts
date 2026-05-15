export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '管理后台登录' })
  : { navigationBarTitleText: '管理后台登录' }
