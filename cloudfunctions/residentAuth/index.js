const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { communityId, name, phone, idCard, room } = event;

  if (!communityId || !name || !phone || !idCard || !room) {
    return { success: false, errMsg: '请填写完整的认证信息' };
  }

  try {
    // 检查该房间是否已有其他人 verified（防止冒用）
    const roomCheck = await db.collection('residents').where({
      communityId,
      room,
      status: 'verified'
    }).get();

    // 过滤掉当前用户自己的记录
    const othersVerified = roomCheck.data.filter(r => r._openid !== openid);
    if (othersVerified.length > 0) {
      return { success: false, errMsg: '该房间已被其他住户认证，如有疑问请联系物业管理处' };
    }

    // 检查该 openid + communityId 是否已有 pending 记录
    const existingPending = await db.collection('residents').where({
      _openid: openid,
      communityId,
      status: 'pending'
    }).get();

    const residentData = {
      communityId,
      name,
      phone,
      idCard,
      room,
      status: 'pending',
      createdAt: db.serverDate()
    };

    if (existingPending.data.length > 0) {
      // 更新已有 pending 记录（允许重新提交）
      await db.collection('residents').doc(existingPending.data[0]._id).update({
        data: { ...residentData, createdAt: db.serverDate() }
      });
    } else {
      // 新增记录
      await db.collection('residents').add({
        data: { _openid: openid, ...residentData }
      });
    }

    return { success: true };
  } catch (err) {
    console.error('住户认证失败', err);
    return { success: false, errMsg: '认证提交失败', err: err.message };
  }
};
