const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * submitVisit - 提交访客申请（功能等同于 registerUser 的精简版，专用于明确的 visit 场景）
 * 兼容旧版调用，内部委托 registerUser 的逻辑
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { name, phone, idCard, platform, community, communityId, reason, photoFileId } = event;

  if (!name || !phone || !community || !reason) {
    return { success: false, errMsg: '请完整填写必填项' };
  }

  try {
    // 确保用户记录存在
    const userCheck = await db.collection('users').where({ _openid: openid }).get();
    if (userCheck.data.length === 0) {
      await db.collection('users').add({
        data: {
          _openid: openid,
          name, phone, idCard: idCard || '',
          role: 'visitor',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
    } else {
      await db.collection('users').where({ _openid: openid }).update({
        data: { name, phone, idCard: idCard || '', updateTime: db.serverDate() }
      });
    }

    // 平台快捷核验
    let platformVerified = false;
    if (platform && platform !== '普通访客') {
      const verifiablePlatforms = ['美团', '顺丰', '京东'];
      platformVerified = verifiablePlatforms.some(p => platform.includes(p));
    }

    // 创建拜访记录
    const visitData = {
      _openid: openid,
      visitorName: name,
      visitorPhone: phone,
      visitorIdCard: idCard || '',
      community, communityId: communityId || '',
      reason,
      photoFileId: photoFileId || '',
      platform: platform || '普通访客',
      platformVerified,
      platformInfo: platformVerified ? `${platform}身份已核验` : '',
      status: platformVerified ? 'approved' : 'pending',
      approvedBy: platformVerified ? 'system' : '',
      approveTime: platformVerified ? db.serverDate() : null,
      rejectReason: '',
      entryTime: null, exitTime: null,
      isInside: false,
      lastLocationTime: null, lastLatitude: null, lastLongitude: null,
      createTime: db.serverDate(), updateTime: db.serverDate()
    };

    const addResult = await db.collection('visits').add({ data: visitData });

    return {
      success: true,
      visitId: addResult._id,
      status: visitData.status,
      platformVerified,
      openid
    };
  } catch (err) {
    console.error('submitVisit 失败', err);
    return { success: false, errMsg: '系统异常，请重试', err: err.message };
  }
};
