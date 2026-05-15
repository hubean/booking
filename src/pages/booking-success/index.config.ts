export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '预约成功' })
  : { navigationBarTitleText: '预约成功' }
