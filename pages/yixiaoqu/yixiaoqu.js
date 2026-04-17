import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    features: [
      { icon: 'money-circle',   title: '物业缴费', bg: 'linear-gradient(135deg, #C8963E, #A67930)' },
      { icon: 'edit-1',         title: '诉求建议', bg: 'linear-gradient(135deg, #2D8B6F, #1E6B52)' },
      { icon: 'chart-bar',      title: '财务公开', bg: 'linear-gradient(135deg, #B85C38, #944A2D)' },
      { icon: 'chat-bubble',    title: '议事协商', bg: 'linear-gradient(135deg, #C8963E, #A67930)' },
      { icon: 'calendar',       title: '信息公示', bg: 'linear-gradient(135deg, #1D5F8A, #134566)' },
      { icon: 'heart-filled',   title: '民生微实事', bg: 'linear-gradient(135deg, #D4A08A, #B8856A)' },
      { icon: 'secured',        title: '小区安全', bg: 'linear-gradient(135deg, #2D8B6F, #1E6B52)' },
      { icon: 'share',          title: '资源共享', bg: 'linear-gradient(135deg, #1D5F8A, #134566)' }
    ]
  },

  goBack() {
    wx.navigateBack();
  },

  goLogin() {
    Toast({ context: this, selector: '#t-toast', message: '功能建设中，敬请期待', theme: 'warning' });
  }
});
