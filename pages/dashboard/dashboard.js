import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    userInfo: null,
    currentCommunity: '',
    currentCommunityId: '',
    hasActiveVisit: false,
    activeVisit: null,
    platformPopupVisible: false,
    currentPlatform: {},
    isLoading: true,

    platformConfigs: {
      '美团': {
        key: '美团', title: '美团骑手', roleName: '美团骑手', platformName: '美团平台',
        gradientClass: 'gradient-meituan', textClass: 'text-meituan', btnClass: 'btn-meituan',
        icon: 'shop', color: '#FF9800'
      },
      '顺丰': {
        key: '顺丰', title: '顺丰快递', roleName: '顺丰快递员', platformName: '顺丰快递平台',
        gradientClass: 'gradient-shunfeng', textClass: 'text-shunfeng', btnClass: 'btn-shunfeng',
        icon: 'gift', color: '#D32F2F'
      },
      '京东': {
        key: '京东', title: '京东秒送', roleName: '京东秒送骑手', platformName: '京东秒送平台',
        gradientClass: 'gradient-jingdong', textClass: 'text-jingdong', btnClass: 'btn-jingdong',
        icon: 'cart', color: '#E53935'
      }
    }
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.redirectTo({ url: '/pages/welcome/welcome' });
      return;
    }
    this.setData({ userInfo });
  },

  onShow() {
    // 更新社区选择
    let community = '请选择小区';
    let communityId = '';
    if (app.globalData.tempRecord && app.globalData.tempRecord.selectedCommunity) {
      community = app.globalData.tempRecord.selectedCommunity;
      communityId = app.globalData.tempRecord.selectedCommunityId || '';
    }
    this.setData({ currentCommunity: community, currentCommunityId: communityId });
    this.checkActiveVisit();
  },

  checkActiveVisit() {
    this.setData({ isLoading: true });
    wx.cloud.callFunction({
      name: 'getVisitStatus',
      data: {}
    }).then(res => {
      if (res.result.success && res.result.hasActiveVisit && res.result.visit) {
        const visit = res.result.visit;
        this.setData({
          hasActiveVisit: true,
          activeVisit: visit,
          isLoading: false
        });
        wx.setStorageSync('activeVisit', { visitId: visit._id, status: visit.status });
      } else {
        this.setData({ hasActiveVisit: false, activeVisit: null, isLoading: false });
        wx.removeStorageSync('activeVisit');
      }
    }).catch(() => {
      this.setData({ isLoading: false });
    });
  },

  goToCommunity() { wx.navigateTo({ url: '/pages/community/community' }); },

  goToRegister() {
    if (!this.data.currentCommunity || this.data.currentCommunity === '请选择小区') {
      Toast({ context: this, selector: '#t-toast', message: '请先选择要拜访的小区' });
      return;
    }
    wx.navigateTo({ url: '/pages/register/register' });
  },

  goToStatus() {
    if (this.data.activeVisit) {
      wx.navigateTo({ url: '/pages/status/status?visitId=' + this.data.activeVisit._id });
    }
  },

  goToTracking() {
    if (this.data.activeVisit) {
      wx.navigateTo({ url: '/pages/tracking/tracking?visitId=' + this.data.activeVisit._id });
    }
  },

  goToSignout() {
    if (this.data.activeVisit) {
      wx.navigateTo({ url: '/pages/signout/signout?visitId=' + this.data.activeVisit._id });
    }
  },

  goToProfile() { wx.navigateTo({ url: '/pages/profile/profile' }); },

  // 平台快捷登入
  handlePlatformAuth(e) {
    if (!this.data.currentCommunity || this.data.currentCommunity === '请选择小区') {
      Toast({ context: this, selector: '#t-toast', message: '请先选择要拜访的小区' });
      return;
    }
    const key = e.currentTarget.dataset.platform;
    const config = this.data.platformConfigs[key];
    if (config) {
      this.setData({ currentPlatform: config, platformPopupVisible: true });
    }
  },

  cancelPlatformAuth() {
    this.setData({ platformPopupVisible: false });
    setTimeout(() => {
      wx.navigateTo({ url: `/pages/register/register?platform=${this.data.currentPlatform.title}` });
    }, 300);
  },

  executePlatformVerify() {
    const platform = this.data.currentPlatform;
    this.setData({ platformPopupVisible: false });
    wx.showLoading({ title: '正在连接' + platform.platformName + '...', mask: true });

    const userInfo = this.data.userInfo || {};
    wx.cloud.callFunction({
      name: 'registerUser',
      data: {
        name: userInfo.name || '快捷核验用户',
        phone: userInfo.fullPhone || wx.getStorageSync('loginPhone') || '',
        idCard: userInfo.idCard || '000000000000000000',
        platform: platform.title,
        community: this.data.currentCommunity,
        communityId: this.data.currentCommunityId,
        reason: platform.title + '配送'
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.setStorageSync('activeVisit', { visitId: res.result.visitId, status: res.result.status });
        if (res.result.platformVerified) {
          Toast({ context: this, selector: '#t-toast', message: platform.platformName + '身份核验通过！', theme: 'success' });
        } else {
          Toast({ context: this, selector: '#t-toast', message: '已提交申请，等待保安审批', theme: 'success' });
        }
        setTimeout(() => {
          wx.navigateTo({ url: '/pages/status/status?visitId=' + res.result.visitId });
        }, 1200);
      } else {
        Toast({ context: this, selector: '#t-toast', message: res.result.errMsg || '核验失败，请手动登记' });
        setTimeout(() => {
          wx.navigateTo({ url: `/pages/register/register?platform=${platform.title}` });
        }, 1500);
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('平台核验异常', err);
      Toast({ context: this, selector: '#t-toast', message: '网络异常，请手动登记' });
      setTimeout(() => {
        wx.navigateTo({ url: `/pages/register/register?platform=${platform.title}` });
      }, 1500);
    });
  },

  handleLogout() {
    wx.showModal({
      title: '退出确认',
      content: '确定要退出当前账号吗？',
      confirmColor: '#2B6CB0',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          app.globalData.isLoggedIn = false;
          app.globalData.userInfo = null;
          app.globalData.activeVisit = null;
          app.globalData.tempRecord = { selectedCommunity: '', selectedCommunityId: '', reason: '' };
          wx.reLaunch({ url: '/pages/welcome/welcome' });
        }
      }
    });
  }
});
