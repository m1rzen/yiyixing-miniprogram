import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    isLoggedIn: false,
    userName: '',
    userAddr: '',
    phoneLoginMode: false,
    loginPopupVisible: false,
    authPopupVisible: false,
    announcePopupVisible: false,
    neighborPopupVisible: false,
    applyPopupVisible: false,
    billPopupVisible: false,
    phone: '',
    code: '',
    codeCooldown: 0,
    authData: {},
    applyData: {},
    applyType: 'property',
    features: [
      { key: 'property-fee',   icon: 'bill', title: '物业缴费', bg: 'linear-gradient(135deg, #C8963E, #A67930)' },
      { key: 'suggestion',     icon: 'edit-1',       title: '诉求建议', bg: 'linear-gradient(135deg, #2D8B6F, #1E6B52)' },
      { key: 'finance',        icon: 'chart-bar',    title: '财务公开', bg: 'linear-gradient(135deg, #B85C38, #944A2D)' },
      { key: 'consult',        icon: 'chat-bubble',  title: '议事协商', bg: 'linear-gradient(135deg, #C8963E, #A67930)' },
      { key: 'info-publish',   icon: 'calendar',     title: '信息公示', bg: 'linear-gradient(135deg, #1D5F8A, #134566)' },
      { key: 'livelihood',     icon: 'heart-filled', title: '民生微实事', bg: 'linear-gradient(135deg, #D4A08A, #B8856A)' },
      { key: 'safety',         icon: 'secured',      title: '小区安全', bg: 'linear-gradient(135deg, #2D8B6F, #1E6B52)' },
      { key: 'resource',       icon: 'share',        title: '资源共享', bg: 'linear-gradient(135deg, #1D5F8A, #134566)' }
    ]
  },

  onLoad() {
    const logged = wx.getStorageSync('yixiaoqu_logged');
    if (logged) {
      this.setData({
        isLoggedIn: true,
        userName: wx.getStorageSync('yixiaoqu_name') || '住户用户',
        userAddr: wx.getStorageSync('yixiaoqu_room') || ''
      });
    }
  },

  // ── 导航 ──
  goHome() { wx.reLaunch({ url: '/pages/entry/entry' }); },
  goBack() { wx.navigateBack(); },

  // ── 跳转子功能页 ──
  goFeature(e) {
    const key = e.currentTarget.dataset.key;
    wx.navigateTo({ url: '/pages/sub-feature/sub-feature?key=' + key });
  },

  // ── 账单 ──
  goBill() { this.setData({ billPopupVisible: true }); },
  hideBill() { this.setData({ billPopupVisible: false }); },

  // ── 登录弹窗 ──
  showLoginPopup() { this.setData({ loginPopupVisible: true, phoneLoginMode: false }); },
  hideLoginPopup() { this.setData({ loginPopupVisible: false }); },
  switchToPhoneLogin() { this.setData({ phoneLoginMode: true }); },
  onGetPhone() {
    Toast({ context: this, selector: '#t-toast', message: '登录成功', theme: 'success' });
    this.setData({ loginPopupVisible: false, isLoggedIn: true, userName: '微信用户' });
    wx.setStorageSync('yixiaoqu_logged', true);
    wx.setStorageSync('yixiaoqu_name', '微信用户');
  },
  onPhoneInput(e) { this.setData({ phone: e.detail.value }); },
  onCodeInput(e) { this.setData({ code: e.detail.value }); },
  sendCode() {
    if (this.data.codeCooldown > 0) return;
    const phone = this.data.phone;
    if (!phone || phone.length !== 11) {
      Toast({ context: this, selector: '#t-toast', message: '请输入正确的手机号' }); return;
    }
    Toast({ context: this, selector: '#t-toast', message: '验证码已发送（演示）', theme: 'success' });
    this.setData({ codeCooldown: 60 });
    const timer = setInterval(() => {
      const c = this.data.codeCooldown - 1;
      this.setData({ codeCooldown: c });
      if (c <= 0) clearInterval(timer);
    }, 1000);
  },
  doPhoneLogin() {
    const { phone, code } = this.data;
    if (!phone || phone.length !== 11) { Toast({ context: this, selector: '#t-toast', message: '请输入手机号' }); return; }
    if (!code || code.length < 4) { Toast({ context: this, selector: '#t-toast', message: '请输入验证码' }); return; }
    Toast({ context: this, selector: '#t-toast', message: '登录成功', theme: 'success' });
    this.setData({ loginPopupVisible: false, isLoggedIn: true, userName: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') });
    wx.setStorageSync('yixiaoqu_logged', true);
    wx.setStorageSync('yixiaoqu_name', this.data.userName);
  },
  handleLogout() {
    wx.removeStorageSync('yixiaoqu_logged');
    wx.removeStorageSync('yixiaoqu_name');
    wx.removeStorageSync('yixiaoqu_room');
    this.setData({ isLoggedIn: false, userName: '', userAddr: '' });
    Toast({ context: this, selector: '#t-toast', message: '已退出登录' });
  },

  // ── 住户认证 ──
  showAuthPopup() { this.setData({ authPopupVisible: true, authData: {} }); },
  hideAuthPopup() { this.setData({ authPopupVisible: false }); },
  onAuthInput(e) { this.setData({ ['authData.' + e.currentTarget.dataset.key]: e.detail.value }); },
  submitAuth() {
    const { authData } = this.data;
    if (!authData.name || !authData.room || !authData.idcard) {
      Toast({ context: this, selector: '#t-toast', message: '请填写完整信息' }); return;
    }
    Toast({ context: this, selector: '#t-toast', message: '认证申请已提交，请等待审核', theme: 'success' });
    this.setData({ authPopupVisible: false });
  },

  // ── 公告详情 ──
  showAnnounceDetail() { this.setData({ announcePopupVisible: true }); },
  hideAnnounceDetail() { this.setData({ announcePopupVisible: false }); },

  // ── 邻里互助 ──
  showNeighborDetail() { this.setData({ neighborPopupVisible: true }); },
  hideNeighborDetail() { this.setData({ neighborPopupVisible: false }); },
  joinNeighbor() {
    Toast({ context: this, selector: '#t-toast', message: '申请已提交，我们将尽快联系您', theme: 'success' });
    this.setData({ neighborPopupVisible: false });
  },

  // ── 申请开通 ──
  showApplyPopup() { this.setData({ applyPopupVisible: true, applyData: {}, applyType: 'property' }); },
  hideApplyPopup() { this.setData({ applyPopupVisible: false }); },
  onApplyInput(e) { this.setData({ ['applyData.' + e.currentTarget.dataset.key]: e.detail.value }); },
  setApplyType(e) { this.setData({ applyType: e.currentTarget.dataset.type }); },
  submitApply() {
    const { applyData, applyType } = this.data;
    if (!applyData.org || !applyData.name || !applyData.phone) {
      Toast({ context: this, selector: '#t-toast', message: '请填写完整信息' }); return;
    }
    Toast({ context: this, selector: '#t-toast', message: '申请已提交，我们将在3个工作日内联系您', theme: 'success' });
    this.setData({ applyPopupVisible: false });
  }
});
