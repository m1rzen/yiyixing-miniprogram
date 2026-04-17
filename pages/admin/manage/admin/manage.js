import Toast from 'tdesign-miniprogram/toast/index';

const app = getApp();

Page({
  data: {
    adminInfo: null,
    activeTab: 0,

    /* ── 住户管理（降级默认数据） ── */
    residents: [
      { _id: 'r1', name: '李明', phone: '138****1234', idcard: '440703199501****', room: '3栋2单元501', status: 'pending', appliedAt: '2026-04-18' },
      { _id: 'r2', name: '王芳', phone: '139****5678', idcard: '440703198803****', room: '5栋1单元302', status: 'verified', verifiedAt: '2026-04-10' },
      { _id: 'r3', name: '张伟', phone: '137****9012', idcard: '440703199207****', room: '2栋3单元801', status: 'rejected', rejectReason: '房号信息不匹配', appliedAt: '2026-04-15' },
      { _id: 'r4', name: '陈晓', phone: '135****3456', idcard: '440703199108****', room: '1栋1单元102', status: 'pending', appliedAt: '2026-04-17' },
      { _id: 'r5', name: '刘洋', phone: '158****7890', idcard: '440703198612****', room: '4栋2单元603', status: 'verified', verifiedAt: '2026-04-08' }
    ],

    /* ── 公告管理（降级默认数据） ── */
    announcements: [
      { _id: 'a1', title: '关于小区绿化升级的通知', content: '为提升小区居住环境，物业将于4月20日起对小区绿化进行全面提升改造，届时部分区域将临时围挡，请各位业主注意安全。', type: '通知', isTop: true, createdAt: '2026-04-18' },
      { _id: 'a2', title: '物业费缴纳提醒', content: '2026年第二季度物业费（4-6月）已开始缴纳，请各业主于4月30日前通过平台或物业前台完成缴费。', type: '公告', isTop: false, createdAt: '2026-04-15' },
      { _id: 'a3', title: '门禁系统升级公告', content: '小区门禁系统将于4月22日凌晨2:00-6:00进行系统升级，升级期间请使用临时通行证出入。', type: '紧急', isTop: false, createdAt: '2026-04-12' }
    ],

    /* ── 诉求处理（降级默认数据） ── */
    suggestions: [
      { _id: 's1', content: '3栋电梯经常故障，已经影响老人出行，希望物业尽快维修更换。', status: 'pending', residentName: '李明', residentRoom: '3栋2单元501', createdAt: '2026-04-18', reply: '' },
      { _id: 's2', content: '小区停车位严重不足，地下车库长期空置但业主无法购买，建议开放更多车位。', status: 'processing', residentName: '王芳', residentRoom: '5栋1单元302', createdAt: '2026-04-14', reply: '' },
      { _id: 's3', content: '建议在小区增设儿童游乐设施，目前没有适合低龄儿童的安全活动区域。', status: 'done', residentName: '刘洋', residentRoom: '4栋2单元603', createdAt: '2026-04-08', reply: '感谢建议，已列入第三季度改善计划。' }
    ],

    /* ── 活动管理（降级默认数据） ── */
    activities: [
      { _id: 'act1', title: '社区植树节活动', content: '组织业主在小区内种植花草树木，美化居住环境。', type: '民生微实事', progress: 60, status: '进行中', createdAt: '2026-04-10' },
      { _id: 'act2', title: '业委会季度议事会', content: '讨论第二季度物业费使用、小区改造计划等议题。', type: '议事协商', progress: 30, status: '筹备中', createdAt: '2026-04-16' },
      { _id: 'act3', title: '邻里互助日', content: '开展维修帮手、代购跑腿等邻里互助志愿服务。', type: '邻里互助', progress: 100, status: '已完成', createdAt: '2026-04-01' }
    ],

    /* ── 开通申请（降级默认数据） ── */
    applications: [
      { _id: 'ap1', orgName: '万达华府业主委员会', type: '业委会', contactName: '陈志强', contactPhone: '139****5566', status: 'pending', createdAt: '2026-04-17' },
      { _id: 'ap2', orgName: '滨江和院物业服务中心', type: '物业公司', contactName: '林美华', contactPhone: '137****7788', status: 'pending', createdAt: '2026-04-16' }
    ],

    /* ── Picker 选项 ── */
    announceTypes: ['公告', '通知', '紧急', '安全', '规则', '合同', '公示'],
    activityTypes: ['议事协商', '民生微实事', '邻里互助'],
    activityStatuses: ['筹备中', '进行中', '已完成', '已取消'],

    /* ── 弹窗控制 ── */
    residentPopup: false,
    currentResident: null,
    rejectReason: '',
    showRejectForm: false,

    announcePopup: false,
    isEditingAnnounce: false,
    currentAnnounce: null,
    editAnnounce: { title: '', content: '', typeIndex: 0, isTop: false },

    suggestionPopup: false,
    currentSuggestion: null,
    suggestionReply: '',

    activityPopup: false,
    isEditingActivity: false,
    currentActivity: null,
    editActivity: { title: '', content: '', typeIndex: 0, progress: 0, statusIndex: 0 },

    applicationPopup: false,
    currentApplication: null,

    confirmDialog: false,
    confirmAction: '',

    announcePickerIndex: 0,
    activityPickerIndex: 0,
    activityStatusIndex: 0
  },

  onLoad(options) {
    const adminInfo = wx.getStorageSync('adminInfo');
    if (!adminInfo) {
      wx.reLaunch({ url: '/pages/entry/entry' });
      return;
    }
    const tab = parseInt(options.tab) || 0;
    this.setData({ adminInfo, activeTab: tab });
    // 加载对应 Tab 的云端数据
    this.loadTabData(tab);
  },

  /* ══════════════════════════════════
     导航
     ══════════════════════════════════ */
  goBack() { wx.navigateBack(); },
  goHome() { wx.reLaunch({ url: '/pages/entry/entry' }); },

  onTabChange(e) {
    const tab = e.detail.value;
    this.setData({ activeTab: tab });
    this.loadTabData(tab);
  },

  // 根据 Tab 索引加载对应数据
  loadTabData(tab) {
    switch (tab) {
      case 0: this.loadResidents(); break;
      case 1: this.loadAnnouncements(); break;
      case 2: this.loadSuggestions(); break;
      case 3: this.loadActivities(); break;
      case 4: this.loadApplications(); break;
    }
  },

  /* ══════════════════════════════════
     云端数据加载（5 个 Tab）
     ══════════════════════════════════ */

  async loadResidents() {
    const cid = this.data.adminInfo && this.data.adminInfo.communityId;
    if (!cid) return;
    try {
      const res = await app.callCloud({ name: 'adminResidents', data: { communityId: cid, action: 'list' } });
      if (res.result && res.result.success && res.result.list) {
        this.setData({ residents: res.result.list });
      }
    } catch (e) {
      console.warn('loadResidents 云端失败，保留默认数据', e);
    }
  },

  async loadAnnouncements() {
    const cid = this.data.adminInfo && this.data.adminInfo.communityId;
    if (!cid) return;
    try {
      const res = await app.callCloud({ name: 'adminAnnouncements', data: { communityId: cid, action: 'list' } });
      if (res.result && res.result.success && res.result.list) {
        this.setData({ announcements: res.result.list });
      }
    } catch (e) {
      console.warn('loadAnnouncements 云端失败，保留默认数据', e);
    }
  },

  async loadSuggestions() {
    const cid = this.data.adminInfo && this.data.adminInfo.communityId;
    if (!cid) return;
    try {
      const res = await app.callCloud({ name: 'adminSuggestions', data: { communityId: cid, action: 'list' } });
      if (res.result && res.result.success && res.result.list) {
        this.setData({ suggestions: res.result.list });
      }
    } catch (e) {
      console.warn('loadSuggestions 云端失败，保留默认数据', e);
    }
  },

  async loadActivities() {
    const cid = this.data.adminInfo && this.data.adminInfo.communityId;
    if (!cid) return;
    try {
      const res = await app.callCloud({ name: 'adminActivities', data: { communityId: cid, action: 'list' } });
      if (res.result && res.result.success && res.result.list) {
        this.setData({ activities: res.result.list });
      }
    } catch (e) {
      console.warn('loadActivities 云端失败，保留默认数据', e);
    }
  },

  async loadApplications() {
    const cid = this.data.adminInfo && this.data.adminInfo.communityId;
    if (!cid) return;
    try {
      const res = await app.callCloud({ name: 'adminApplyOpen', data: { communityId: cid, action: 'list' } });
      if (res.result && res.result.success && res.result.list) {
        this.setData({ applications: res.result.list });
      }
    } catch (e) {
      console.warn('loadApplications 云端失败，保留默认数据', e);
    }
  },

  /* ══════════════════════════════════
     住户管理
     ══════════════════════════════════ */
  showResident(e) {
    const id = e.currentTarget.dataset.id;
    const r = this.data.residents.find(i => i._id === id);
    this.setData({ currentResident: r, residentPopup: true, rejectReason: '', showRejectForm: false });
  },
  showRejectInput() { this.setData({ showRejectForm: true }); },
  hideResident() { this.setData({ residentPopup: false }); },
  onRejectReasonInput(e) { this.setData({ rejectReason: e.detail.value }); },

  async approveResident() {
    const id = this.data.currentResident._id;
    const cid = this.data.adminInfo && this.data.adminInfo.communityId;

    try {
      const res = await app.callCloud({ name: 'adminResidents', data: { communityId: cid, action: 'approve', targetId: id } });
      if (res.result && res.result.success) {
        Toast({ context: this, selector: '#t-toast', message: '已通过审核', theme: 'success' });
        this.setData({ residentPopup: false });
        this.loadResidents();
        return;
      }
    } catch (e) {
      console.warn('approveResident 云端失败，降级本地操作', e);
    }

    // 降级：本地操作
    const residents = this.data.residents.map(r => {
      if (r._id === id) return { ...r, status: 'verified', verifiedAt: new Date().toISOString().slice(0, 10) };
      return r;
    });
    this.setData({ residents, residentPopup: false });
    Toast({ context: this, selector: '#t-toast', message: '已通过审核', theme: 'success' });
  },

  async rejectResident() {
    if (!this.data.rejectReason.trim()) {
      Toast({ context: this, selector: '#t-toast', message: '请填写驳回理由' });
      return;
    }
    const id = this.data.currentResident._id;
    const cid = this.data.adminInfo && this.data.adminInfo.communityId;
    const reason = this.data.rejectReason;

    try {
      const res = await app.callCloud({ name: 'adminResidents', data: { communityId: cid, action: 'reject', targetId: id, rejectReason: reason } });
      if (res.result && res.result.success) {
        Toast({ context: this, selector: '#t-toast', message: '已驳回', theme: 'success' });
        this.setData({ residentPopup: false, rejectReason: '' });
        this.loadResidents();
        return;
      }
    } catch (e) {
      console.warn('rejectResident 云端失败，降级本地操作', e);
    }

    // 降级：本地操作
    const residents = this.data.residents.map(r => {
      if (r._id === id) return { ...r, status: 'rejected', rejectReason: reason };
      return r;
    });
    this.setData({ residents, residentPopup: false, rejectReason: '' });
    Toast({ context: this, selector: '#t-toast', message: '已驳回', theme: 'success' });
  },

  /* ══════════════════════════════════
     公告管理
     ══════════════════════════════════ */
  showAnnounce(e) {
    const id = e.currentTarget.dataset.id;
    const a = this.data.announcements.find(i => i._id === id);
    const typeIndex = this.data.announceTypes.indexOf(a.type);
    this.setData({
      isEditingAnnounce: true,
      currentAnnounce: a,
      editAnnounce: { title: a.title, content: a.content, typeIndex: typeIndex >= 0 ? typeIndex : 0, isTop: a.isTop },
      announcePopup: true
    });
  },

  newAnnounce() {
    this.setData({
      isEditingAnnounce: false,
      currentAnnounce: null,
      editAnnounce: { title: '', content: '', typeIndex: 0, isTop: false },
      announcePopup: true
    });
  },

  hideAnnounce() { this.setData({ announcePopup: false }); },

  onAnnounceInput(e) {
    this.setData({ ['editAnnounce.' + e.currentTarget.dataset.key]: e.detail.value });
  },

  onAnnounceTypeChange(e) {
    this.setData({ ['editAnnounce.typeIndex']: parseInt(e.detail.value) });
  },

  onAnnounceTopChange(e) {
    this.setData({ ['editAnnounce.isTop']: e.detail.value });
  },

  async saveAnnounce() {
    const { editAnnounce, isEditingAnnounce, currentAnnounce, announceTypes } = this.data;
    if (!editAnnounce.title.trim() || !editAnnounce.content.trim()) {
      Toast({ context: this, selector: '#t-toast', message: '请填写标题和内容' });
      return;
    }
    const item = {
      title: editAnnounce.title,
      content: editAnnounce.content,
      type: announceTypes[editAnnounce.typeIndex] || '公告',
      isTop: editAnnounce.isTop
    };
    const cid = this.data.adminInfo && this.data.adminInfo.communityId;
    const action = isEditingAnnounce && currentAnnounce ? 'update' : 'create';
    const targetId = isEditingAnnounce && currentAnnounce ? currentAnnounce._id : '';

    try {
      const res = await app.callCloud({ name: 'adminAnnouncements', data: { communityId: cid, action, targetId, ...item } });
      if (res.result && res.result.success) {
        Toast({ context: this, selector: '#t-toast', message: isEditingAnnounce ? '已保存' : '已发布', theme: 'success' });
        this.setData({ announcePopup: false });
        this.loadAnnouncements();
        return;
      }
    } catch (e) {
      console.warn('saveAnnounce 云端失败，降级本地操作', e);
    }

    // 降级：本地操作
    item.createdAt = new Date().toISOString().slice(0, 10);
    let announcements;
    if (isEditingAnnounce && currentAnnounce) {
      announcements = this.data.announcements.map(a =>
        a._id === currentAnnounce._id ? { ...a, ...item } : a
      );
    } else {
      item._id = 'a' + Date.now();
      announcements = [item, ...this.data.announcements];
    }
    this.setData({ announcements, announcePopup: false });
    Toast({ context: this, selector: '#t-toast', message: isEditingAnnounce ? '已保存' : '已发布', theme: 'success' });
  },

  deleteAnnounce() {
    this.setData({ confirmDialog: true, confirmAction: 'deleteAnnounce' });
  },

  /* ══════════════════════════════════
     诉求处理
     ══════════════════════════════════ */
  showSuggestion(e) {
    const id = e.currentTarget.dataset.id;
    const s = this.data.suggestions.find(i => i._id === id);
    this.setData({ currentSuggestion: s, suggestionPopup: true, suggestionReply: s.reply || '' });
  },
  hideSuggestion() { this.setData({ suggestionPopup: false }); },
  onSuggestionReplyInput(e) { this.setData({ suggestionReply: e.detail.value }); },

  changeSuggestionStatus(e) {
    const status = e.currentTarget.dataset.status;
    if (!this.data.currentSuggestion) return;
    const id = this.data.currentSuggestion._id;
    const suggestions = this.data.suggestions.map(s => {
      if (s._id === id) return { ...s, status };
      return s;
    });
    this.setData({ suggestions, currentSuggestion: { ...this.data.currentSuggestion, status } });
  },

  async submitSuggestionReply() {
    if (!this.data.suggestionReply.trim()) {
      Toast({ context: this, selector: '#t-toast', message: '请填写回复内容' });
      return;
    }
    const id = this.data.currentSuggestion._id;
    const cid = this.data.adminInfo && this.data.adminInfo.communityId;
    const reply = this.data.suggestionReply;

    try {
      const res = await app.callCloud({ name: 'adminSuggestions', data: { communityId: cid, action: 'reply', targetId: id, reply } });
      if (res.result && res.result.success) {
        Toast({ context: this, selector: '#t-toast', message: '回复已提交', theme: 'success' });
        this.setData({ suggestionPopup: false, suggestionReply: '' });
        this.loadSuggestions();
        return;
      }
    } catch (e) {
      console.warn('submitSuggestionReply 云端失败，降级本地操作', e);
    }

    // 降级：本地操作
    const suggestions = this.data.suggestions.map(s => {
      if (s._id === id) return { ...s, reply, status: 'done' };
      return s;
    });
    this.setData({ suggestions, suggestionPopup: false, suggestionReply: '' });
    Toast({ context: this, selector: '#t-toast', message: '回复已提交', theme: 'success' });
  },

  /* ══════════════════════════════════
     活动管理
     ══════════════════════════════════ */
  showActivity(e) {
    const id = e.currentTarget.dataset.id;
    const a = this.data.activities.find(i => i._id === id);
    const typeIndex = this.data.activityTypes.indexOf(a.type);
    const statusIndex = this.data.activityStatuses.indexOf(a.status);
    this.setData({
      isEditingActivity: true,
      currentActivity: a,
      editActivity: { title: a.title, content: a.content, typeIndex: typeIndex >= 0 ? typeIndex : 0, progress: a.progress, statusIndex: statusIndex >= 0 ? statusIndex : 0 },
      activityPopup: true
    });
  },

  newActivity() {
    this.setData({
      isEditingActivity: false,
      currentActivity: null,
      editActivity: { title: '', content: '', typeIndex: 0, progress: 0, statusIndex: 0 },
      activityPopup: true
    });
  },

  hideActivity() { this.setData({ activityPopup: false }); },

  onActivityInput(e) {
    this.setData({ ['editActivity.' + e.currentTarget.dataset.key]: e.detail.value });
  },

  onActivityTypeChange(e) {
    this.setData({ ['editActivity.typeIndex']: parseInt(e.detail.value) });
  },

  onActivityStatusChange(e) {
    this.setData({ ['editActivity.statusIndex']: parseInt(e.detail.value) });
  },

  onActivityProgressChange(e) {
    this.setData({ ['editActivity.progress']: parseInt(e.detail.value) });
  },

  async saveActivity() {
    const { editActivity, isEditingActivity, currentActivity, activityTypes, activityStatuses } = this.data;
    if (!editActivity.title.trim()) {
      Toast({ context: this, selector: '#t-toast', message: '请填写标题' });
      return;
    }
    const item = {
      title: editActivity.title,
      content: editActivity.content,
      type: activityTypes[editActivity.typeIndex] || '议事协商',
      progress: editActivity.progress,
      status: activityStatuses[editActivity.statusIndex] || '筹备中'
    };
    const cid = this.data.adminInfo && this.data.adminInfo.communityId;
    const action = isEditingActivity && currentActivity ? 'update' : 'create';
    const targetId = isEditingActivity && currentActivity ? currentActivity._id : '';

    try {
      const res = await app.callCloud({ name: 'adminActivities', data: { communityId: cid, action, targetId, ...item } });
      if (res.result && res.result.success) {
        Toast({ context: this, selector: '#t-toast', message: isEditingActivity ? '已保存' : '已创建', theme: 'success' });
        this.setData({ activityPopup: false });
        this.loadActivities();
        return;
      }
    } catch (e) {
      console.warn('saveActivity 云端失败，降级本地操作', e);
    }

    // 降级：本地操作
    item.createdAt = new Date().toISOString().slice(0, 10);
    let activities;
    if (isEditingActivity && currentActivity) {
      activities = this.data.activities.map(a =>
        a._id === currentActivity._id ? { ...a, ...item } : a
      );
    } else {
      item._id = 'act' + Date.now();
      activities = [item, ...this.data.activities];
    }
    this.setData({ activities, activityPopup: false });
    Toast({ context: this, selector: '#t-toast', message: isEditingActivity ? '已保存' : '已创建', theme: 'success' });
  },

  deleteActivity() {
    this.setData({ confirmDialog: true, confirmAction: 'deleteActivity' });
  },

  /* ══════════════════════════════════
     开通申请
     ══════════════════════════════════ */
  showApplication(e) {
    const id = e.currentTarget.dataset.id;
    const a = this.data.applications.find(i => i._id === id);
    this.setData({ currentApplication: a, applicationPopup: true });
  },
  hideApplication() { this.setData({ applicationPopup: false }); },

  async approveApplication() {
    const id = this.data.currentApplication._id;
    const cid = this.data.adminInfo && this.data.adminInfo.communityId;

    try {
      const res = await app.callCloud({ name: 'adminApplyOpen', data: { communityId: cid, action: 'approve', targetId: id } });
      if (res.result && res.result.success) {
        Toast({ context: this, selector: '#t-toast', message: '已通过申请', theme: 'success' });
        this.setData({ applicationPopup: false });
        this.loadApplications();
        return;
      }
    } catch (e) {
      console.warn('approveApplication 云端失败，降级本地操作', e);
    }

    // 降级：本地操作
    const applications = this.data.applications.map(a => {
      if (a._id === id) return { ...a, status: 'approved' };
      return a;
    });
    this.setData({ applications, applicationPopup: false });
    Toast({ context: this, selector: '#t-toast', message: '已通过申请', theme: 'success' });
  },

  async rejectApplication() {
    const id = this.data.currentApplication._id;
    const cid = this.data.adminInfo && this.data.adminInfo.communityId;

    try {
      const res = await app.callCloud({ name: 'adminApplyOpen', data: { communityId: cid, action: 'reject', targetId: id } });
      if (res.result && res.result.success) {
        Toast({ context: this, selector: '#t-toast', message: '已驳回申请', theme: 'success' });
        this.setData({ applicationPopup: false });
        this.loadApplications();
        return;
      }
    } catch (e) {
      console.warn('rejectApplication 云端失败，降级本地操作', e);
    }

    // 降级：本地操作
    const applications = this.data.applications.map(a => {
      if (a._id === id) return { ...a, status: 'rejected' };
      return a;
    });
    this.setData({ applications, applicationPopup: false });
    Toast({ context: this, selector: '#t-toast', message: '已驳回申请', theme: 'success' });
  },

  /* ══════════════════════════════════
     确认弹窗（删除公告/活动）
     ══════════════════════════════════ */
  async onConfirmDialog() {
    if (this.data.confirmAction === 'deleteAnnounce') {
      const id = this.data.currentAnnounce._id;
      const cid = this.data.adminInfo && this.data.adminInfo.communityId;

      try {
        const res = await app.callCloud({ name: 'adminAnnouncements', data: { communityId: cid, action: 'delete', targetId: id } });
        if (res.result && res.result.success) {
          Toast({ context: this, selector: '#t-toast', message: '已删除', theme: 'success' });
          this.setData({ announcePopup: false, confirmDialog: false, confirmAction: '' });
          this.loadAnnouncements();
          return;
        }
      } catch (e) {
        console.warn('deleteAnnounce 云端失败，降级本地操作', e);
      }

      // 降级
      this.setData({
        announcements: this.data.announcements.filter(a => a._id !== id),
        announcePopup: false,
        confirmDialog: false,
        confirmAction: ''
      });
      Toast({ context: this, selector: '#t-toast', message: '已删除', theme: 'success' });

    } else if (this.data.confirmAction === 'deleteActivity') {
      const id = this.data.currentActivity._id;
      const cid = this.data.adminInfo && this.data.adminInfo.communityId;

      try {
        const res = await app.callCloud({ name: 'adminActivities', data: { communityId: cid, action: 'delete', targetId: id } });
        if (res.result && res.result.success) {
          Toast({ context: this, selector: '#t-toast', message: '已删除', theme: 'success' });
          this.setData({ activityPopup: false, confirmDialog: false, confirmAction: '' });
          this.loadActivities();
          return;
        }
      } catch (e) {
        console.warn('deleteActivity 云端失败，降级本地操作', e);
      }

      // 降级
      this.setData({
        activities: this.data.activities.filter(a => a._id !== id),
        activityPopup: false,
        confirmDialog: false,
        confirmAction: ''
      });
      Toast({ context: this, selector: '#t-toast', message: '已删除', theme: 'success' });

    } else {
      this.setData({ confirmDialog: false, confirmAction: '' });
    }
  },

  cancelDialog() {
    this.setData({ confirmDialog: false, confirmAction: '' });
  },

  /* ══════════════════════════════════
     状态映射
     ══════════════════════════════════ */
  getResidentStatusText(status) {
    return { pending: '待审核', verified: '已通过', rejected: '已驳回' }[status] || status;
  },
  getSuggestionStatusText(status) {
    return { pending: '待处理', processing: '处理中', done: '已办结' }[status] || status;
  }
});
