import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    animReady: false,
    aboutPopupVisible: false,
    versionPopupVisible: false
  },

  onLoad() {
    setTimeout(() => this.setData({ animReady: true }), 100);
  },

  goToYiyixing() { wx.navigateTo({ url: '/pages/welcome/welcome' }); },
  goToYixiaoqu() { wx.navigateTo({ url: '/pages/yixiaoqu/yixiaoqu' }); },

  showAbout() { this.setData({ aboutPopupVisible: true }); },
  hideAbout() { this.setData({ aboutPopupVisible: false }); },
  showVersion() { this.setData({ versionPopupVisible: true }); },
  hideVersion() { this.setData({ versionPopupVisible: false }); }
});
