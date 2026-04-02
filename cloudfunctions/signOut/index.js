const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { visitId } = event;

  if (!visitId) {
    return { success: false, errMsg: '参数缺失' };
  }

  try {
    const visitDoc = await db.collection('visits').doc(visitId).get();
    if (!visitDoc.data) {
      return { success: false, errMsg: '拜访记录不存在' };
    }
    if (visitDoc.data._openid !== openid) {
      return { success: false, errMsg: '无权操作' };
    }
    if (visitDoc.data.status !== 'approved') {
      return { success: false, errMsg: '该记录未被批准，无法签退' };
    }

    // 更新拜访记录为已签退
    await db.collection('visits').doc(visitId).update({
      data: {
        status: 'completed',
        isInside: false,
        exitTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    // 记录签退日志
    await db.collection('signout_logs').add({
      data: {
        visitId: visitId,
        visitorOpenid: openid,
        visitorName: visitDoc.data.visitorName,
        community: visitDoc.data.community,
        signoutTime: db.serverDate()
      }
    });

    return { success: true, message: '签退成功，感谢您的配合' };
  } catch (err) {
    console.error('签退失败', err);
    return { success: false, errMsg: '系统异常', err: err.message };
  }
};
