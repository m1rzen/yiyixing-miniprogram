import Toast from 'tdesign-miniprogram/toast/index';
const app = getApp();

Page({
  data: {
    visitId: '',
    isTracking: false,
    locationLogs: [],
    currentLocation: null,
    trackingInterval: null,
    checkInCount: 0,
    lastCheckInTime: '',
    trackingDuration: '00:00:00',
    startTime: null,
    durationTimer: null
  },

  onLoad(options) {
    if (options.visitId) {
      this.setData({ visitId: options.visitId });
    }
    // 进入页面自动开启位置追踪（强制）
    this.autoStartTracking();
  },

  onUnload() {
    this.stopTracking();
  },

  goBack() { wx.navigateBack(); },

  // 自动开启追踪，无需用户确认
  autoStartTracking() {
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
        this.beginTracking();
      },
      fail: () => {
        // 权限被拒绝时，引导用户开启
        wx.showModal({
          title: '位置权限必需',
          content: '根据社区安全管理规定，外来人员入场后必须开启位置追踪功能。请在设置中开启位置权限。',
          confirmText: '去设置',
          confirmColor: '#1D5F8A',
          showCancel: false,
          success: () => {
            wx.openSetting({
              success: (settingRes) => {
                if (settingRes.authSetting['scope.userLocation']) {
                  this.beginTracking();
                } else {
                  Toast({ context: this, selector: '#t-toast', message: '未授权位置权限，无法使用' });
                }
              }
            });
          }
        });
      }
    });
  },

  beginTracking() {
    this.setData({ isTracking: true, startTime: Date.now() });
    this.doCheckIn();
    // 每3分钟自动打卡
    const interval = setInterval(() => {
      this.doCheckIn();
    }, 180000);
    this.setData({ trackingInterval: interval });
    // 计时器
    const durationTimer = setInterval(() => {
      this.updateDuration();
    }, 1000);
    this.setData({ durationTimer });
    Toast({ context: this, selector: '#t-toast', message: '位置追踪已自动开启', theme: 'success' });
  },

  stopTracking() {
    if (this.data.trackingInterval) {
      clearInterval(this.data.trackingInterval);
    }
    if (this.data.durationTimer) {
      clearInterval(this.data.durationTimer);
    }
    this.setData({ isTracking: false, trackingInterval: null, durationTimer: null });
  },

  updateDuration() {
    if (!this.data.startTime) return;
    const diff = Math.floor((Date.now() - this.data.startTime) / 1000);
    const h = String(Math.floor(diff / 3600)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    this.setData({ trackingDuration: `${h}:${m}:${s}` });
  },

  // 执行一次位置打卡
  doCheckIn() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const location = {
          latitude: res.latitude,
          longitude: res.longitude,
          accuracy: res.accuracy,
          time: app.formatTime(new Date())
        };

        this.setData({
          currentLocation: location,
          checkInCount: this.data.checkInCount + 1,
          lastCheckInTime: location.time
        });

        // 添加到本地日志列表
        const logs = [location, ...this.data.locationLogs].slice(0, 50);
        this.setData({ locationLogs: logs });

        // 上传到云端
        wx.cloud.callFunction({
          name: 'submitLocation',
          data: {
            visitId: this.data.visitId,
            latitude: res.latitude,
            longitude: res.longitude,
            accuracy: res.accuracy
          }
        }).then(result => {
          if (!result.result.success) {
            console.error('位置上传失败', result.result.errMsg);
          }
        }).catch(err => {
          console.error('位置上传异常', err);
        });
      },
      fail: (err) => {
        console.error('获取位置失败', err);
        Toast({ context: this, selector: '#t-toast', message: '获取位置失败，请检查GPS' });
      }
    });
  },

  // 手动打卡
  manualCheckIn() {
    this.doCheckIn();
    Toast({ context: this, selector: '#t-toast', message: '手动打卡成功', theme: 'success' });
  },

  goToSignout() {
    this.stopTracking();
    wx.navigateTo({ url: '/pages/signout/signout?visitId=' + this.data.visitId });
  }
});
