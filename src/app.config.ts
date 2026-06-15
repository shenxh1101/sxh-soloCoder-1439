export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/students/index',
    'pages/schedule/index',
    'pages/attendance/index',
    'pages/export/index',
    'pages/studentDetail/index',
    'pages/courseDetail/index',
    'pages/addStudent/index',
    'pages/addCourse/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4F46E5',
    navigationBarTitleText: '培训班管理',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/students/index',
        text: '学生'
      },
      {
        pagePath: 'pages/schedule/index',
        text: '排课'
      },
      {
        pagePath: 'pages/attendance/index',
        text: '点名'
      }
    ]
  }
})
