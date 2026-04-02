import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    userInfo: null,
    hasActiveVisit: false,
    visitHistory: []
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo');
    const activeVisit = wx.getStorageSync('activeVisit');
    this.setData({
      userInfo: userInfo || {},
      hasActiveVisit: !!(activeVisit && activeVisit.visitId)
    });
    this.loadHistory();
  },

  loadHistory() {
    wx.cloud.callFunction({
      name: 'getVisitStatus',
      data: {}
    }).then(res => {
      if (res.result.success && res.result.history) {
        this.setData({ visitHistory: res.result.history });
      }
    });
  },

  goBack() { wx.navigateBack(); },

  goToStatus() {
    const activeVisit = wx.getStorageSync('activeVisit');
    if (activeVisit && activeVisit.visitId) {
      wx.navigateTo({ url: '/pages/status/status?visitId=' + activeVisit.visitId });
    } else {
      Toast({ context: this, selector: '#t-toast', message: '暂无有效通行记录' });
    }
  },

  handleClearData() {
    wx.showModal({
      title: '确认清除',
      content: '清除后所有本地登录信息和通行记录都将被删除，需要重新登记。',
      confirmColor: '#E34D59',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          app.globalData.isLoggedIn = false;
          app.globalData.userInfo = null;
          app.globalData.activeVisit = null;
          Toast({ context: this, selector: '#t-toast', message: '数据已清除', theme: 'success' });
          setTimeout(() => wx.reLaunch({ url: '/pages/welcome/welcome' }), 1000);
        }
      }
    });
  },

  handleLogout() {
    wx.showModal({
      title: '退出确认',
      content: '确定退出当前账号？',
      confirmColor: '#2B6CB0',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          app.globalData.isLoggedIn = false;
          app.globalData.userInfo = null;
          app.globalData.tempRecord = { selectedCommunity: '', selectedCommunityId: '', reason: '' };
          wx.reLaunch({ url: '/pages/welcome/welcome' });
        }
      }
    });
  }
});
