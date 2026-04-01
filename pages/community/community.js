const app = getApp();

Page({
  data: {
    allCommunities: [],    
    filteredList: [],      
    selectedCommunity: '', 
    keyword: ''            // 记录搜索词
  },

  onLoad() {
    // 🌟 安全初始化全局变量（防止报 Null 错误）
    if (!app.globalData) app.globalData = {};
    if (!app.globalData.tempRecord) app.globalData.tempRecord = {};

    // 注入江门高保真演示数据
    const list = app.globalData.mockCommunities || [
      { id: '1', name: '越秀·星汇名庭' },
      { id: '2', name: '保利大都会' },
      { id: '3', name: '珠江帝景湾' },
      { id: '4', name: '上城骏园' },
      { id: '5', name: '帕佳图·观园' },
      { id: '6', name: '海逸城邦' },
      { id: '7', name: '天鹅湾' },
      { id: '8', name: '莱茵华庭' },
      { id: '9', name: '五邑碧桂园' }
    ];
    
    if (!app.globalData.mockCommunities) {
      app.globalData.mockCommunities = list;
    }

    // 读取当前选中的小区，如果没有则给默认值
    let current = app.globalData.tempRecord.selectedCommunity || '越秀·星汇名庭';
    
    this.setData({ 
      allCommunities: list, 
      filteredList: list, 
      selectedCommunity: current 
    });
  },

  // 搜索框实时过滤
  onSearch(e) {
    const keyword = e.detail.value.trim();
    this.setData({ keyword }); 
    
    if (!keyword) {
      this.setData({ filteredList: this.data.allCommunities });
      return;
    }
    
    const filtered = this.data.allCommunities.filter(item => 
      item.name.includes(keyword)
    );
    this.setData({ filteredList: filtered });
  },

  // 🌟 核心提交流程：安全写全局 -> 延迟动画 -> 安全返回
  handleSelect(e) {
    const name = e.currentTarget.dataset.name;
    
    // 1. 更新当前页面的选中状态，触发 UI 打勾动画
    this.setData({ selectedCommunity: name });
    
    // 2. 安全地将数据保存到全局变量，供 register 页面 onShow 读取
    if (!app.globalData) app.globalData = {};
    if (!app.globalData.tempRecord) app.globalData.tempRecord = {};
    app.globalData.tempRecord.selectedCommunity = name;
    
    // 3. 延时 300 毫秒，让用户看清反馈，再执行返回上一页
    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          // 极致兜底机制：万一 navigateBack 失败（比如特殊路径进入），强行保留数据跳回
          wx.navigateTo({ url: '/pages/register/register' });
        }
      });
    }, 300);
  }
});