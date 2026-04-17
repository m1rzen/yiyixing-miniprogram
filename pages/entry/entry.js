import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    animReady: false,
    adminLoginPopupVisible: false,
    communityNames: [],
    selectedCommunityIdx: 0,
    adminPhone: '',
    adminPassword: ''
  },

  onLoad() {
    setTimeout(() => this.setData({ animReady: true }), 100);
    const names = app.globalData.communities.map(c => c.name);
    this.setData({ communityNames: names });
  },

  goToYiyixing() {
    wx.navigateTo({ url: '/pages/welcome/welcome' });
  },

  goToYixiaoqu() {
    wx.navigateTo({ url: '/pages/yixiaoqu/yixiaoqu' });
  },

  // ── 管理员登录 ──
  showAdminLogin() {
    this.setData({ adminLoginPopupVisible: true, adminPhone: '', adminPassword: '' });
  },
  hideAdminLogin() {
    this.setData({ adminLoginPopupVisible: false });
  },
  onCommunityChange(e) {
    this.setData({ selectedCommunityIdx: parseInt(e.detail.value) });
  },
  onAdminPhoneInput(e) {
    this.setData({ adminPhone: e.detail.value });
  },
  onAdminPasswordInput(e) {
    this.setData({ adminPassword: e.detail.value });
  },
  doAdminLogin() {
    const { adminPhone, adminPassword, selectedCommunityIdx, communityNames } = this.data;
    if (selectedCommunityIdx < 0) {
      Toast({ context: this, selector: '#t-toast', message: '请选择小区' });
      return;
    }
    if (!adminPhone || adminPhone.length !== 11) {
      Toast({ context: this, selector: '#t-toast', message: '请输入正确的手机号' });
      return;
    }
    if (!adminPassword || adminPassword.length < 4) {
      Toast({ context: this, selector: '#t-toast', message: '请输入密码' });
      return;
    }

    const community = app.globalData.communities[selectedCommunityIdx];
    // 演示模式：任何手机号+密码即可登录，role 固定为 admin
    const adminInfo = {
      name: adminPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      phone: adminPhone,
      communityId: community.id,
      communityName: community.name,
      role: 'admin'
    };
    wx.setStorageSync('adminInfo', adminInfo);
    Toast({ context: this, selector: '#t-toast', message: '登录成功', theme: 'success' });
    this.setData({ adminLoginPopupVisible: false });
    wx.navigateTo({ url: '/pages/admin/dashboard/admin-dashboard' });
  }
});
