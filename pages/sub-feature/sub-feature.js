import Toast from 'tdesign-miniprogram/toast/index';

const FEATURES = {
  'property-fee': {
    title: '物业缴费', icon: 'money-circle',
    gradient: 'linear-gradient(135deg, #C8963E, #A67930)',
    desc: '在线缴纳物业管理费用',
    items: [
      { label: '物业费', value: '¥0.00', status: '未出账' },
      { label: '水费', value: '¥0.00', status: '未出账' },
      { label: '电费', value: '¥0.00', status: '未出账' },
      { label: '燃气费', value: '¥0.00', status: '未出账' }
    ]
  },
  'suggestion': {
    title: '诉求建议', icon: 'edit-1',
    gradient: 'linear-gradient(135deg, #2D8B6F, #1E6B52)',
    desc: '向物业和社区反映问题、提出建议',
    type: 'form',
    formFields: [
      { key: 'category', label: '诉求类型', type: 'picker', options: ['物业服务', '环境卫生', '设施维修', '安全管理', '噪音扰民', '其他'] },
      { key: 'content', label: '详细描述', type: 'textarea', placeholder: '请描述您的诉求或建议...' },
      { key: 'contact', label: '联系方式', type: 'input', placeholder: '请输入手机号码' }
    ]
  },
  'finance': {
    title: '财务公开', icon: 'chart-bar',
    gradient: 'linear-gradient(135deg, #B85C38, #944A2D)',
    desc: '小区共有资金收支明细',
    items: [
      { label: '本期收入', value: '¥0.00' },
      { label: '本期支出', value: '¥0.00' },
      { label: '累计结余', value: '¥0.00' },
      { label: '账户公示', value: '查看详情 >' }
    ]
  },
  'consult': {
    title: '议事协商', icon: 'chat-bubble',
    gradient: 'linear-gradient(135deg, #C8963E, #A67930)',
    desc: '参与小区公共事务讨论和投票',
    items: [
      { title: '关于小区停车场改造方案', status: '投票中', statusColor: '#C8963E', meta: '截止 2026-04-30' },
      { title: '公共绿化带维护建议征集', status: '征集中', statusColor: '#2D8B6F', meta: '截止 2026-05-15' }
    ]
  },
  'info-publish': {
    title: '信息公示', icon: 'calendar',
    gradient: 'linear-gradient(135deg, #1D5F8A, #134566)',
    desc: '小区管理规约、业委会信息公示',
    items: [
      { title: '小区管理规约（修订版）', tag: '重要', tagColor: '#C94545', meta: '2026-04-01' },
      { title: '业委会成员名单公示', tag: '公示', tagColor: '#5C3D2E', meta: '2026-03-15' },
      { title: '物业服务合同', tag: '合同', tagColor: '#1D5F8A', meta: '2026-01-01' }
    ]
  },
  'livelihood': {
    title: '民生微实事', icon: 'heart-filled',
    gradient: 'linear-gradient(135deg, #D4A08A, #B8856A)',
    desc: '社区民生项目进展跟踪',
    items: [
      { title: '儿童游乐设施更新', progress: 85, status: '进行中' },
      { title: '老年活动中心改造', progress: 40, status: '进行中' },
      { title: '智能门禁系统升级', progress: 100, status: '已完成' }
    ]
  },
  'safety': {
    title: '小区安全', icon: 'secured',
    gradient: 'linear-gradient(135deg, #2D8B6F, #1E6B52)',
    desc: '安全公告、应急通知',
    items: [
      { title: '消防通道定期检查通知', tag: '消防', tagColor: '#C94545', meta: '2026-04-16' },
      { title: '台风季节安全防范提醒', tag: '天气', tagColor: '#1D5F8A', meta: '2026-04-10' },
      { title: '电梯年检合格公告', tag: '设施', tagColor: '#2D8B6F', meta: '2026-03-28' }
    ]
  },
  'resource': {
    title: '资源共享', icon: 'share',
    gradient: 'linear-gradient(135deg, #1D5F8A, #134566)',
    desc: '邻里闲置物品交换、技能共享',
    items: [
      { title: '儿童绘本共享角', tag: '物品', tagColor: '#C8963E', meta: '3栋 李女士' },
      { title: '周末乒乓球搭子', tag: '技能', tagColor: '#2D8B6F', meta: '5栋 王先生' },
      { title: '闲置婴儿床转让', tag: '物品', tagColor: '#C8963E', meta: '2栋 张女士' }
    ]
  }
};

Page({
  data: { feature: null, featureKey: '', pickerIndex: 0 },

  onLoad(options) {
    const key = options.key || '';
    this.setData({ feature: FEATURES[key] || null, featureKey: key });
  },

  goBack() { wx.navigateBack(); },
  goHome() {
    const pages = getCurrentPages();
    // 找到 entry 页面，回到它
    const entryIdx = pages.findIndex(p => p.route === 'pages/entry/entry');
    if (entryIdx >= 0) {
      wx.navigateBack({ delta: pages.length - 1 - entryIdx });
    } else {
      wx.reLaunch({ url: '/pages/entry/entry' });
    }
  },

  onPickerChange(e) { this.setData({ pickerIndex: e.detail.value }); },

  onFormInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ ['formData.' + key]: e.detail.value });
  },

  submitSuggestion() {
    const content = this.data.formData?.content || '';
    if (!content.trim()) {
      Toast({ context: this, selector: '#t-toast', message: '请填写详细描述' });
      return;
    }
    Toast({ context: this, selector: '#t-toast', message: '提交成功，我们会尽快处理', theme: 'success' });
    setTimeout(() => wx.navigateBack(), 1200);
  },

  handleItemTap() {
    Toast({ context: this, selector: '#t-toast', message: '功能建设中，敬请期待' });
  }
});
