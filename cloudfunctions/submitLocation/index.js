const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { visitId, latitude, longitude, accuracy } = event;

  if (!visitId || !latitude || !longitude) {
    return { success: false, errMsg: '位置参数缺失' };
  }

  try {
    // 验证该访问记录存在且为已批准状态
    const visitDoc = await db.collection('visits').doc(visitId).get();
    if (!visitDoc.data) {
      return { success: false, errMsg: '拜访记录不存在' };
    }
    if (visitDoc.data.status !== 'approved') {
      return { success: false, errMsg: '拜访记录未被批准' };
    }
    if (visitDoc.data._openid !== openid) {
      return { success: false, errMsg: '无权操作' };
    }

    // 插入位置记录
    await db.collection('location_logs').add({
      data: {
        visitId: visitId,
        visitorOpenid: openid,
        visitorName: visitDoc.data.visitorName,
        community: visitDoc.data.community,
        communityId: visitDoc.data.communityId,
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy || 0,
        timestamp: db.serverDate()
      }
    });

    // 更新访问记录中的最新位置信息
    await db.collection('visits').doc(visitId).update({
      data: {
        isInside: true,
        lastLatitude: latitude,
        lastLongitude: longitude,
        lastLocationTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    return { success: true, message: '位置打卡成功' };
  } catch (err) {
    console.error('位置提交失败', err);
    return { success: false, errMsg: '系统异常', err: err.message };
  }
};
