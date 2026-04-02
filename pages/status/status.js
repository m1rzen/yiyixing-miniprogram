import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    auditStatus: 'reviewing', 
    isRefreshing: false,
    communityName: '越秀·星汇名庭',
    visitReason: '加载中...',
    currentTime: ''
  },

  onLoad() {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    let community = '越秀·星汇名庭';
    if (app && app.globalData && app.globalData.tempRecord && app.globalData.tempRecord.selectedCommunity) {
      community = app.globalData.tempRecord.selectedCommunity;
    }

    // 🌟 核心修复：强制从手机本地缓存读取登记的事由
    let reason = wx.getStorageSync('passReason') || '入园拜访';
    
    this.setData({
      currentTime: timeStr,
      communityName: community,
      visitReason: reason
    });

    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    // 如果是通过 Dashboard 捷径或 Welcome 捷径进来的，直接显示通过状态
    if (prevPage && (prevPage.route.includes('dashboard') || prevPage.route.includes('welcome'))) {
       this.setData({ auditStatus: 'approved' });
    }

    wx.cloud.callFunction({
      name: 'login' // 假设您有基础的获取OpenID云函数
    }).then(res => {
      this.setData({
        visitorToken: res.result.openid // 将OpenID作为核验令牌
      });
    });
    
  },

  handleRefresh() {
    if (this.data.isRefreshing) return;
    this.setData({ isRefreshing: true });
    
    setTimeout(() => {
      this.setData({ isRefreshing: false, auditStatus: 'approved' });
      Toast({ context: this, selector: '#t-toast', message: '审核已通过，生成通行码', theme: 'success' });
    }, 1500);
  },

  goHome() {
    wx.navigateBack({ delta: 10 });
  }
});