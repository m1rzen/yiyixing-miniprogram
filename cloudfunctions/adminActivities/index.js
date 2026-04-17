const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { communityId, action, targetId, data, page = 1, pageSize = 20 } = event;

  // 权限校验
  const adminCheck = await db.collection('admins').where({ _openid: openid }).get();
  if (adminCheck.data.length === 0) return { success: false, errMsg: '无管理员权限' };
  const admin = adminCheck.data[0];
  const cid = communityId || admin.communityId;

  try {
    if (action === 'list') {
      const totalResult = await db.collection('activities').where({ communityId: cid }).count();
      const total = totalResult.total;
      const { data: list } = await db.collection('activities')
        .where({ communityId: cid })
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      return { success: true, list, total };
    }

    if (action === 'create') {
      if (!data || !data.title || !data.content) {
        return { success: false, errMsg: '标题和内容不能为空' };
      }
      await db.collection('activities').add({
        data: {
          communityId: cid,
          title: data.title,
          content: data.content,
          type: data.type || '议事',
          location: data.location || '',
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          participants: [],
          maxParticipants: data.maxParticipants || 0,
          status: data.status || '进行中',
          createdAt: db.serverDate()
        }
      });
      return { success: true };
    }

    if (action === 'update') {
      if (!targetId || !data) return { success: false, errMsg: '参数缺失' };
      await db.collection('activities').doc(targetId).update({ data });
      return { success: true };
    }

    if (action === 'delete') {
      if (!targetId) return { success: false, errMsg: '参数缺失' };
      await db.collection('activities').doc(targetId).remove();
      return { success: true };
    }

    return { success: false, errMsg: '无效操作' };
  } catch (err) {
    console.error('活动管理操作失败', err);
    return { success: false, errMsg: '操作失败', err: err.message };
  }
};
