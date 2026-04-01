App({
  // 1. 小程序启动生命周期
  onLaunch: function () {
    // 🌟 核心修复：在这里初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // 这里的 env 填入您的真实云环境 ID
        env: 'cloud1-3gyq6vg87fd58231', 
        traceUser: true, // 记录用户访问记录
      });
    }
  }, // <--- 注意这里，onLaunch 函数在这里正式闭合，并用逗号隔开

  // 2. 纯前端模拟数据中心 (和 onLaunch 平级)
  globalData: {
    // 江门市蓬江区高频演示小区列表
    mockCommunities: [
      { id: '1', name: '越秀·星汇名庭' },
      { id: '2', name: '保利大都会' },
      { id: '3', name: '帕佳图·观园' },
      { id: '4', name: '滨江和院' },
      { id: '5', name: '珠江帝景湾' },
      { id: '6', name: '凤山水岸' },
      { id: '7', name: '上城铂雍汇' },
      { id: '8', name: '健威广场·御苑' }
    ],
    // 贯穿整个流程的用户状态记录
    tempRecord: {
      selectedCommunity: '越秀·星汇名庭', // 默认选中一个
      reason: ''
    }
  }
});