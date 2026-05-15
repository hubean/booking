export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '预约记录' })
  : { navigationBarTitleText: '预约记录' }
