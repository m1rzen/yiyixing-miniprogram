import Toast from 'tdesign-miniprogram/toast/index';

const app = getApp();

Page({
  data: {
    adminInfo: null,
    communityName: '',
    stats: {
      totalResidents: 0,
      pendingAuth: 0,
      pendingSuggestions: 0,
      monthAnnouncements: 0
    },
    quickActions: [
      { key: 'residents', icon: 'user-checked', label: '住户审核', color: '#C8963E', tab: 0 },
      { key: 'announce', icon: 'notification', label: '发布公告', color: '#1D5F8A', tab: 1 },
      { key: 'suggestion', icon: 'chat-bubble', label: '诉求处理', color: '#2D8B6F', tab: 2 },
      { key: 'activity', icon: 'calendar', label: '活动管理', color: '#B85C38', tab: 3 },
      { key: 'apply', icon: 'shop', label: '开通申请', color: '#5C3D2E', tab: 4 }
    ]
  },

  onLoad() {
    const adminInfo = wx.getStorageSync('adminInfo');
    if (!adminInfo) {
      wx.reLaunch({ url: '/pages/entry/entry' });
      return;
    }
    this.setData({ adminInfo });
  },

  onShow() {
    this.loadDashboardStats();
  },

  async loadDashboardStats() {
    const adminInfo = this.data.adminInfo;
    if (!adminInfo || !adminInfo.communityId) return;

    try {
      const res = await app.callCloud({ name: 'adminDashboard', data: { communityId: adminInfo.communityId } });
      if (res.result && res.result.success) {
        this.setData({ stats: res.result });
      }
    } catch (e) {
      console.warn('adminDashboard 云端加载失败，使用默认数据', e);
    }
  },

  goHome() {
    wx.reLaunch({ url: '/pages/entry/entry' });
  },

  goManage(e) {
    const tab = e.currentTarget.dataset.tab;
    wx.navigateTo({ url: '/pages/admin/manage/admin/manage?tab=' + tab });
  },

  goManageAll() {
    wx.navigateTo({ url: '/pages/admin/manage/admin/manage?tab=0' });
  }
});
