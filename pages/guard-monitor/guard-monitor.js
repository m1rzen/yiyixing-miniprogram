import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    visitId: '',
    visit: null,
    locations: [],
    totalLocations: 0,
    isLoading: true,
    refreshTimer: null,
    lastRefreshTime: ''
  },

  onLoad(options) {
    if (options.visitId) {
      this.setData({ visitId: options.visitId });
      this.loadData(options.visitId);
    }
  },

  onShow() {
    // 先清旧定时器再创新的，防止多次 onShow 导致定时器叠加
    this.clearRefresh();
    if (this.data.visitId) {
      this.data.refreshTimer = setInterval(() => {
        this.loadData(this.data.visitId);
      }, 20000);
    }
  },

  onHide() { this.clearRefresh(); },
  onUnload() { this.clearRefresh(); },

  clearRefresh() {
    if (this.data.refreshTimer) {
      clearInterval(this.data.refreshTimer);
      this.data.refreshTimer = null;
    }
  },

  goBack() { wx.navigateBack(); },

  loadData(visitId) {
    app.callCloud({
      name: 'getLocationHistory',
      data: { visitId, page: 1, pageSize: 100 }
    }).then(res => {
      this.setData({ isLoading: false });
      if (res.result.success) {
        this.setData({
          visit: res.result.visit,
          locations: res.result.locations || [],
          totalLocations: res.result.total || 0,
          lastRefreshTime: app.formatTime(new Date())
        });
      }
    }).catch(err => {
      this.setData({ isLoading: false });
      console.error('加载位置数据失败', err);
    });
  },

  handleRefresh() {
    this.loadData(this.data.visitId);
    Toast({ context: this, selector: '#t-toast', message: '已刷新', theme: 'success' });
  },

  formatTimestamp(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return app.formatTime(d);
  }
});
