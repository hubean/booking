export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '预约服务' })
  : { navigationBarTitleText: '预约服务' }
