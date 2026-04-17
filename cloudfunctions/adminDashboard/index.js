const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 权限校验
  const adminCheck = await db.collection('admins').where({ _openid: openid }).get();
  if (adminCheck.data.length === 0) return { success: false, errMsg: '无管理员权限' };
  const admin = adminCheck.data[0];
  const communityId = event.communityId || admin.communityId;

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const _ = db.command;

    // 住户总数
    const residentTotal = await db.collection('residents').where({ communityId }).count();

    // pending 数
    const pendingCount = await db.collection('residents').where({ communityId, status: 'pending' }).count();

    // 本月新诉求
    const monthSuggestions = await db.collection('suggestions').where({
      communityId,
      createdAt: _.gte(monthStart)
    }).count();

    // 本月公告数
    const monthAnnouncements = await db.collection('announcements').where({
      communityId,
      createdAt: _.gte(monthStart)
    }).count();

    return {
      success: true,
      data: {
        residentTotal: residentTotal.total,
        pendingCount: pendingCount.total,
        monthSuggestions: monthSuggestions.total,
        monthAnnouncements: monthAnnouncements.total
      }
    };
  } catch (err) {
    console.error('仪表盘查询失败', err);
    return { success: false, errMsg: '查询失败', err: err.message };
  }
};
