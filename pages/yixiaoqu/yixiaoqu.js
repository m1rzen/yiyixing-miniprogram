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
    phone: '',
    code: '',
    codeCooldown: 0,
    authData: {},
    applyData: {},
    applyType: 'property',
    latestAnnounce: null,
    // 多小区选择
    communityPickerVisible: false,
    communityList: [],
    // 认证表单用的小区列表
    communityNames: [],
    authCommunityIdx: 0,
    authCommunityName: '',
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
        userAddr: wx.getStorageSync('yixiaoqu_room') || '',
        currentCommunityId: wx.getStorageSync('yixiaoqu_communityId') || ''
      });
    }
    // 初始化认证表单小区列表
    const app = getApp();
    if (app.globalData && app.globalData.communities) {
      const names = app.globalData.communities.map(c => c.name);
      this.setData({ communityNames: names, authCommunityName: names[0] || '' });
    }
  },

  onShow() {
    // 每次显示时刷新公告（如果已登录或有 communityId）
    if (this.data.isLoggedIn || this.data.currentCommunityId) {
      this.loadAnnouncements();
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

  // ══════════════════════════════════
  //   登录（云函数对接）
  // ══════════════════════════════════

  showLoginPopup() { this.setData({ loginPopupVisible: true, phoneLoginMode: false }); },
  hideLoginPopup() { this.setData({ loginPopupVisible: false }); },
  switchToPhoneLogin() { this.setData({ phoneLoginMode: true }); },

  // 微信手机号快捷登录 → 调用 residentLogin 云函数
  async onGetPhone(e) {
    // 如果是按钮点击但未授权（e.detail.errMsg !== 'getPhoneNumber:ok'），提示用户
    if (e.detail && e.detail.errMsg && e.detail.errMsg !== 'getPhoneNumber:ok') {
      Toast({ context: this, selector: '#t-toast', message: '已取消授权' });
      return;
    }

    const app = getApp();
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      let phoneData = {};
      // 如果有微信授权码，先解密手机号
      if (e.detail && e.detail.code) {
        try {
          const phoneRes = await app.callCloud({ name: 'getPhoneNumber', data: { code: e.detail.code } });
          if (phoneRes.result && phoneRes.result.success) {
            phoneData.phone = phoneRes.result.purePhoneNumber || phoneRes.result.phoneNumber || '';
          }
        } catch (phoneErr) {
          console.warn('解密手机号失败，继续登录流程', phoneErr);
        }
      }

      const res = await app.callCloud({ name: 'residentLogin', data: phoneData });
      wx.hideLoading();

      if (res.result && res.result.success) {
        const data = res.result;
        if (data.verified && data.verified.length > 0) {
          const first = data.verified[0];
          this.setData({
            isLoggedIn: true,
            userName: first.name,
            userAddr: first.room,
            currentCommunityId: first.communityId,
            residentId: first._id,
            loginPopupVisible: false
          });
          wx.setStorageSync('yixiaoqu_logged', true);
          wx.setStorageSync('yixiaoqu_name', first.name);
          wx.setStorageSync('yixiaoqu_room', first.room);
          wx.setStorageSync('yixiaoqu_communityId', first.communityId);
          wx.setStorageSync('yixiaoqu_residentId', first._id);
          Toast({ context: this, selector: '#t-toast', message: '登录成功', theme: 'success' });

          // 多小区身份时弹出选择
          if (data.verified.length > 1) {
            this.setData({ communityPickerVisible: true, communityList: data.verified });
          }

          // 登录成功后加载公告
          this.loadAnnouncements();
        } else {
          // 无认证身份 → 提示去认证
          Toast({ context: this, selector: '#t-toast', message: '请先完成住户认证' });
          this.setData({ loginPopupVisible: false, authPopupVisible: true });
        }
      } else {
        Toast({ context: this, selector: '#t-toast', message: (res.result && res.result.errMsg) || '登录失败，请重试' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('residentLogin 失败', err);
      // 云函数不可用时降级：允许前端模拟登录
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

  // 手机号验证码登录 → 调用 residentLogin 云函数
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
          this.setData({
            isLoggedIn: true,
            userName: first.name,
            userAddr: first.room,
            currentCommunityId: first.communityId,
            residentId: first._id,
            loginPopupVisible: false
          });
          wx.setStorageSync('yixiaoqu_logged', true);
          wx.setStorageSync('yixiaoqu_name', first.name);
          wx.setStorageSync('yixiaoqu_room', first.room);
          wx.setStorageSync('yixiaoqu_communityId', first.communityId);
          wx.setStorageSync('yixiaoqu_residentId', first._id);
          Toast({ context: this, selector: '#t-toast', message: '登录成功', theme: 'success' });

          if (data.verified.length > 1) {
            this.setData({ communityPickerVisible: true, communityList: data.verified });
          }
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
      console.error('residentLogin 手机号登录失败', err);
      // 降级
      const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      Toast({ context: this, selector: '#t-toast', message: '网络异常，已进入离线模式' });
      this.setData({ loginPopupVisible: false, isLoggedIn: true, userName: maskedPhone + '（离线）' });
      wx.setStorageSync('yixiaoqu_logged', true);
      wx.setStorageSync('yixiaoqu_name', maskedPhone + '（离线）');
    }
  },

  handleLogout() {
    wx.removeStorageSync('yixiaoqu_logged');
    wx.removeStorageSync('yixiaoqu_name');
    wx.removeStorageSync('yixiaoqu_room');
    wx.removeStorageSync('yixiaoqu_communityId');
    wx.removeStorageSync('yixiaoqu_residentId');
    this.setData({
      isLoggedIn: false, userName: '', userAddr: '',
      currentCommunityId: '', residentId: '', latestAnnounce: null
    });
    Toast({ context: this, selector: '#t-toast', message: '已退出登录' });
  },

  // ══════════════════════════════════
  //   多小区选择
  // ══════════════════════════════════

  showCommunityPicker() {
    if (this.data.communityList.length < 2) {
      Toast({ context: this, selector: '#t-toast', message: '当前仅有一个小区身份' });
      return;
    }
    this.setData({ communityPickerVisible: true });
  },

  selectCommunity(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      currentCommunityId: item.communityId,
      userAddr: item.room,
      communityPickerVisible: false
    });
    wx.setStorageSync('yixiaoqu_communityId', item.communityId);
    wx.setStorageSync('yixiaoqu_room', item.room);
    // 刷新页面数据
    this.onShow();
  },

  hideCommunityPicker() { this.setData({ communityPickerVisible: false }); },

  // ══════════════════════════════════
  //   住户认证（云函数对接）
  // ══════════════════════════════════

  showAuthPopup() {
    const app = getApp();
    this.setData({
      authPopupVisible: true,
      authData: { communityId: this.data.currentCommunityId || (app.globalData.communities[0] && app.globalData.communities[0].communityId) || '' }
    });
  },
  hideAuthPopup() { this.setData({ authPopupVisible: false }); },
  onAuthInput(e) { this.setData({ ['authData.' + e.currentTarget.dataset.key]: e.detail.value }); },
  onAuthCommunityChange(e) {
    const app = getApp();
    const idx = parseInt(e.detail.value);
    this.setData({ authCommunityIdx: idx });
    if (app.globalData && app.globalData.communities && app.globalData.communities[idx]) {
      const c = app.globalData.communities[idx];
      this.setData({
        ['authData.communityId']: c.communityId || c.id || '',
        authCommunityName: c.name
      });
    }
  },

  // 提交认证 → 调用 residentAuth 云函数
  async submitAuth() {
    const { authData } = this.data;
    if (!authData.name || !authData.room || !authData.idcard) {
      Toast({ context: this, selector: '#t-toast', message: '请填写完整信息' }); return;
    }

    const app = getApp();
    const communityId = authData.communityId || this.data.currentCommunityId || (app.globalData.communities[0] && (app.globalData.communities[0].communityId || app.globalData.communities[0].id)) || '';

    wx.showLoading({ title: '提交中...', mask: true });
    try {
      const res = await app.callCloud({ name: 'residentAuth', data: {
        communityId,
        name: authData.name,
        phone: authData.phone || '',
        idCard: authData.idcard,
        room: authData.room
      }});
      wx.hideLoading();

      if (res.result && res.result.success) {
        Toast({ context: this, selector: '#t-toast', message: '认证申请已提交，请等待审核', theme: 'success' });
        this.setData({ authPopupVisible: false });
      } else {
        Toast({ context: this, selector: '#t-toast', message: (res.result && res.result.errMsg) || '提交失败' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('residentAuth 失败', err);
      Toast({ context: this, selector: '#t-toast', message: '网络异常，请稍后重试' });
    }
  },

  // ══════════════════════════════════
  //   公告栏（云函数对接）
  // ══════════════════════════════════

  async loadAnnouncements() {
    const app = getApp();
    const communityId = this.data.currentCommunityId || wx.getStorageSync('yixiaoqu_communityId') || '';
    if (!communityId) return;

    try {
      const res = await app.callCloud({ name: 'getAnnouncements', data: { communityId, pageSize: 5 } });
      if (res.result && res.result.success && res.result.list && res.result.list.length > 0) {
        this.setData({ latestAnnounce: res.result.list[0] });
      }
    } catch (e) {
      console.warn('加载公告失败，使用默认数据', e);
    }
  },

  showAnnounceDetail() { this.setData({ announcePopupVisible: true }); },
  hideAnnounceDetail() { this.setData({ announcePopupVisible: false }); },

  // ══════════════════════════════════
  //   邻里互助（保留本地交互）
  // ══════════════════════════════════

  showNeighborDetail() { this.setData({ neighborPopupVisible: true }); },
  hideNeighborDetail() { this.setData({ neighborPopupVisible: false }); },
  joinNeighbor() {
    Toast({ context: this, selector: '#t-toast', message: '申请已提交，我们将尽快联系您', theme: 'success' });
    this.setData({ neighborPopupVisible: false });
  },

  // ══════════════════════════════════
  //   申请开通（云函数对接）
  // ══════════════════════════════════

  showApplyPopup() { this.setData({ applyPopupVisible: true, applyData: {}, applyType: 'property' }); },
  hideApplyPopup() { this.setData({ applyPopupVisible: false }); },
  onApplyInput(e) { this.setData({ ['applyData.' + e.currentTarget.dataset.key]: e.detail.value }); },
  setApplyType(e) { this.setData({ applyType: e.currentTarget.dataset.type }); },

  // 提交申请 → 调用 applyOpen 云函数
  async submitApply() {
    const { applyData, applyType } = this.data;
    if (!applyData.org || !applyData.name || !applyData.phone) {
      Toast({ context: this, selector: '#t-toast', message: '请填写完整信息' }); return;
    }

    const app = getApp();
    wx.showLoading({ title: '提交中...', mask: true });
    try {
      const res = await app.callCloud({ name: 'applyOpen', data: {
        org: applyData.org,
        contactName: applyData.name,
        phone: applyData.phone,
        type: applyType
      }});
      wx.hideLoading();

      if (res.result && res.result.success) {
        Toast({ context: this, selector: '#t-toast', message: '申请已提交，我们将在3个工作日内联系您', theme: 'success' });
        this.setData({ applyPopupVisible: false });
      } else {
        Toast({ context: this, selector: '#t-toast', message: (res.result && res.result.errMsg) || '提交失败' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('applyOpen 失败', err);
      // 降级：仍然提示成功
      Toast({ context: this, selector: '#t-toast', message: '申请已提交，我们将在3个工作日内联系您', theme: 'success' });
      this.setData({ applyPopupVisible: false });
    }
  }
});
