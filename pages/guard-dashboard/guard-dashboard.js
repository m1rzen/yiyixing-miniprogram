import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  _isActive: true, // 页面是否活跃，防止销毁后 setData

  data: {
    guardInfo: null,
    currentTab: 0,
    pendingList: [],
    activeList: [],
    historyList: [],
    pendingCount: 0,
    activeCount: 0,
    historyCount: 0,
    isLoading: false,
    refreshTimer: null,
    lastRefreshTime: ''
  },

  onLoad() {
    this._isActive = true;
    const guardInfo = wx.getStorageSync('guardInfo');
    if (!guardInfo) {
      wx.redirectTo({ url: '/pages/guard-login/guard-login' });
      return;
    }
    this.setData({ guardInfo });
  },

  onShow() {
    this._isActive = true;
    this.loadAllData();
    // 每15秒自动刷新
    if (!this.data.refreshTimer) {
      this.data.refreshTimer = setInterval(() => {
        if (this._isActive) this.loadAllData();
      }, 15000);
    }
  },

  onHide() { this.clearRefresh(); },
  onUnload() {
    this._isActive = false;
    this.clearRefresh();
  },

  clearRefresh() {
    if (this.data.refreshTimer) {
      clearInterval(this.data.refreshTimer);
      this.data.refreshTimer = null;
    }
  },

  onTabChange(e) {
    this.setData({ currentTab: e.detail.value });
  },

  // 同时加载所有状态数据（待审批/在场/历史）
  loadAllData() {
    if (!this._isActive) return;
    this.setData({ isLoading: true });
    const lastRefreshTime = this.formatShortTime(new Date());

    const jobId = this.data.guardInfo ? this.data.guardInfo.jobId : '';

    // 并行请求三个列表（传入 jobId 确保身份可被识别）
    const pendingReq = wx.cloud.callFunction({
      name: 'getVisitorList',
      data: { status: 'pending', page: 1, pageSize: 50, jobId }
    });
    const activeReq = wx.cloud.callFunction({
      name: 'getVisitorList',
      data: { status: 'active', page: 1, pageSize: 50, jobId }
    });
    const historyReq = wx.cloud.callFunction({
      name: 'getVisitorList',
      data: { status: 'history', page: 1, pageSize: 30, jobId }
    });

    Promise.all([pendingReq, activeReq, historyReq])
      .then(([pendingRes, activeRes, historyRes]) => {
        if (!this._isActive) return; // 页面已销毁，不再 setData

        const pendingList = pendingRes.result.success ? pendingRes.result.list : [];
        const activeList = activeRes.result.success ? activeRes.result.list : [];
        const historyList = historyRes.result.success ? historyRes.result.list : [];

        // 格式化时间
        const fmt = (list) => list.map(item => ({
          ...item,
          createTimeStr: this.formatShortTime(item.createTime),
          approveTimeStr: item.approveTime ? this.formatShortTime(item.approveTime) : ''
        }));

        this.setData({
          isLoading: false,
          pendingList: fmt(pendingList),
          activeList: fmt(activeList),
          historyList: fmt(historyList),
          pendingCount: pendingRes.result.success ? pendingRes.result.total : 0,
          activeCount: activeRes.result.success ? activeRes.result.total : 0,
          historyCount: historyRes.result.success ? historyRes.result.total : 0,
          lastRefreshTime
        });
      })
      .catch(err => {
        if (!this._isActive) return;
        this.setData({ isLoading: false });
        console.error('加载数据失败', err);
      });
  },

  goToApproval(e) {
    const visitId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/guard-approval/guard-approval?visitId=' + visitId });
  },

  goToMonitor(e) {
    const visitId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/guard-monitor/guard-monitor?visitId=' + visitId });
  },

  handleRefresh() {
    this.loadAllData();
    Toast({ context: this, selector: '#t-toast', message: '已刷新', theme: 'success' });
  },

  handleLogout() {
    wx.showModal({
      title: '退出确认',
      content: '确定退出保安工作台？',
      confirmColor: '#1D5F8A',
      success: (res) => {
        if (res.confirm) {
          // 先标记页面不活跃，阻止后续 setData
          this._isActive = false;
          this.clearRefresh();
          wx.removeStorageSync('guardInfo');
          app.globalData.userRole = '';
          wx.reLaunch({ url: '/pages/welcome/welcome' });
        }
      }
    });
  },

  formatShortTime(dateVal) {
    if (!dateVal) return '-';
    let d;
    if (dateVal instanceof Date) {
      d = dateVal;
    } else if (typeof dateVal === 'object' && dateVal.$date) {
      d = new Date(dateVal.$date);
    } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
      d = new Date(dateVal);
    } else {
      return '-';
    }
    if (isNaN(d.getTime())) return String(dateVal);
    return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
});
