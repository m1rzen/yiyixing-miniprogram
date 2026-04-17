Page({
  data: {
    animReady: false,
    features: [
      { icon: 'sound', title: '社区公告', desc: '物业通知即时触达', color: '#C8963E' },
      { icon: 'chat', title: '邻里圈', desc: '邻居互动交流', color: '#2D8B6F' },
      { icon: 'tools', title: '报修服务', desc: '一键提交维修工单', color: '#1D5F8A' },
      { icon: 'calendar', title: '活动中心', desc: '社区精彩活动报名', color: '#B85C38' },
      { icon: 'cart', title: '社区团购', desc: '邻里好物拼团优惠', color: '#7C6B58' },
      { icon: 'call', title: '物业热线', desc: '快速联系管理处', color: '#4A5568' }
    ]
  },

  onLoad() {
    setTimeout(() => this.setData({ animReady: true }), 100);
  },

  goBack() {
    wx.navigateBack();
  }
});
