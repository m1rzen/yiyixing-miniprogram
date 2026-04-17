const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { visitId } = event;

  try {
    // 查询用户身份档案（附带在所有结果中）
    const userCheck = await db.collection('users').where({ _openid: openid }).get();
    const userProfile = userCheck.data.length > 0 ? userCheck.data[0] : null;
    const identityInfo = userProfile ? {
      identityVerified: userProfile.identityVerified || false,
      verifiedBy: userProfile.verifiedBy || '',
      verifiedCommunity: userProfile.verifiedCommunity || '',
      totalVisits: userProfile.totalVisits || 0
    } : null;

    if (visitId) {
      // 查询特定记录
      const doc = await db.collection('visits').doc(visitId).get();
      return { success: true, visit: doc.data, identityInfo };
    }

    // 查询该用户最新的活跃拜访记录
    const result = await db.collection('visits')
      .where({
        _openid: openid,
        status: _.in(['pending', 'approved'])
      })
      .orderBy('createTime', 'desc')
      .limit(1)
      .get();

    if (result.data.length > 0) {
      // 同时查询历史记录（最近5条）
      const historyResult = await db.collection('visits')
        .where({ _openid: openid })
        .orderBy('createTime', 'desc')
        .limit(5)
        .get();

      return { success: true, visit: result.data[0], hasActiveVisit: true, history: historyResult.data, identityInfo };
    }

    // 查询最近的历史记录
    const historyResult = await db.collection('visits')
      .where({ _openid: openid })
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
