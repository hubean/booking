export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '服务管理' })
  : { navigationBarTitleText: '服务管理' }
