const app = getApp();

Page({
  data: {
    allCommunities: [],
    filteredList: [],
    selectedCommunity: '',
    keyword: '',
    areaFilter: '全部',
    areas: ['全部']
  },

  onLoad() {
    if (!app.globalData) app.globalData = {};
    if (!app.globalData.tempRecord) app.globalData.tempRecord = {};

    const list = app.globalData.communities || [];
    const areas = ['全部'];
    list.forEach(c => {
      if (c.area && !areas.includes(c.area)) areas.push(c.area);
    });

    const current = app.globalData.tempRecord.selectedCommunity || '';
    this.setData({
      allCommunities: list,
      filteredList: list,
      selectedCommunity: current,
      areas: areas
    });
  },

  onSearch(e) {
    const keyword = (e.detail.value || e.detail || '').trim();
    this.setData({ keyword });
    this.filterList();
  },

  onAreaChange(e) {
    const area = e.currentTarget.dataset.area;
    this.setData({ areaFilter: area });
    this.filterList();
  },

  filterList() {
    const { keyword, areaFilter, allCommunities } = this.data;
    let list = allCommunities;
    if (areaFilter !== '全部') {
      list = list.filter(c => c.area === areaFilter);
    }
    if (keyword) {
      list = list.filter(c =>
        c.name.includes(keyword) || c.address.includes(keyword)
      );
    }
    this.setData({ filteredList: list });
  },

  handleSelect(e) {
    const { name, id } = e.currentTarget.dataset;
    this.setData({ selectedCommunity: name });

    if (!app.globalData.tempRecord) app.globalData.tempRecord = {};
    app.globalData.tempRecord.selectedCommunity = name;
    app.globalData.tempRecord.selectedCommunityId = id;

    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
        fail: () => wx.navigateTo({ url: '/pages/register/register' })
      });
    }, 250);
  }
});
