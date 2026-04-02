import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    jobId: '',
    password: '',
    isLoading: false,
    showPassword: false
  },

  onLoad() {
    // 检查是否已登录保安端
    const guardInfo = wx.getStorageSync('guardInfo');
    if (guardInfo && guardInfo.jobId) {
      wx.redirectTo({ url: '/pages/guard-dashboard/guard-dashboard' });
    }
  },

  goBack() { wx.navigateBack(); },

  onJobIdInput(e) { this.setData({ jobId: e.detail.value }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value }); },
  togglePassword() { this.setData({ showPassword: !this.data.showPassword }); },

  handleLogin() {
    const { jobId, password } = this.data;
    if (!jobId.trim()) {
      Toast({ context: this, selector: '#t-toast', message: '请输入工号' }); return;
    }
    if (!password) {
      Toast({ context: this, selector: '#t-toast', message: '请输入密码' }); return;
    }

    this.setData({ isLoading: true });
    wx.showLoading({ title: '登录中...', mask: true });

    wx.cloud.callFunction({
      name: 'guardLogin',
      data: { jobId: jobId.trim(), password }
    }).then(res => {
      wx.hideLoading();
      this.setData({ isLoading: false });

      if (res.result.success) {
        wx.setStorageSync('guardInfo', res.result.guardInfo);
        app.globalData.userRole = 'guard';
        Toast({ context: this, selector: '#t-toast', message: '登录成功', theme: 'success' });
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/guard-dashboard/guard-dashboard' });
        }, 800);
      } else {
        Toast({ context: this, selector: '#t-toast', message: res.result.errMsg || '登录失败' });
      }
    }).catch(err => {
      wx.hideLoading();
      this.setData({ isLoading: false });
      console.error('登录异常', err);
      Toast({ context: this, selector: '#t-toast', message: '网络异常，请重试' });
    });
  }
});
