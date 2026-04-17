const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { communityId, action, targetId, rejectReason, page = 1, pageSize = 20 } = event;

  // 权限校验
  const adminCheck = await db.collection('admins').where({ _openid: openid }).get();
  if (adminCheck.data.length === 0) return { success: false, errMsg: '无管理员权限' };
  const admin = adminCheck.data[0];
  const cid = communityId || admin.communityId;

  try {
    if (action === 'list') {
      const totalResult = await db.collection('residents').where({ communityId: cid }).count();
      const total = totalResult.total;
      const { data } = await db.collection('residents')
        .where({ communityId: cid })
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      return { success: true, list: data, total };
    }

    if (action === 'approve') {
      if (!targetId) return { success: false, errMsg: '缺少目标ID' };
      await db.collection('residents').doc(targetId).update({
        data: { status: 'verified', verifiedAt: db.serverDate() }
      });
      return { success: true };
    }

    if (action === 'reject') {
      if (!targetId) return { success: false, errMsg: '缺少目标ID' };
      await db.collection('residents').doc(targetId).update({
        data: { status: 'rejected', rejectReason: rejectReason || '' }
      });
      return { success: true };
    }

    return { success: false, errMsg: '无效操作' };
  } catch (err) {
    console.error('住户管理操作失败', err);
    return { success: false, errMsg: '操作失败', err: err.message };
  }
};
