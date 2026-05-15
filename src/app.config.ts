export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/appointments/index',
    'pages/profile/index',
    'pages/service-detail/index',
    'pages/booking/index',
    'pages/booking-success/index',
    'pages/admin/login/index',
    'pages/admin/dashboard/index',
    'pages/admin/services/index',
    'pages/admin/appointments/index',
    'pages/admin/users/index',
    'pages/admin/categories/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '预约服务',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#F97316',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: './assets/tabbar/house.png',
        selectedIconPath: './assets/tabbar/house-active.png',
      },
      {
        pagePath: 'pages/appointments/index',
        text: '预约',
        iconPath: './assets/tabbar/calendar.png',
        selectedIconPath: './assets/tabbar/calendar-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png',
      },
    ],
  },
})
