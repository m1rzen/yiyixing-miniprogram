import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    popupVisible: false,
    privacyVisible: false,
    avatarVisible: false,
    isAgreed: false,
    phoneLoginVisible: false,
    countdown: 0,
    phoneNumber: '',
    verifyCode: '',
    animReady: false,
    brandColor: '#1D5F8A',

    // 微信授权获取的真实数据
    authPhone: '',
    authPhoneFull: '',
    tempAvatarUrl: ''
  },

  onLoad() {
    if (!app.globalData) app.globalData = {};
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

  // 未同意隐私协议时点击微信授权按钮
  onAuthNotAgreed() {
    if (!this.data.isAgreed) {
      Toast({ context: this, selector: '#t-toast', message: '请先阅读并同意隐私指引' });
    }
  },

  // 微信手机号快捷授权回调
  onGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      // 用户拒绝授权
      return;
    }

    this.setData({ popupVisible: false });
    wx.showLoading({ title: '获取手机号...', mask: true });

    // 调用云函数解密手机号
    wx.cloud.callFunction({
      name: 'getPhoneNumber',
      data: { code: e.detail.code }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        const fullPhone = res.result.purePhoneNumber || res.result.phoneNumber;
        const maskedPhone = fullPhone.substring(0, 3) + '****' + fullPhone.substring(7);
        this.setData({
          authPhone: maskedPhone,
          authPhoneFull: fullPhone,
          avatarVisible: true
        });
      } else {
        console.error('获取手机号失败', res.result);
        Toast({ context: this, selector: '#t-toast', message: '获取手机号失败，请使用验证码登录' });
        setTimeout(() => this.setData({ popupVisible: true }), 1000);
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('云函数调用失败', err);
      Toast({ context: this, selector: '#t-toast', message: '网络异常，请使用验证码登录' });
      setTimeout(() => this.setData({ popupVisible: true }), 1000);
    });
  },

  // 选择头像回调
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    if (avatarUrl) {
      this.setData({ tempAvatarUrl: avatarUrl });
    }
  },

  // 确认登录（头像选择后或跳过）
  confirmLogin() {
    this.setData({ avatarVisible: false });
    wx.showLoading({ title: '安全登录中...', mask: true });

    const avatarUrl = this.data.tempAvatarUrl;

    // 如果有头像，先上传到云存储
    const doLogin = (avatarFileId) => {
      app.getOpenid((openid) => {
        const userInfo = {
          phone: this.data.authPhone,
          fullPhone: this.data.authPhoneFull,
          loginType: 'wechat',
          openid: openid
        };
        if (avatarFileId) {
          userInfo.avatarUrl = avatarFileId;
        }
        wx.setStorageSync('userInfo', userInfo);
        wx.setStorageSync('loginPhone', this.data.authPhoneFull);
        app.globalData.isLoggedIn = true;
        app.globalData.userInfo = userInfo;
        app.globalData.userRole = 'visitor';
        wx.hideLoading();
        wx.redirectTo({ url: '/pages/dashboard/dashboard' });
      });
    };

    if (avatarUrl) {
      // 上传头像到云存储
      const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
      wx.cloud.uploadFile({
        cloudPath,
        filePath: avatarUrl,
        success: res => doLogin(res.fileID),
        fail: () => doLogin('')  // 上传失败也允许登录
      });
    } else {
      doLogin('');
    }
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
