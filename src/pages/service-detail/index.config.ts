export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '服务详情' })
  : { navigationBarTitleText: '服务详情' }
