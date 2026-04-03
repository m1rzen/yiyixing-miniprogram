import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    name: '',
    phone: '',
    idCard: '',
    platform: '普通访客',
    currentCommunity: '',
    currentCommunityId: '',
    reason: '',
    photoUrl: '',
    photoFileId: '',
    reasonVisible: false,
    isSubmitting: false,

    reasonOptions: [
      { name: '送外卖', icon: 'shop', color: '#FF9800' },
      { name: '送快递', icon: 'gift', color: '#1D5F8A' },
      { name: '去住户家', icon: 'home', color: '#4CAF50' },
      { name: '在小区办事', icon: 'city-1', color: '#9C27B0' },
      { name: '中介服务', icon: 'usergroup', color: '#795548' },
      { name: '家政保洁', icon: 'service', color: '#E91E63' },
      { name: '维修服务', icon: 'setting', color: '#607D8B' },
      { name: '装修施工', icon: 'edit', color: '#F44336' }
    ]
  },

  onLoad(options) {
    const loginPhone = wx.getStorageSync('loginPhone') || '';
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (loginPhone) this.setData({ phone: loginPhone });
    else if (userInfo.fullPhone) this.setData({ phone: userInfo.fullPhone });
    if (userInfo.name) this.setData({ name: userInfo.name });
    if (userInfo.idCard) this.setData({ idCard: userInfo.idCard });

    if (options && options.platform) {
      this.setData({ platform: options.platform });
    }
    this.updateCommunityFromGlobal();
  },

  onShow() { this.updateCommunityFromGlobal(); },

  updateCommunityFromGlobal() {
    if (app.globalData.tempRecord && app.globalData.tempRecord.selectedCommunity) {
      this.setData({
        currentCommunity: app.globalData.tempRecord.selectedCommunity,
        currentCommunityId: app.globalData.tempRecord.selectedCommunityId || ''
      });
    }
  },

  changeCommunity() { wx.navigateTo({ url: '/pages/community/community' }); },
  goBack() { wx.navigateBack(); },

  onNameChange(e) { this.setData({ name: e.detail.value }); },
  onPhoneChange(e) { this.setData({ phone: e.detail.value }); },
  onIdCardChange(e) { this.setData({ idCard: e.detail.value }); },

  openReasonPopup() { this.setData({ reasonVisible: true }); },
  onReasonVisibleChange(e) { this.setData({ reasonVisible: e.detail.visible }); },
  selectReason(e) {
    this.setData({ reason: e.currentTarget.dataset.name, reasonVisible: false });
  },

  // 照片上传
  handleChoosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ photoUrl: tempFilePath });
      }
    });
  },

  removePhoto() { this.setData({ photoUrl: '', photoFileId: '' }); },

  // 上传图片到云存储
  uploadPhoto() {
    return new Promise((resolve, reject) => {
      if (!this.data.photoUrl || this.data.photoUrl.startsWith('cloud://')) {
        resolve(this.data.photoFileId || '');
        return;
      }
      const cloudPath = `visit-photos/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: this.data.photoUrl,
        success: res => resolve(res.fileID),
        fail: err => reject(err)
      });
    });
  },

  async handleSubmit() {
    const { name, phone, idCard, reason, platform, currentCommunity, currentCommunityId } = this.data;

    if (!name.trim()) {
      Toast({ context: this, selector: '#t-toast', message: '请输入真实姓名' }); return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Toast({ context: this, selector: '#t-toast', message: '请输入正确的手机号码' }); return;
    }
    if (!/^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard)) {
      Toast({ context: this, selector: '#t-toast', message: '请输入正确的身份证号码' }); return;
    }
    if (!currentCommunity) {
      Toast({ context: this, selector: '#t-toast', message: '请选择拜访小区' }); return;
    }
    if (!reason) {
      Toast({ context: this, selector: '#t-toast', message: '请选择拜访事由' }); return;
    }

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '正在提交...', mask: true });

    try {
      // 上传照片
      let photoFileId = '';
      if (this.data.photoUrl) {
        photoFileId = await this.uploadPhoto();
      }

      const res = await wx.cloud.callFunction({
        name: 'registerUser',
        data: {
          name: name.trim(),
          phone, idCard, platform,
          community: currentCommunity,
          communityId: currentCommunityId,
          reason,
          photoFileId
        }
      });

      wx.hideLoading();
      this.setData({ isSubmitting: false });

      if (res.result.success) {
        // 存储用户信息
        const userInfo = wx.getStorageSync('userInfo') || {};
        userInfo.name = name.trim();
        userInfo.idCard = idCard;
        userInfo.fullPhone = phone;
        wx.setStorageSync('userInfo', userInfo);
        wx.setStorageSync('activeVisit', { visitId: res.result.visitId, status: res.result.status });

        const msg = res.result.platformVerified ? '平台核验通过，准予通行！' : '登记成功，等待保安审核';
        Toast({ context: this, selector: '#t-toast', message: msg, theme: 'success' });
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/status/status?visitId=' + res.result.visitId });
        }, 1200);
      } else {
        Toast({ context: this, selector: '#t-toast', message: res.result.errMsg || '提交失败' });
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      console.error('提交失败', err);
      Toast({ context: this, selector: '#t-toast', message: '网络异常，请稍后重试' });
    }
  }
});
