App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-3gyq6vg87fd58231',
        traceUser: true,
      });
    }
  },

  globalData: {
    userInfo: null,
    openid: '',
    userRole: '', // 'visitor' | 'guard'
    isLoggedIn: false,

    // 江门市蓬江区真实小区数据
    communities: [
      { id: 'c001', name: '越秀·星汇名庭', address: '蓬江区发展大道88号', area: '白沙街道' },
      { id: 'c002', name: '保利大都会', address: '蓬江区迎宾大道中99号', area: '白沙街道' },
      { id: 'c003', name: '帕佳图·观园', address: '蓬江区丰乐路68号', area: '环市街道' },
      { id: 'c004', name: '滨江和院', address: '蓬江区滨江大道18号', area: '北街街道' },
      { id: 'c005', name: '珠江帝景湾', address: '蓬江区胜利路128号', area: '白沙街道' },
      { id: 'c006', name: '凤山水岸', address: '蓬江区建设路56号', area: '环市街道' },
      { id: 'c007', name: '上城铂雍汇', address: '蓬江区东华路22号', area: '白沙街道' },
      { id: 'c008', name: '健威广场·御苑', address: '蓬江区港口路108号', area: '潮连街道' },
      { id: 'c009', name: '五邑碧桂园', address: '蓬江区杜阮镇龙榜路1号', area: '杜阮镇' },
      { id: 'c010', name: '海逸城邦', address: '蓬江区龙湾路88号', area: '棠下镇' },
      { id: 'c011', name: '万达华府', address: '蓬江区万达广场旁', area: '白沙街道' },
      { id: 'c012', name: '天鹅湾', address: '蓬江区白沙大道西68号', area: '白沙街道' },
      { id: 'c013', name: '中海锦城', address: '蓬江区发展大道108号', area: '白沙街道' },
      { id: 'c014', name: '美景花园', address: '蓬江区东华路36号', area: '环市街道' },
      { id: 'c015', name: '恒福花园', address: '蓬江区跃进路12号', area: '北街街道' },
      { id: 'c016', name: '翠林苑', address: '蓬江区翠林路8号', area: '环市街道' },
      { id: 'c017', name: '嘉和苑', address: '蓬江区东华二路15号', area: '白沙街道' },
      { id: 'c018', name: '丽苑花园', address: '蓬江区港口一路66号', area: '潮连街道' },
      { id: 'c019', name: '御景华庭', address: '蓬江区建设二路20号', area: '杜阮镇' },
      { id: 'c020', name: '碧翠花园', address: '蓬江区碧翠路1号', area: '棠下镇' }
    ],

    // 贯穿整个流程的临时记录
    tempRecord: {
      selectedCommunity: '',
      selectedCommunityId: '',
      reason: ''
    },

    // 当前活跃的访问记录
    activeVisit: null
  },

  // 工具方法：获取openid
  getOpenid: function(callback) {
    if (this.globalData.openid) {
      callback && callback(this.globalData.openid);
      return;
    }
    wx.cloud.callFunction({
      name: 'getOpenid'
    }).then(res => {
      this.globalData.openid = res.result.openid;
      callback && callback(res.result.openid);
    }).catch(err => {
      console.error('获取openid失败', err);
      callback && callback('');
    });
  },

  // 工具方法：格式化时间
  formatTime: function(date) {
    if (!date) date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  }
});
