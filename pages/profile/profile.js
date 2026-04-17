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
    // Always fetch history (getVisitStatus only returns history when no active visit)
    // So we make a separate call that always returns history
    const app = getApp();
    wx.cloud.callFunction({
      name: 'getVisitStatus',
      data: {}
    }).then(res => {
      if (res.result && res.result.success) {
        // If history was returned, use it
        if (res.result.history && res.result.history.length > 0) {
          const history = res.result.history.map(item => ({
            ...item,
            createTimeStr: this.formatTime(item.createTime)
          }));
          this.setData({ visitHistory: history });
        } else if (res.result.visit) {
          // Only active visit, no history — show it as the single record
          const v = res.result.visit;
          this.setData({
            visitHistory: [{
              ...v,
              createTimeStr: this.formatTime(v.createTime)
            }]
          });
        }
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
          app.globalData.openid = '';  // ★ 清空 openid 缓存
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
          app.globalData.openid = '';  // ★ 清空 openid 缓存
          app.globalData.tempRecord = { selectedCommunity: '', selectedCommunityId: '', reason: '' };
          wx.reLaunch({ url: '/pages/welcome/welcome' });
        }
      }
    });
  }
});
