export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '预约提交' })
  : { navigationBarTitleText: '预约提交' }
