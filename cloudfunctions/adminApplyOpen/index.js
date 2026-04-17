const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, targetId, page = 1, pageSize = 20 } = event;

  // 权限校验：仅 super 管理员
  const adminCheck = await db.collection('admins').where({ _openid: openid }).get();
  if (adminCheck.data.length === 0) return { success: false, errMsg: '无管理员权限' };
  const admin = adminCheck.data[0];
  if (admin.role !== 'super') return { success: false, errMsg: '仅超级管理员可操作' };

  try {
    if (action === 'list') {
      const totalResult = await db.collection('open_apps').count();
      const total = totalResult.total;
      const { data: list } = await db.collection('open_apps')
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      return { success: true, list, total };
    }

    if (action === 'approve') {
      if (!targetId) return { success: false, errMsg: '参数缺失' };
      await db.collection('open_apps').doc(targetId).update({
        data: { status: '已通过', reviewedAt: db.serverDate() }
      });
      return { success: true };
    }

    if (action === 'reject') {
      if (!targetId) return { success: false, errMsg: '参数缺失' };
      await db.collection('open_apps').doc(targetId).update({
        data: { status: '已驳回', reviewedAt: db.serverDate() }
      });
      return { success: true };
    }

    return { success: false, errMsg: '无效操作' };
  } catch (err) {
    console.error('开通申请管理失败', err);
    return { success: false, errMsg: '操作失败', err: err.message };
  }
};
