const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const guardOpenid = wxContext.OPENID;
  const { visitId, action, rejectReason, jobId } = event;

  if (!visitId || !action) {
    return { success: false, errMsg: '参数缺失' };
  }

  if (!['approve', 'reject'].includes(action)) {
    return { success: false, errMsg: '无效操作' };
  }

  try {
    // 查找保安身份：优先用 jobId 精确匹配，回退到 openid
    let guardInfo;

    if (jobId) {
      const guardByJob = await db.collection('guards').where({ jobId: jobId }).get();
      if (guardByJob.data.length > 0) {
        guardInfo = guardByJob.data[0];
        if (guardInfo._openid !== guardOpenid) {
          await db.collection('guards').doc(guardInfo._id).update({
            data: { _openid: guardOpenid }
          });
        }
      }
    }

    if (!guardInfo) {
      const guardByOpenid = await db.collection('guards').where({ _openid: guardOpenid }).get();
      if (guardByOpenid.data.length > 0) {
        guardInfo = guardByOpenid.data[0];
      }
    }

    if (!guardInfo) {
      return { success: false, errMsg: '无权操作，非保安账号' };
    }

    // 获取拜访记录
    const visitDoc = await db.collection('visits').doc(visitId).get();
    if (!visitDoc.data) {
      return { success: false, errMsg: '拜访记录不存在' };
    }

    if (visitDoc.data.status !== 'pending') {
      return { success: false, errMsg: '该记录已被处理' };
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      approvedBy: guardInfo.name || guardOpenid,
      approveTime: db.serverDate(),
      updateTime: db.serverDate()
    };

    if (action === 'reject' && rejectReason) {
      updateData.rejectReason = rejectReason;
    }

    await db.collection('visits').doc(visitId).update({ data: updateData });

    // 写入审批日志
    await db.collection('audit_logs').add({
      data: {
        visitId: visitId,
        guardOpenid: guardOpenid,
        guardName: guardInfo.name,
        action: action,
        rejectReason: rejectReason || '',
        createTime: db.serverDate()
      }
    });

    return {
      success: true,
      status: updateData.status,
      message: action === 'approve' ? '已批准通行' : '已驳回申请'
    };
  } catch (err) {
    console.error('审批操作失败', err);
    return { success: false, errMsg: '系统异常', err: err.message };
  }
};
