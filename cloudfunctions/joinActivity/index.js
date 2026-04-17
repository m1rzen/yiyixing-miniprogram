const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { activityId } = event;

  if (!activityId) {
    return { success: false, errMsg: '缺少活动ID' };
  }

  try {
    // 权限校验：必须是 verified 住户
    const { data: residents } = await db.collection('residents').where({
      _openid: openid,
      status: 'verified'
    }).get();

    if (residents.length === 0) {
      return { success: false, errMsg: '仅认证住户可报名活动' };
    }

    // 将 openid 加入 participants 数组（去重）
    await db.collection('activities').doc(activityId).update({
      data: {
        participants: _.addToSet(openid)
      }
    });

    return { success: true };
  } catch (err) {
    console.error('报名活动失败', err);
    return { success: false, errMsg: '报名失败', err: err.message };
  }
};
