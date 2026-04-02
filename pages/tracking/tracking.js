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
  },

  onUnload() {
    this.stopTracking();
  },

  goBack() { wx.navigateBack(); },

  // 开始位置追踪
  startTracking() {
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
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
        Toast({ context: this, selector: '#t-toast', message: '位置追踪已开启', theme: 'success' });
      },
      fail: () => {
        Toast({ context: this, selector: '#t-toast', message: '需要授权位置权限才能使用此功能' });
        wx.openSetting();
      }
    });
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
    if (!this.data.isTracking) {
      Toast({ context: this, selector: '#t-toast', message: '请先开启位置追踪' });
      return;
    }
    this.doCheckIn();
    Toast({ context: this, selector: '#t-toast', message: '手动打卡成功', theme: 'success' });
  },

  goToSignout() {
    this.stopTracking();
    wx.navigateTo({ url: '/pages/signout/signout?visitId=' + this.data.visitId });
  }
});
