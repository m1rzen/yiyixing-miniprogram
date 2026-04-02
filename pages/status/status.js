import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    visitId: '',
    visit: null,
    status: 'loading', // loading | pending | approved | rejected | completed
    isRefreshing: false,
    currentTime: '',
    pollingTimer: null
  },

  onLoad(options) {
    if (options.visitId) {
      this.setData({ visitId: options.visitId });
      this.loadVisitStatus(options.visitId);
    } else {
      // 从缓存获取
      const activeVisit = wx.getStorageSync('activeVisit');
      if (activeVisit && activeVisit.visitId) {
        this.setData({ visitId: activeVisit.visitId });
        this.loadVisitStatus(activeVisit.visitId);
      }
    }
    this.setData({ currentTime: app.formatTime(new Date()) });
  },

  onShow() {
    // 开始轮询审核状态（pending时）
    if (this.data.status === 'pending') {
      this.startPolling();
    }
  },

  onHide() { this.stopPolling(); },
  onUnload() { this.stopPolling(); },

  loadVisitStatus(visitId) {
    wx.cloud.callFunction({
      name: 'getVisitStatus',
      data: { visitId: visitId }
    }).then(res => {
      if (res.result.success && res.result.visit) {
        const visit = res.result.visit;
        this.setData({
          visit: visit,
          status: visit.status
        });
        wx.setStorageSync('activeVisit', { visitId: visit._id, status: visit.status });
        if (visit.status === 'pending') this.startPolling();
      } else {
        this.setData({ status: 'error' });
      }
    }).catch(err => {
      console.error('加载状态失败', err);
      this.setData({ status: 'error' });
    });
  },

  startPolling() {
    this.stopPolling();
    this.data.pollingTimer = setInterval(() => {
      if (this.data.visitId) {
        wx.cloud.callFunction({
          name: 'getVisitStatus',
          data: { visitId: this.data.visitId }
        }).then(res => {
          if (res.result.success && res.result.visit) {
            const visit = res.result.visit;
            if (visit.status !== 'pending') {
              this.stopPolling();
              this.setData({ visit, status: visit.status });
              wx.setStorageSync('activeVisit', { visitId: visit._id, status: visit.status });
              if (visit.status === 'approved') {
                Toast({ context: this, selector: '#t-toast', message: '审核已通过，准予通行！', theme: 'success' });
              }
            }
          }
        });
      }
    }, 5000);
  },

  stopPolling() {
    if (this.data.pollingTimer) {
      clearInterval(this.data.pollingTimer);
      this.data.pollingTimer = null;
    }
  },

  handleRefresh() {
    if (this.data.isRefreshing) return;
    this.setData({ isRefreshing: true });
    this.loadVisitStatus(this.data.visitId);
    setTimeout(() => this.setData({ isRefreshing: false }), 1500);
  },

  goToTracking() {
    wx.navigateTo({ url: '/pages/tracking/tracking?visitId=' + this.data.visitId });
  },

  goToSignout() {
    wx.navigateTo({ url: '/pages/signout/signout?visitId=' + this.data.visitId });
  },

  goHome() {
    wx.navigateBack({ delta: 10, fail: () => wx.reLaunch({ url: '/pages/dashboard/dashboard' }) });
  }
});
