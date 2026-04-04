import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    visitId: '',
    visit: null,
    isLoading: true,
    isProcessing: false,
    rejectReason: '',
    rejectPopupVisible: false,
    // 访客身份认证信息
    userIdentityVerified: false,
    userVerifiedBy: '',
    userVerifiedCommunity: '',
    userTotalVisits: 0
  },

  onLoad(options) {
    if (options.visitId) {
      this.setData({ visitId: options.visitId });
      this.loadVisitDetail(options.visitId);
    }
  },

  goBack() { wx.navigateBack(); },

  loadVisitDetail(visitId) {
    this.setData({ isLoading: true });
    wx.cloud.callFunction({
      name: 'getVisitStatus',
      data: { visitId }
    }).then(res => {
      this.setData({ isLoading: false });
      if (res.result.success && res.result.visit) {
        this.setData({ visit: res.result.visit });
        // 设置身份认证信息
        if (res.result.identityInfo) {
          this.setData({
            userIdentityVerified: res.result.identityInfo.identityVerified || false,
            userVerifiedBy: res.result.identityInfo.verifiedBy || '',
            userVerifiedCommunity: res.result.identityInfo.verifiedCommunity || '',
            userTotalVisits: res.result.identityInfo.totalVisits || 0
          });
        }
      } else {
        Toast({ context: this, selector: '#t-toast', message: '加载失败' });
      }
    }).catch(err => {
      this.setData({ isLoading: false });
      console.error('加载详情失败', err);
      Toast({ context: this, selector: '#t-toast', message: '网络异常' });
    });
  },

  handleApprove() {
    wx.showModal({
      title: '确认批准',
      content: `确定批准 ${this.data.visit.visitorName} 的入区申请？`,
      confirmColor: '#2D8B6F',
      confirmText: '批准',
      success: (res) => {
        if (res.confirm) this.executeAction('approve');
      }
    });
  },

  handleReject() {
    this.setData({ rejectPopupVisible: true, rejectReason: '' });
  },

  onRejectReasonInput(e) {
    this.setData({ rejectReason: e.detail.value });
  },

  onRejectPopupChange(e) {
    this.setData({ rejectPopupVisible: e.detail.visible });
  },

  confirmReject() {
    if (!this.data.rejectReason.trim()) {
      Toast({ context: this, selector: '#t-toast', message: '请填写驳回原因' });
      return;
    }
    this.setData({ rejectPopupVisible: false });
    this.executeAction('reject');
  },

  executeAction(action) {
    this.setData({ isProcessing: true });
    const actionText = action === 'approve' ? '批准' : '驳回';
    wx.showLoading({ title: `${actionText}中...`, mask: true });

    const guardInfo = wx.getStorageSync('guardInfo') || {};
    wx.cloud.callFunction({
      name: 'approveVisit',
      data: {
        visitId: this.data.visitId,
        action: action,
        rejectReason: this.data.rejectReason || '',
        jobId: guardInfo.jobId || ''
      }
    }).then(res => {
      wx.hideLoading();
      this.setData({ isProcessing: false });

      if (res.result.success) {
        Toast({ context: this, selector: '#t-toast', message: `已${actionText}`, theme: 'success' });
        this.loadVisitDetail(this.data.visitId);
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        Toast({ context: this, selector: '#t-toast', message: res.result.errMsg || `${actionText}失败` });
      }
    }).catch(err => {
      wx.hideLoading();
      this.setData({ isProcessing: false });
      console.error('审批操作失败', err);
      Toast({ context: this, selector: '#t-toast', message: '网络异常，请重试' });
    });
  },

  previewPhoto() {
    if (this.data.visit && this.data.visit.photoFileId) {
      wx.previewImage({
        urls: [this.data.visit.photoFileId],
        current: this.data.visit.photoFileId
      });
    }
  }
});
