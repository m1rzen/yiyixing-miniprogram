import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    currentCommunity: '加载中...',
    platformPopupVisible: false,
    currentPlatform: {}, 
    
    // ================= 核心字典配置：已替换为永久有效的纯净 HTTPS 链接 =================
    platformConfigs: {
      '美团': {
        title: '美团骑手', roleName: '美团骑手', platformName: '美团平台',
        gradientClass: 'bg-gradient-meituan', 
        textClass: 'text-meituan',            
        btnClass: 'btn-meituan',              
        headerImgUrl: 'https://cloud.tansuozhe.tech/orange/meituan-top.png' 
      },
      '顺丰': {
        title: '顺丰快递', roleName: '顺丰快递员', platformName: '顺丰快递平台',
        gradientClass: 'bg-gradient-shunfeng', 
        textClass: 'text-shunfeng',
        btnClass: 'btn-shunfeng',
        headerImgUrl: 'https://cloud.tansuozhe.tech/orange/shunfeng-top.png' 
      },
      '京东': {
        title: '京东秒送骑手', roleName: '京东秒送骑手', platformName: '京东秒送平台',
        gradientClass: 'bg-gradient-jingdong', 
        textClass: 'text-jingdong',
        btnClass: 'btn-jingdong',
        headerImgUrl: 'https://cloud.tansuozhe.tech/orange/jingdong-top.png' 
      }
    }
  },

  onShow() {
    let community = '越秀·星汇名庭';
    if (app && app.globalData && app.globalData.tempRecord && app.globalData.tempRecord.selectedCommunity) {
      community = app.globalData.tempRecord.selectedCommunity;
    }
    this.setData({ currentCommunity: community });
  },

  goToCommunity() { wx.navigateTo({ url: '/pages/community/community' }); },
  
  // 🌟 优化：支持带参数跳转到登记页，实现平台选项自动回填
  goToRegister(platformName = '') { 
    const url = platformName 
      ? `/pages/register/register?platform=${platformName}` 
      : '/pages/register/register';
    wx.navigateTo({ url }); 
  },
  
  goToProfile() { wx.navigateTo({ url: '/pages/profile/profile' }); },

  handlePlatformAuth(e) {
    const platformKey = e.currentTarget.dataset.platform;
    const config = this.data.platformConfigs[platformKey];
    if (config) {
      this.setData({
        currentPlatform: config,
        platformPopupVisible: true
      });
    }
  },

  cancelPlatformAuth() {
    this.setData({ platformPopupVisible: false });
    // 点不验证时，带着平台参数跳去登记页
    setTimeout(() => { this.goToRegister(this.data.currentPlatform.title); }, 300);
  },

  // 🌟 核心升级：废弃模拟请求，接入真实的云函数 API
  executeApiVerification() {
    const platformName = this.data.currentPlatform.title;
    this.setData({ platformPopupVisible: false });
    wx.showLoading({ title: '安全连接商业API中...', mask: true });

    // 尝试获取本地缓存的身份信息，用于快捷核验
    const userInfo = wx.getStorageSync('userInfo') || {};
    const phone = wx.getStorageSync('loginPhone') || userInfo.phone || '';

    wx.cloud.callFunction({
      name: 'registerUser',
      data: {
        name: userInfo.name || '快捷核验访客',
        phone: phone,
        idCard: userInfo.idCard || '',
        platform: platformName,
        community: this.data.currentCommunity,
        reason: '平台快捷配送'
      }
    }).then((res) => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.setStorageSync('hasValidPass', true);
        wx.setStorageSync('passReason', platformName);

        Toast({ context: this, selector: '#t-toast', message: 'API核验比对成功，准许放行！', theme: 'success' });
        setTimeout(() => { wx.navigateTo({ url: '/pages/status/status' }); }, 1500);
      } else {
        Toast({ context: this, selector: '#t-toast', message: '未查到当前订单，请手动登记审核' });
        setTimeout(() => { this.goToRegister(platformName); }, 1500);
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('云端商业API连接异常', err);
      Toast({ context: this, selector: '#t-toast', message: 'API网络超时，请手动登记' });
      setTimeout(() => { this.goToRegister(platformName); }, 1500);
    });
  },

  handleDeleteInfo() {
    wx.showModal({
      title: '操作确认',
      content: '是否确认删除所有身份验证与通行记录？删除后不可恢复。',
      confirmColor: '#E34D59',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('hasValidPass');
          wx.removeStorageSync('passReason');
          Toast({ context: this, selector: '#t-toast', message: '信息已清除', theme: 'success' });
          setTimeout(() => { wx.reLaunch({ url: '/pages/welcome/welcome' }); }, 1000);
        }
      }
    });
  },

  handleLogout() {
    wx.showModal({
      title: '退出确认',
      content: '确定要退出当前账号并返回首页吗？',
      confirmColor: '#3F8DB4',
      cancelColor: '#666666',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('hasValidPass');
          wx.removeStorageSync('passReason');
          if (app && app.globalData && app.globalData.tempRecord) {
            app.globalData.tempRecord = { selectedCommunity: '', reason: '' };
          }
          wx.reLaunch({ url: '/pages/welcome/welcome' });
        }
      }
    });
  }
});