import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    hasValidPass: false
  },

  onShow() {
    // 每次打开个人中心，动态检查手机本地是否有通行记录
    const hasRecord = wx.getStorageSync('hasValidPass');
    this.setData({ hasValidPass: !!hasRecord });
  },

  goBack() {
    wx.navigateBack();
  },

  // 捷径：查看我的通行证
  goToStatus() {
    if (this.data.hasValidPass) {
      wx.navigateTo({ url: '/pages/status/status' });
    } else {
      Toast({ context: this, selector: '#t-toast', message: '暂无有效通行记录，请先去主页登记' });
    }
  },

  // 清除本地记录
  handleDeleteInfo() {
    wx.showModal({
      title: '操作确认',
      content: '是否确认清除本地所有通行记录？清除后需要重新登记。',
      confirmColor: '#E34D59',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('hasValidPass');
          wx.removeStorageSync('passReason');
          this.setData({ hasValidPass: false });
          Toast({ context: this, selector: '#t-toast', message: '记录已清除', theme: 'success' });
        }
      }
    });
  },

  // 退出账号并返回首页
  handleLogout() {
    wx.showModal({
      title: '退出确认',
      content: '确定要退出当前账号并返回首页吗？',
      confirmColor: '#3F8DB4',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('hasValidPass');
          wx.removeStorageSync('passReason');
          wx.reLaunch({ url: '/pages/welcome/welcome' });
        }
      }
    });
  }
});