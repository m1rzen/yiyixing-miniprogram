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
    
    // 🌟 核心新增：存储用户输入
    phoneNumber: '',
    verifyCode: ''
  },

  onLoad() {
    if (!app.globalData) app.globalData = {};
  },

  handleRegister() { this.setData({ popupVisible: true }); },
  onVisibleChange(e) { this.setData({ popupVisible: e.detail.visible }); },
  onAgreeChange(e) { this.setData({ isAgreed: e.detail.checked }); },
  openPrivacy() { this.setData({ privacyVisible: true }); },
  closePrivacy() { this.setData({ privacyVisible: false, isAgreed: true }); },
  onPrivacyVisibleChange(e) { this.setData({ privacyVisible: e.detail.visible }); },

  handleSimulateAuth() {
    if (!this.data.isAgreed) {
      Toast({ context: this, selector: '#t-toast', message: '请先阅读并同意隐私指引' });
      return;
    }
    this.setData({ popupVisible: false });
    setTimeout(() => { this.setData({ wechatAuthVisible: true }); }, 300);
  },

  cancelWechatAuth() { this.setData({ wechatAuthVisible: false }); },
  confirmWechatAuth() {
    this.setData({ wechatAuthVisible: false });
    wx.showLoading({ title: '安全登录中...', mask: true });
    setTimeout(() => {
      wx.hideLoading();
      wx.navigateTo({ url: '/pages/dashboard/dashboard' });
    }, 800);
  },

  goToPhoneLogin() {
    if (!this.data.isAgreed) {
      Toast({ context: this, selector: '#t-toast', message: '请先阅读并同意隐私指引' });
      return;
    }
    this.setData({
      popupVisible: false,
      phoneLoginVisible: true
    });
  },

  onPhoneLoginClose() {
    this.setData({ phoneLoginVisible: false });
  },

  // 🌟 核心修复：记录输入的手机号和验证码
  onPhoneInput(e) {
    this.setData({ phoneNumber: e.detail.value });
  },
  onCodeInput(e) {
    this.setData({ verifyCode: e.detail.value });
  },

  // 🌟 核心修复：严厉的验证码获取校验
  handleGetCode() {
    if (this.data.countdown > 0) return; 
    
    // 手机号正则：必须是1开头的11位纯数字
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

  // 🌟 核心修复：严厉的登录提交校验
  handlePhoneSubmit() {
    const phoneRegex = /^1[3-9]\d{9}$/;
    
    if (!phoneRegex.test(this.data.phoneNumber)) {
      Toast({ context: this, selector: '#t-toast', message: '请输入正确的11位手机号码' });
      return;
    }
    
    // 验证码必须是精确的6位
    if (!this.data.verifyCode || this.data.verifyCode.length !== 6) {
      Toast({ context: this, selector: '#t-toast', message: '请输入6位短信验证码' });
      return;
    }

    this.setData({ phoneLoginVisible: false });
    wx.showLoading({ title: '验证并登录中...', mask: true });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.navigateTo({ url: '/pages/dashboard/dashboard' });
    }, 1000);
  },

  handleQuickPass() {
    wx.showLoading({ title: '核验本地凭证...', mask: true });
    setTimeout(() => {
      wx.hideLoading();
      const hasRecord = wx.getStorageSync('hasValidPass');
      if (hasRecord) {
        Toast({ context: this, selector: '#t-toast', message: '欢迎回来，凭证有效', theme: 'success' });
        setTimeout(() => { wx.navigateTo({ url: '/pages/status/status' }); }, 1000);
      } else {
        Toast({ context: this, selector: '#t-toast', message: '未查到有效通行证，请先授权登录' });
        setTimeout(() => { this.setData({ popupVisible: true }); }, 1500); 
      }
    }, 800);
  }
});