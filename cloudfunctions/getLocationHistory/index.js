const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { visitId, page, pageSize } = event;

  if (!visitId) {
    return { success: false, errMsg: '参数缺失' };
  }

  try {
    const limit = pageSize || 50;
    const skip = ((page || 1) - 1) * limit;

    // 获取拜访记录详情
    const visitDoc = await db.collection('visits').doc(visitId).get();
    if (!visitDoc.data) {
      return { success: false, errMsg: '拜访记录不存在' };
    }

    // 获取位置历史
    const countResult = await db.collection('location_logs')
      .where({ visitId: visitId })
      .count();

    const logsResult = await db.collection('location_logs')
      .where({ visitId: visitId })
      .orderBy('timestamp', 'desc')
      .skip(skip)
      .limit(limit)
      .get();

    return {
      success: true,
      visit: visitDoc.data,
      total: countResult.total,
      locations: logsResult.data
    };
  } catch (err) {
    console.error('获取位置历史失败', err);
    return { success: false, errMsg: '系统异常', err: err.message };
  }
};
