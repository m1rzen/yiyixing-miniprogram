import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    visitId: '',
    visit: null,
    status: 'loading', // loading | pending | approved | rejected | completed | error
    isRefreshing: false,
    currentTime: '',
    pollingTimer: null
  },

  onLoad(options) {
    this.setData({ currentTime: app.formatTime(new Date()) });

    if (options.visitId) {
      this.setData({ visitId: options.visitId });
      this.loadVisitStatus(options.visitId);
    } else {
      const activeVisit = wx.getStorageSync('activeVisit');
      if (activeVisit && activeVisit.visitId) {
        this.setData({ visitId: activeVisit.visitId });
        this.loadVisitStatus(activeVisit.visitId);
      } else {
        this.setData({ status: 'error' });
      }
    }
  },

  onShow() {
    if (this.data.status === 'pending') {
      this.startPolling();
    }
  },

  onHide() { this.stopPolling(); },
  onUnload() { this.stopPolling(); },

  loadVisitStatus(visitId) {
    this.setData({ status: 'loading' });
    wx.cloud.callFunction({
      name: 'getVisitStatus',
      data: { visitId }
    }).then(res => {
      if (res.result && res.result.success && res.result.visit) {
        const visit = res.result.visit;
        this.setData({
          visit,
          status: visit.status
        });
        wx.setStorageSync('activeVisit', { visitId: visit._id, status: visit.status });
        if (visit.status === 'pending') this.startPolling();
        else this.stopPolling();
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
      if (!this.data.visitId || this.data.status !== 'pending') {
        this.stopPolling();
        return;
      }
      wx.cloud.callFunction({
        name: 'getVisitStatus',
        data: { visitId: this.data.visitId }
      }).then(res => {
        if (res.result && res.result.success && res.result.visit) {
          const visit = res.result.visit;
          if (visit.status !== 'pending') {
            this.stopPolling();
            this.setData({ visit, status: visit.status });
            wx.setStorageSync('activeVisit', { visitId: visit._id, status: visit.status });
            if (visit.status === 'approved') {
              Toast({ context: this, selector: '#t-toast', message: '审核已通过，准予通行！', theme: 'success' });
            } else if (visit.status === 'rejected') {
              Toast({ context: this, selector: '#t-toast', message: '申请未通过，请查看驳回原因' });
            }
          }
        }
      }).catch(err => console.error('轮询失败', err));
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

  handleRetry() {
    const visitId = this.data.visitId;
    if (visitId) {
      this.loadVisitStatus(visitId);
    } else {
      const activeVisit = wx.getStorageSync('activeVisit');
      if (activeVisit && activeVisit.visitId) {
        this.setData({ visitId: activeVisit.visitId });
        this.loadVisitStatus(activeVisit.visitId);
      } else {
        wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/dashboard/dashboard' }) });
      }
    }
  },

  handleReapply() {
    wx.navigateTo({ url: '/pages/register/register' });
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
