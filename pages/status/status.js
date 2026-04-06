import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    visitId: '',
    visit: null,
    status: 'loading',
    isRefreshing: false,
    currentTime: '',
    pollingTimer: null,
    passCode: '',
    verifyCode: '',
    verifyCountdown: 30,
    verifyTimer: null
  },

  onLoad(options) {
    this.setData({ currentTime: app.formatTime(new Date()) });

    if (options.visitId) {
      this.setData({ visitId: options.visitId });
      this.generatePassCode(options.visitId);
      this.loadVisitStatus(options.visitId);
    } else {
      const activeVisit = wx.getStorageSync('activeVisit');
      if (activeVisit && activeVisit.visitId) {
        this.setData({ visitId: activeVisit.visitId });
        this.generatePassCode(activeVisit.visitId);
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
    if (this.data.status === 'approved') {
      this.startVerifyCodeTimer();
    }
  },

  onHide() {
    this.stopPolling();
    this.stopVerifyCodeTimer();
  },

  onUnload() {
    this.stopPolling();
    this.stopVerifyCodeTimer();
  },

  // 根据 visitId 生成8位凭证编号
  generatePassCode(visitId) {
    const code = visitId.replace(/[^A-Za-z0-9]/g, '').substr(-8).toUpperCase();
    this.setData({ passCode: code || 'N/A' });
  },

  // 动态验证码：每30秒刷新一次，基于时间戳+visitId生成
  generateVerifyCode() {
    const now = Math.floor(Date.now() / 30000);
    const seed = this.data.visitId + String(now);
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    const code = String(Math.abs(hash) % 1000000).padStart(6, '0');
    this.setData({ verifyCode: code, verifyCountdown: 30 });
  },

  startVerifyCodeTimer() {
    this.stopVerifyCodeTimer();
    this.generateVerifyCode();
    this.data.verifyTimer = setInterval(() => {
      let cd = this.data.verifyCountdown - 1;
      if (cd <= 0) {
        this.generateVerifyCode();
      } else {
        this.setData({ verifyCountdown: cd });
      }
    }, 1000);
  },

  stopVerifyCodeTimer() {
    if (this.data.verifyTimer) {
      clearInterval(this.data.verifyTimer);
      this.data.verifyTimer = null;
    }
  },

  loadVisitStatus(visitId) {
    this.setData({ status: 'loading' });
    app.callCloud({
      name: 'getVisitStatus',
      data: { visitId }
    }).then(res => {
      if (res.result && res.result.success && res.result.visit) {
        const visit = res.result.visit;
        this.setData({ visit, status: visit.status });
        wx.setStorageSync('activeVisit', { visitId: visit._id, status: visit.status });
        if (visit.status === 'pending') {
          this.startPolling();
        } else {
          this.stopPolling();
          if (visit.status === 'approved') {
            this.startVerifyCodeTimer();
          }
        }
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
      app.callCloud({
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
              this.startVerifyCodeTimer();
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
