import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    // 基础实名信息
    name: '',
    phone: '',
    idCard: '',
    platform: '非合作方平台',

    // 拜访信息
    currentCommunity: '越秀·星汇名庭', 
    reason: '',
    photoUrl: '', 
    reasonVisible: false,
    
    // 原有事由选项
    reasonOptions: [
      { name: '送外卖', icon: 'shop', color: '#FF9800' },
      { name: '送快递', icon: 'gift', color: '#3F8DB4' },  
      { name: '去住户家', icon: 'home', color: '#4CAF50' },
      { name: '在小区办事', icon: 'city-1', color: '#9C27B0' },
      { name: '中介服务', icon: 'usergroup', color: '#795548' },
      { name: '家政', icon: 'service', color: '#E91E63' },
      { name: '维修', icon: 'setting', color: '#607D8B' },
      { name: '装修', icon: 'edit', color: '#F44336' }     
    ]
  },

  onLoad(options) {
    // 🌟 逻辑1：自动回填欢迎页录入的手机号
    // 假设欢迎页将手机号存入了本地缓存
    const loginPhone = wx.getStorageSync('loginPhone') || '';
    if (loginPhone) {
      this.setData({ phone: loginPhone });
    }

    // 逻辑2：识别来源平台（如美团扫码进入）
    if (options && options.platform) {
      this.setData({ platform: options.platform });
    }
    
    // 初始化地点
    this.updateCommunityFromGlobal();
  },

  // 🌟 逻辑3：无损更新小区信息
  // 当从“选择小区”页面执行 navigateBack 回来时，触发 onShow
  // 此时 data 里的 name, idCard, phone 依然保留，只更新小区名
  onShow() {
    this.updateCommunityFromGlobal();
  },

  updateCommunityFromGlobal() {
    if (app && app.globalData && app.globalData.tempRecord && app.globalData.tempRecord.selectedCommunity) {
      this.setData({ currentCommunity: app.globalData.tempRecord.selectedCommunity });
    }
  },

  // 🌟 逻辑4：修改地点（不销毁当前页，保留已填信息）
  changeCommunity() {
    wx.navigateTo({
      url: '/pages/community/community' 
    });
  },

  goBack() { wx.navigateBack(); },

  // 输入绑定
  onNameChange(e) { this.setData({ name: e.detail.value }); },
  onPhoneChange(e) { this.setData({ phone: e.detail.value }); },
  onIdCardChange(e) { this.setData({ idCard: e.detail.value }); },

  // 事由选择
  openReasonPopup() { this.setData({ reasonVisible: true }); },
  onReasonVisibleChange(e) { this.setData({ reasonVisible: e.detail.visible }); },
  selectReason(e) {
    const selectedName = e.currentTarget.dataset.name;
    this.setData({ reason: selectedName, reasonVisible: false });
  },

  // 提交逻辑：整合云函数实名登记
  handleSubmit() {
    const { name, phone, idCard, reason, platform, currentCommunity } = this.data;

    if (!name || !phone || !idCard || !reason) {
      Toast({ context: this, selector: '#t-toast', message: '请完整填写必填项' });
      return;
    }

    wx.showLoading({ title: '正在提交...', mask: true });

    // 呼叫后端云函数进行真实登记
    wx.cloud.callFunction({
      name: 'registerUser',
      data: {
        name,
        phone,
        idCard,
        platform,
        community: currentCommunity,
        reason
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        // 登记成功，写入本地状态
        wx.setStorageSync('isRegistered', true);
        wx.setStorageSync('hasValidPass', true);
        wx.setStorageSync('passReason', reason);
        
        Toast({ context: this, selector: '#t-toast', message: '登记成功', theme: 'success' });
        setTimeout(() => { wx.navigateTo({ url: '/pages/status/status' }); }, 1500);
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('提交失败', err);
      Toast({ context: this, selector: '#t-toast', message: '系统异常，请重试' });
    });
  }
});