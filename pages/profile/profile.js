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
    app.callCloud({
      name: 'getVisitStatus',
      data: {}
    }).then(res => {
      if (res.result.success && res.result.history) {
        const history = res.result.history.map(item => ({
          ...item,
          createTimeStr: this.formatTime(item.createTime)
        }));
        this.setData({ visitHistory: history });
      }
    }).catch(err => {
      console.error('加载历史记录失败', err);
    });
  },

  formatTime(dateVal) {
    if (!dateVal) return '-';
    let d;
    if (dateVal instanceof Date) {
      d = dateVal;
    } else if (typeof dateVal === 'object' && dateVal.$date) {
      d = new Date(dateVal.$date);
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return String(dateVal);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
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
      confirmColor: '#C94545',
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
      confirmColor: '#1D5F8A',
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
