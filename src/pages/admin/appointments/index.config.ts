export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '预约管理' })
  : { navigationBarTitleText: '预约管理' }
