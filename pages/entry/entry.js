Page({
  data: {
    animReady: false
  },

  onLoad() {
    // 入场动画延迟触发
    setTimeout(() => this.setData({ animReady: true }), 100);
  },

  goToYiyixing() {
    wx.navigateTo({ url: '/pages/welcome/welcome' });
  },

  goToYixiaoqu() {
    wx.navigateTo({ url: '/pages/yixiaoqu/yixiaoqu' });
  }
});
