const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { visitId, filterPhone } = event;

  try {
    // 查询用户身份档案
    const userCheck = await db.collection('users').where({ _openid: openid }).get();
    const userProfile = userCheck.data.length > 0 ? userCheck.data[0] : null;
    const identityInfo = userProfile ? {
      identityVerified: userProfile.identityVerified || false,
      verifiedBy: userProfile.verifiedBy || '',
      verifiedCommunity: userProfile.verifiedCommunity || '',
      totalVisits: userProfile.totalVisits || 0
    } : null;

    if (visitId) {
      const doc = await db.collection('visits').doc(visitId).get();
      return { success: true, visit: doc.data, identityInfo };
    }

    // 构建查询条件：必须匹配当前 openid
    const baseWhere = { _openid: openid };

    // ★ 关键修复：如果前端传了 filterPhone，额外按 phone 过滤
    // 这样换手机号登录后只看到该手机号的记录
    if (filterPhone && filterPhone.length === 11) {
      baseWhere.phone = filterPhone;
    }

    // 查询该用户最新的活跃拜访记录
    const result = await db.collection('visits')
      .where({
        ...baseWhere,
        status: _.in(['pending', 'approved'])
      })
      .orderBy('createTime', 'desc')
      .limit(1)
      .get();

    if (result.data.length > 0) {
      const historyResult = await db.collection('visits')
        .where(baseWhere)
        .orderBy('createTime', 'desc')
        .limit(5)
        .get();

      return { success: true, visit: result.data[0], hasActiveVisit: true, history: historyResult.data, identityInfo };
    }

    // 查询历史记录
    const historyResult = await db.collection('visits')
      .where(baseWhere)
      .orderBy('createTime', 'desc')
      .limit(5)
      .get();

    return {
      success: true,
      visit: null,
      hasActiveVisit: false,
      history: historyResult.data,
      identityInfo
    };
  } catch (err) {
    console.error('查询拜访状态失败', err);
    return { success: false, errMsg: '系统异常', err: err.message };
  }
};
