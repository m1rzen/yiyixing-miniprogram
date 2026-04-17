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
  async doAdminLogin() {
    const { adminPhone, adminPassword, selectedCommunityIdx } = this.data;
    if (!adminPhone || adminPhone.length !== 11) {
      Toast({ context: this, selector: '#t-toast', message: '请输入正确的手机号' });
      return;
    }
    if (!adminPassword || adminPassword.length < 4) {
      Toast({ context: this, selector: '#t-toast', message: '请输入密码' });
      return;
    }

    const community = app.globalData.communities[selectedCommunityIdx];
    const communityId = community ? (community.communityId || community.id) : '';

    try {
      const res = await app.callCloud({ name: 'adminLogin', data: { communityId, phone: adminPhone, password: adminPassword } });
      if (res.result && res.result.success) {
        const info = res.result.adminInfo || res.result;
        info.communityId = communityId;
        info.communityName = info.communityName || community.name;
        wx.setStorageSync('adminInfo', info);
        Toast({ context: this, selector: '#t-toast', message: '登录成功', theme: 'success' });
        this.setData({ adminLoginPopupVisible: false });
        wx.navigateTo({ url: '/pages/admin/dashboard/admin-dashboard' });
        return;
      } else {
        Toast({ context: this, selector: '#t-toast', message: (res.result && res.result.errMsg) || '登录失败，请检查手机号和密码' });
        return;
      }
    } catch (e) {
      console.warn('adminLogin 云端失败，降级演示模式', e);
    }

    // 降级：演示模式登录
    const adminInfo = {
      name: adminPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      phone: adminPhone,
      communityId: communityId,
      communityName: community ? community.name : '演示小区',
      role: 'admin'
    };
    wx.setStorageSync('adminInfo', adminInfo);
    Toast({ context: this, selector: '#t-toast', message: '登录成功（演示模式）', theme: 'success' });
    this.setData({ adminLoginPopupVisible: false });
    wx.navigateTo({ url: '/pages/admin/dashboard/admin-dashboard' });
  }
});
