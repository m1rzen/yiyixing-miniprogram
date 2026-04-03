import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    popupVisible: false,
    privacyVisible: false,
    wechatAuthVisible: false,
    isAgreed: false,
    phoneLoginVisible: false,
    countdown: 0,
    phoneNumber: '',
    verifyCode: '',
    animReady: false,
    brandColor: '#1D5F8A'
  },

  onLoad() {
    if (!app.globalData) app.globalData = {};
    // 检查是否已登录
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.phone) {
      app.globalData.isLoggedIn = true;
      app.globalData.userInfo = userInfo;
      wx.redirectTo({ url: '/pages/dashboard/dashboard' });
    }
  },

  onReady() {
    setTimeout(() => this.setData({ animReady: true }), 100);
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },

  handleRegister() { this.setData({ popupVisible: true }); },
  onVisibleChange(e) { this.setData({ popupVisible: e.detail.visible }); },
  onAgreeChange(e) { this.setData({ isAgreed: e.detail.checked }); },
  openPrivacy() { this.setData({ privacyVisible: true }); },
  closePrivacy() { this.setData({ privacyVisible: false, isAgreed: true }); },
  onPrivacyVisibleChange(e) { this.setData({ privacyVisible: e.detail.visible }); },

  // 微信快捷授权
  handleSimulateAuth() {
    if (!this.data.isAgreed) {
      Toast({ context: this, selector: '#t-toast', message: '请先阅读并同意隐私指引' });
      return;
    }
    this.setData({ popupVisible: false });
    setTimeout(() => this.setData({ wechatAuthVisible: true }), 300);
  },

  cancelWechatAuth() { this.setData({ wechatAuthVisible: false }); },

  confirmWechatAuth() {
    this.setData({ wechatAuthVisible: false });
    wx.showLoading({ title: '安全登录中...', mask: true });

    // 获取openid并存储登录状态
    app.getOpenid((openid) => {
      const userInfo = { phone: '198****0468', loginType: 'wechat', openid: openid };
      wx.setStorageSync('userInfo', userInfo);
      app.globalData.isLoggedIn = true;
      app.globalData.userInfo = userInfo;
      app.globalData.userRole = 'visitor';
      wx.hideLoading();
      wx.redirectTo({ url: '/pages/dashboard/dashboard' });
    });
  },

  goToPhoneLogin() {
    if (!this.data.isAgreed) {
      Toast({ context: this, selector: '#t-toast', message: '请先阅读并同意隐私指引' });
      return;
    }
    this.setData({ popupVisible: false, phoneLoginVisible: true });
  },

  onPhoneLoginClose(e) {
    if (e && e.detail) this.setData({ phoneLoginVisible: e.detail.visible });
    else this.setData({ phoneLoginVisible: false });
  },

  onPhoneInput(e) { this.setData({ phoneNumber: e.detail.value }); },
  onCodeInput(e) { this.setData({ verifyCode: e.detail.value }); },

  handleGetCode() {
    if (this.data.countdown > 0) return;
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(this.data.phoneNumber)) {
      Toast({ context: this, selector: '#t-toast', message: '请输入正确的11位手机号码' });
      return;
    }
    Toast({ context: this, selector: '#t-toast', message: '验证码已发送', theme: 'success' });
    this.setData({ countdown: 60 });
    this.timer = setInterval(() => {
      if (this.data.countdown <= 1) {
        clearInterval(this.timer);
        this.setData({ countdown: 0 });
      } else {
        this.setData({ countdown: this.data.countdown - 1 });
      }
    }, 1000);
  },

  handlePhoneSubmit() {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(this.data.phoneNumber)) {
      Toast({ context: this, selector: '#t-toast', message: '请输入正确的11位手机号码' });
      return;
    }
    if (!this.data.verifyCode || this.data.verifyCode.length !== 6) {
      Toast({ context: this, selector: '#t-toast', message: '请输入6位短信验证码' });
      return;
    }
    this.setData({ phoneLoginVisible: false });
    wx.showLoading({ title: '验证并登录中...', mask: true });

    app.getOpenid((openid) => {
      const phone = this.data.phoneNumber;
      const maskedPhone = phone.substring(0, 3) + '****' + phone.substring(7);
      const userInfo = { phone: maskedPhone, fullPhone: phone, loginType: 'phone', openid: openid };
      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('loginPhone', phone);
      app.globalData.isLoggedIn = true;
      app.globalData.userInfo = userInfo;
      app.globalData.userRole = 'visitor';
      wx.hideLoading();
      wx.redirectTo({ url: '/pages/dashboard/dashboard' });
    });
  },

  handleQuickPass() {
    wx.showLoading({ title: '核验本地凭证...', mask: true });
    setTimeout(() => {
      wx.hideLoading();
      const activeVisit = wx.getStorageSync('activeVisit');
      if (activeVisit && activeVisit.visitId) {
        wx.redirectTo({ url: '/pages/status/status?visitId=' + activeVisit.visitId });
      } else {
        Toast({ context: this, selector: '#t-toast', message: '未查到有效通行证，请先登录' });
        setTimeout(() => this.setData({ popupVisible: true }), 1500);
      }
    }, 600);
  },

  goToGuardLogin() {
    wx.navigateTo({ url: '/pages/guard-login/guard-login' });
  }
});
