import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    guardInfo: null,
    currentTab: 0,
    pendingList: [],
    activeList: [],
    historyList: [],
    pendingCount: 0,
    activeCount: 0,
    isLoading: false,
    refreshTimer: null
  },

  onLoad() {
    const guardInfo = wx.getStorageSync('guardInfo');
    if (!guardInfo) {
      wx.redirectTo({ url: '/pages/guard-login/guard-login' });
      return;
    }
    this.setData({ guardInfo });
  },

  onShow() {
    this.loadData();
    // 每15秒自动刷新待审批列表
    this.data.refreshTimer = setInterval(() => this.loadData(), 15000);
  },

  onHide() { this.clearRefresh(); },
  onUnload() { this.clearRefresh(); },

  clearRefresh() {
    if (this.data.refreshTimer) {
      clearInterval(this.data.refreshTimer);
      this.data.refreshTimer = null;
    }
  },

  onTabChange(e) {
    this.setData({ currentTab: e.detail.value });
    this.loadData();
  },

  loadData() {
    const tab = this.data.currentTab;
    let status = 'pending';
    if (tab === 1) status = 'active';
    else if (tab === 2) status = 'completed';

    this.setData({ isLoading: true });
    wx.cloud.callFunction({
      name: 'getVisitorList',
      data: { status, page: 1, pageSize: 50 }
    }).then(res => {
      this.setData({ isLoading: false });
      if (res.result.success) {
        if (tab === 0) {
          this.setData({ pendingList: res.result.list, pendingCount: res.result.total });
        } else if (tab === 1) {
          this.setData({ activeList: res.result.list, activeCount: res.result.total });
        } else {
          this.setData({ historyList: res.result.list });
        }
      }
    }).catch(() => this.setData({ isLoading: false }));

    // 同时加载待审批计数
    if (tab !== 0) {
      wx.cloud.callFunction({
        name: 'getVisitorList',
        data: { status: 'pending', page: 1, pageSize: 1 }
      }).then(res => {
        if (res.result.success) this.setData({ pendingCount: res.result.total });
      });
    }
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
    this.loadData();
    Toast({ context: this, selector: '#t-toast', message: '已刷新', theme: 'success' });
  },

  handleLogout() {
    wx.showModal({
      title: '退出确认',
      content: '确定退出保安工作台？',
      confirmColor: '#1D5F8A',
      success: (res) => {
        if (res.confirm) {
          this.clearRefresh();
          wx.removeStorageSync('guardInfo');
          app.globalData.userRole = '';
          wx.reLaunch({ url: '/pages/welcome/welcome' });
        }
      }
    });
  },

  formatTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
});
