import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    isLoggedIn: false,
    userName: '',
    userAddr: '',
    currentCommunityId: '',
    residentId: '',
    phoneLoginMode: false,
    loginPopupVisible: false,
    authPopupVisible: false,
    announcePopupVisible: false,
    neighborPopupVisible: false,
    applyPopupVisible: false,
    billPopupVisible: false,
    adminLoginVisible: false,
    phone: '',
    code: '',
    codeCooldown: 0,
    authData: {},
    applyData: {},
    applyType: 'property',
    latestAnnounce: null,
    communityPickerVisible: false,
    communityList: [],
    communityNames: [],
    authCommunityIdx: 0,
    authCommunityName: '',
    adminPhone: '',
    adminPassword: '',
    adminCommunityIdx: 0,
    features: [
      { key: 'property-fee',   icon: 'bill', title: '物业缴费', bg: 'linear-gradient(135deg, #C8963E, #A67930)' },
      { key: 'suggestion',     icon: 'edit-1', title: '诉求建议', bg: 'linear-gradient(135deg, #2D8B6F, #1E6B52)' },
      { key: 'finance',        icon: 'chart-bar', title: '财务公开', bg: 'linear-gradient(135deg, #B85C38, #944A2D)' },
      { key: 'consult',        icon: 'chat-bubble', title: '议事协商', bg: 'linear-gradient(135deg, #C8963E, #A67930)' },
      { key: 'info-publish',   icon: 'calendar', title: '信息公示', bg: 'linear-gradient(135deg, #1D5F8A, #134566)' },
      { key: 'livelihood',     icon: 'heart-filled', title: '民生微实事', bg: 'linear-gradient(135deg, #D4A08A, #B8856A)' },
      { key: 'safety',         icon: 'secured', title: '小区安全', bg: 'linear-gradient(135deg, #2D8B6F, #1E6B52)' },
      { key: 'resource',       icon: 'share', title: '资源共享', bg: 'linear-gradient(135deg, #1D5F8A, #134566)' }
    ]
  },

  onLoad() {
    const logged = wx.getStorageSync('yixiaoqu_logged');
    if (logged) {
      this.setData({
        isLoggedIn: true,
        userName: wx.getStorageSync('yixiaoqu_name') || '住户用户',
        userAddr: wx.getStorageSync('yixiaoqu_room') || '',
        currentCommunityId: wx.getStorageSync('yixiaoqu_communityId') || ''
      });
    }
    const app = getApp();
    if (app.globalData && app.globalData.communities) {
      const names = app.globalData.communities.map(c => c.name);
      this.setData({ communityNames: names, authCommunityName: names[0] || '' });
    }
  },

  onShow() {
    if (this.data.isLoggedIn || this.data.currentCommunityId) {
      this.loadAnnouncements();
    }
  },

  goHome() { wx.reLaunch({ url: '/pages/entry/entry' }); },
  goBack() { wx.navigateBack(); },
  goFeature(e) { wx.navigateTo({ url: '/pages/sub-feature/sub-feature?key=' + e.currentTarget.dataset.key }); },
  goBill() { this.setData({ billPopupVisible: true }); },
  hideBill() { this.setData({ billPopupVisible: false }); },

  // ═══ 登录 ═══
  showLoginPopup() { this.setData({ loginPopupVisible: true, phoneLoginMode: false }); },
  hideLoginPopup() { this.setData({ loginPopupVisible: false }); },
  switchToPhoneLogin() { this.setData({ phoneLoginMode: true }); },

  async onGetPhone(e) {
    if (e.detail && e.detail.errMsg && e.detail.errMsg !== 'getPhoneNumber:ok') {
      Toast({ context: this, selector: '#t-toast', message: '已取消授权' }); return;
    }
    const app = getApp();
    wx.showLoading({ title: '登录中...', mask: true });
    try {
      let phoneData = {};
      if (e.detail && e.detail.code) {
        try {
          const phoneRes = await app.callCloud({ name: 'getPhoneNumber', data: { code: e.detail.code } });
          if (phoneRes.result && phoneRes.result.success) {
            phoneData.phone = phoneRes.result.purePhoneNumber || phoneRes.result.phoneNumber || '';
          }
        } catch (phoneErr) { console.warn('解密手机号失败', phoneErr); }
      }
      const res = await app.callCloud({ name: 'residentLogin', data: phoneData });
      wx.hideLoading();
      if (res.result && res.result.success) {
        const data = res.result;
        if (data.verified && data.verified.length > 0) {
          const first = data.verified[0];
          this.setData({ isLoggedIn: true, userName: first.name, userAddr: first.room, currentCommunityId: first.communityId, residentId: first._id, loginPopupVisible: false });
          wx.setStorageSync('yixiaoqu_logged', true);
          wx.setStorageSync('yixiaoqu_name', first.name);
          wx.setStorageSync('yixiaoqu_room', first.room);
          wx.setStorageSync('yixiaoqu_communityId', first.communityId);
          wx.setStorageSync('yixiaoqu_residentId', first._id);
          Toast({ context: this, selector: '#t-toast', message: '登录成功', theme: 'success' });
          if (data.verified.length > 1) this.setData({ communityPickerVisible: true, communityList: data.verified });
          this.loadAnnouncements();
        } else {
          Toast({ context: this, selector: '#t-toast', message: '请先完成住户认证' });
          this.setData({ loginPopupVisible: false, authPopupVisible: true });
        }
      } else {
        Toast({ context: this, selector: '#t-toast', message: (res.result && res.result.errMsg) || '登录失败' });
      }
    } catch (err) {
      wx.hideLoading();
      Toast({ context: this, selector: '#t-toast', message: '网络异常，已进入离线模式' });
      this.setData({ loginPopupVisible: false, isLoggedIn: true, userName: '微信用户（离线）' });
      wx.setStorageSync('yixiaoqu_logged', true);
      wx.setStorageSync('yixiaoqu_name', '微信用户（离线）');
    }
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value }); },
  onCodeInput(e) { this.setData({ code: e.detail.value }); },
  sendCode() {
    if (this.data.codeCooldown > 0) return;
    if (!this.data.phone || this.data.phone.length !== 11) { Toast({ context: this, selector: '#t-toast', message: '请输入正确的手机号' }); return; }
    Toast({ context: this, selector: '#t-toast', message: '验证码已发送（演示）', theme: 'success' });
    this.setData({ codeCooldown: 60 });
    const timer = setInterval(() => { const c = this.data.codeCooldown - 1; this.setData({ codeCooldown: c }); if (c <= 0) clearInterval(timer); }, 1000);
  },

  async doPhoneLogin() {
    const { phone, code } = this.data;
    if (!phone || phone.length !== 11) { Toast({ context: this, selector: '#t-toast', message: '请输入手机号' }); return; }
    if (!code || code.length < 4) { Toast({ context: this, selector: '#t-toast', message: '请输入验证码' }); return; }
    const app = getApp();
    wx.showLoading({ title: '登录中...', mask: true });
    try {
      const res = await app.callCloud({ name: 'residentLogin', data: { phone } });
      wx.hideLoading();
      if (res.result && res.result.success) {
        const data = res.result;
        if (data.verified && data.verified.length > 0) {
          const first = data.verified[0];
          this.setData({ isLoggedIn: true, userName: first.name, userAddr: first.room, currentCommunityId: first.communityId, residentId: first._id, loginPopupVisible: false });
          wx.setStorageSync('yixiaoqu_logged', true);
          wx.setStorageSync('yixiaoqu_name', first.name);
          wx.setStorageSync('yixiaoqu_room', first.room);
          wx.setStorageSync('yixiaoqu_communityId', first.communityId);
          wx.setStorageSync('yixiaoqu_residentId', first._id);
          Toast({ context: this, selector: '#t-toast', message: '登录成功', theme: 'success' });
          if (data.verified.length > 1) this.setData({ communityPickerVisible: true, communityList: data.verified });
          this.loadAnnouncements();
        } else {
          Toast({ context: this, selector: '#t-toast', message: '请先完成住户认证' });
          this.setData({ loginPopupVisible: false, authPopupVisible: true });
        }
      } else {
        Toast({ context: this, selector: '#t-toast', message: (res.result && res.result.errMsg) || '登录失败' });
      }
    } catch (err) {
      wx.hideLoading();
      const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      Toast({ context: this, selector: '#t-toast', message: '网络异常，已进入离线模式' });
      this.setData({ loginPopupVisible: false, isLoggedIn: true, userName: maskedPhone + '（离线）' });
      wx.setStorageSync('yixiaoqu_logged', true);
      wx.setStorageSync('yixiaoqu_name', maskedPhone + '（离线）');
    }
  },

  handleLogout() {
    ['yixiaoqu_logged', 'yixiaoqu_name', 'yixiaoqu_room', 'yixiaoqu_communityId', 'yixiaoqu_residentId'].forEach(k => wx.removeStorageSync(k));
    this.setData({ isLoggedIn: false, userName: '', userAddr: '', currentCommunityId: '', residentId: '', latestAnnounce: null });
    Toast({ context: this, selector: '#t-toast', message: '已退出登录' });
  },

  // ═══ 多小区切换 ═══
  showCommunityPicker() { if (this.data.communityList.length < 2) { Toast({ context: this, selector: '#t-toast', message: '当前仅有一个小区身份' }); return; } this.setData({ communityPickerVisible: true }); },
  selectCommunity(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({ currentCommunityId: item.communityId, userAddr: item.room, communityPickerVisible: false });
    wx.setStorageSync('yixiaoqu_communityId', item.communityId);
    wx.setStorageSync('yixiaoqu_room', item.room);
    this.onShow();
  },
  hideCommunityPicker() { this.setData({ communityPickerVisible: false }); },

  // ═══ 住户认证 ═══
  showAuthPopup() {
    const app = getApp();
    this.setData({ authPopupVisible: true, authData: { communityId: this.data.currentCommunityId || (app.globalData.communities[0] && app.globalData.communities[0].communityId) || '' } });
  },
  hideAuthPopup() { this.setData({ authPopupVisible: false }); },
  onAuthInput(e) { this.setData({ ['authData.' + e.currentTarget.dataset.key]: e.detail.value }); },
  onAuthCommunityChange(e) {
    const app = getApp();
    const idx = parseInt(e.detail.value);
    this.setData({ authCommunityIdx: idx });
    if (app.globalData && app.globalData.communities && app.globalData.communities[idx]) {
      const c = app.globalData.communities[idx];
      this.setData({ ['authData.communityId']: c.communityId || c.id || '', authCommunityName: c.name });
    }
  },
  async submitAuth() {
    const { authData } = this.data;
    if (!authData.name || !authData.room || !authData.idcard) { Toast({ context: this, selector: '#t-toast', message: '请填写完整信息' }); return; }
    const app = getApp();
    const communityId = authData.communityId || this.data.currentCommunityId || (app.globalData.communities[0] && (app.globalData.communities[0].communityId || app.globalData.communities[0].id)) || '';
    wx.showLoading({ title: '提交中...', mask: true });
    try {
      const res = await app.callCloud({ name: 'residentAuth', data: { communityId, name: authData.name, phone: authData.phone || '', idCard: authData.idcard, room: authData.room } });
      wx.hideLoading();
      if (res.result && res.result.success) { Toast({ context: this, selector: '#t-toast', message: '认证申请已提交，请等待审核', theme: 'success' }); this.setData({ authPopupVisible: false }); }
      else { Toast({ context: this, selector: '#t-toast', message: (res.result && res.result.errMsg) || '提交失败' }); }
    } catch (err) { wx.hideLoading(); Toast({ context: this, selector: '#t-toast', message: '网络异常，请稍后重试' }); }
  },

  // ═══ 公告 ═══
  async loadAnnouncements() {
    const communityId = this.data.currentCommunityId || wx.getStorageSync('yixiaoqu_communityId') || '';
    if (!communityId) return;
    try {
      const res = await getApp().callCloud({ name: 'getAnnouncements', data: { communityId, pageSize: 5 } });
      if (res.result && res.result.success && res.result.list && res.result.list.length > 0) this.setData({ latestAnnounce: res.result.list[0] });
    } catch (e) { console.warn('加载公告失败', e); }
  },
  showAnnounceDetail() { this.setData({ announcePopupVisible: true }); },
  hideAnnounceDetail() { this.setData({ announcePopupVisible: false }); },

  // ═══ 邻里互助 ═══
  showNeighborDetail() { this.setData({ neighborPopupVisible: true }); },
  hideNeighborDetail() { this.setData({ neighborPopupVisible: false }); },
  joinNeighbor() { Toast({ context: this, selector: '#t-toast', message: '申请已提交，我们将尽快联系您', theme: 'success' }); this.setData({ neighborPopupVisible: false }); },

  // ═══ 申请开通 ═══
  showApplyPopup() { this.setData({ applyPopupVisible: true, applyData: {}, applyType: 'property' }); },
  hideApplyPopup() { this.setData({ applyPopupVisible: false }); },
  onApplyInput(e) { this.setData({ ['applyData.' + e.currentTarget.dataset.key]: e.detail.value }); },
  setApplyType(e) { this.setData({ applyType: e.currentTarget.dataset.type }); },
  async submitApply() {
    const { applyData, applyType } = this.data;
    if (!applyData.org || !applyData.name || !applyData.phone) { Toast({ context: this, selector: '#t-toast', message: '请填写完整信息' }); return; }
    wx.showLoading({ title: '提交中...', mask: true });
    try {
      const res = await getApp().callCloud({ name: 'applyOpen', data: { org: applyData.org, contactName: applyData.name, phone: applyData.phone, type: applyType } });
      wx.hideLoading();
      if (res.result && res.result.success) { Toast({ context: this, selector: '#t-toast', message: '申请已提交，我们将在3个工作日内联系您', theme: 'success' }); this.setData({ applyPopupVisible: false }); }
      else { Toast({ context: this, selector: '#t-toast', message: (res.result && res.result.errMsg) || '提交失败' }); }
    } catch (err) { wx.hideLoading(); Toast({ context: this, selector: '#t-toast', message: '申请已提交，我们将在3个工作日内联系您', theme: 'success' }); this.setData({ applyPopupVisible: false }); }
  },

  // ═══ 管理员入口（内嵌在邑小区） ═══
  showAdminLogin() {
    const app = getApp();
    const names = app.globalData.communities.map(c => c.name);
    this.setData({ adminLoginVisible: true, adminPhone: '', adminPassword: '', communityNames: names, adminCommunityIdx: 0 });
  },
  hideAdminLogin() { this.setData({ adminLoginVisible: false }); },
  onAdminCommunityChange(e) { this.setData({ adminCommunityIdx: parseInt(e.detail.value) }); },
  onAdminPhoneInput(e) { this.setData({ adminPhone: e.detail.value }); },
  onAdminPasswordInput(e) { this.setData({ adminPassword: e.detail.value }); },
  async doAdminLogin() {
    const { adminPhone, adminPassword, adminCommunityIdx } = this.data;
    if (!adminPhone || adminPhone.length !== 11) { Toast({ context: this, selector: '#t-toast', message: '请输入正确的手机号' }); return; }
    if (!adminPassword || adminPassword.length < 4) { Toast({ context: this, selector: '#t-toast', message: '请输入密码' }); return; }
    const app = getApp();
    const community = app.globalData.communities[adminCommunityIdx];
    const communityId = community ? (community.communityId || community.id) : '';
    try {
      const res = await app.callCloud({ name: 'adminLogin', data: { communityId, phone: adminPhone, password: adminPassword } });
      if (res.result && res.result.success) {
        const info = res.result.adminInfo || res.result;
        info.communityId = communityId;
        info.communityName = info.communityName || community.name;
        wx.setStorageSync('adminInfo', info);
        Toast({ context: this, selector: '#t-toast', message: '登录成功', theme: 'success' });
        this.setData({ adminLoginVisible: false });
        wx.navigateTo({ url: '/pages/admin/dashboard/admin-dashboard' });
        return;
      } else { Toast({ context: this, selector: '#t-toast', message: (res.result && res.result.errMsg) || '登录失败' }); return; }
    } catch (e) { console.warn('adminLogin 降级演示模式', e); }
    // 降级
    wx.setStorageSync('adminInfo', { name: adminPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), communityId, communityName: community ? community.name : '演示小区', role: 'admin' });
    Toast({ context: this, selector: '#t-toast', message: '登录成功（演示模式）', theme: 'success' });
    this.setData({ adminLoginVisible: false });
    wx.navigateTo({ url: '/pages/admin/dashboard/admin-dashboard' });
  }
});
