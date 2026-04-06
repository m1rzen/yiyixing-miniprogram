import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    visitId: '',
    isSignedOut: false,
    isLoading: false,
    visit: null,
    signoutTime: ''
  },

  onLoad(options) {
    if (options.visitId) {
      this.setData({ visitId: options.visitId });
      this.loadVisitInfo(options.visitId);
    }
  },

  loadVisitInfo(visitId) {
    app.callCloud({
      name: 'getVisitStatus',
      data: { visitId }
    }).then(res => {
      if (res.result.success && res.result.visit) {
        const visit = res.result.visit;
        if (visit.status === 'completed') {
          this.setData({ isSignedOut: true, visit, signoutTime: app.formatTime(new Date()) });
        } else {
          this.setData({ visit });
        }
      }
    });
  },

  goBack() { wx.navigateBack(); },

  handleSignout() {
    wx.showModal({
      title: '确认签退',
      content: '签退后位置追踪将停止，本次通行凭证将失效。确定要签退吗？',
      confirmColor: '#C94545',
      confirmText: '确认签退',
      success: (res) => {
        if (res.confirm) {
          this.executeSignout();
        }
      }
    });
  },

  executeSignout() {
    this.setData({ isLoading: true });
    wx.showLoading({ title: '签退中...', mask: true });

    app.callCloud({
      name: 'signOut',
      data: { visitId: this.data.visitId }
    }).then(res => {
      wx.hideLoading();
      this.setData({ isLoading: false });

      if (res.result.success) {
        this.setData({
          isSignedOut: true,
          signoutTime: app.formatTime(new Date())
        });
        wx.removeStorageSync('activeVisit');
        Toast({ context: this, selector: '#t-toast', message: '签退成功，感谢配合', theme: 'success' });
      } else {
        Toast({ context: this, selector: '#t-toast', message: res.result.errMsg || '签退失败' });
      }
    }).catch(err => {
      wx.hideLoading();
      this.setData({ isLoading: false });
      console.error('签退异常', err);
      Toast({ context: this, selector: '#t-toast', message: '网络异常，请重试' });
    });
  },

  goHome() {
    wx.reLaunch({ url: '/pages/dashboard/dashboard' });
  }
});
