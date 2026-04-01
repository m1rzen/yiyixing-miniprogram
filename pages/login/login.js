import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    phone: '',
    code: '',
    canSubmit: false,
    isAgreed: false,        // 新增：协议勾选状态
    privacyVisible: false   // 新增：隐私弹窗显示状态
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value }, this.checkForm);
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value }, this.checkForm);
  },

  // 检查是否输入完整，控制按钮变蓝
  checkForm() {
    const { phone, code } = this.data;
    if (phone.length === 11 && code.length > 0) {
      this.setData({ canSubmit: true });
    } else {
      this.setData({ canSubmit: false });
    }
  },

  getCode() {
    if (this.data.phone.length !== 11) {
      Toast({ context: this, selector: '#t-toast', message: '请先输入11位手机号' });
      return;
    }
    Toast({ context: this, selector: '#t-toast', message: '验证码已发送' });
  },

  // --- 新增：协议勾选相关逻辑 ---
  onAgreeChange(e) {
    this.setData({ isAgreed: e.detail.checked });
  },

  openPrivacy() {
    this.setData({ privacyVisible: true });
  },

  closePrivacy() {
    // 关掉弹窗时自动帮用户勾选
    this.setData({ privacyVisible: false, isAgreed: true });
  },

  onPrivacyVisibleChange(e) {
    this.setData({ privacyVisible: e.detail.visible });
  },

  // --- 提交登录时的强校验 ---
  handleSubmit() {
    // 1. 先检查是否输入了账号密码
    if (!this.data.canSubmit) {
      Toast({ context: this, selector: '#t-toast', message: '请完整输入手机号和验证码' });
      return;
    }
    
    // 2. 核心拦截：必须勾选协议
    if (!this.data.isAgreed) {
      Toast({ context: this, selector: '#t-toast', message: '请先阅读并同意隐私保护协议' });
      return;
    }
    
    Toast({ context: this, selector: '#t-toast', message: '登录成功', theme: 'success' });
    setTimeout(() => {
      // 修改这里！
      wx.navigateTo({ url: '/pages/dashboard/dashboard' });
    }, 1000);
  }
});