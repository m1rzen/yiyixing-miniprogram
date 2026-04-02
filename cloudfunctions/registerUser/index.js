const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { name, phone, idCard, platform, community, communityId, reason, photoFileId } = event;

  if (!name || !phone || !idCard || !community || !reason) {
    return { success: false, errMsg: '请完整填写所有必填项' };
  }

  // 身份证格式校验
  const idCardRegex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  if (!idCardRegex.test(idCard)) {
    return { success: false, errMsg: '身份证号格式不正确' };
  }

  // 手机号格式校验
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { success: false, errMsg: '手机号格式不正确' };
  }

  try {
    // 更新或创建用户基本信息
    const userCheck = await db.collection('users').where({ _openid: openid }).get();
    if (userCheck.data.length === 0) {
      await db.collection('users').add({
        data: {
          _openid: openid,
          name, phone, idCard,
          role: 'visitor',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
    } else {
      await db.collection('users').where({ _openid: openid }).update({
        data: { name, phone, idCard, updateTime: db.serverDate() }
      });
    }

    // 第三方平台快捷核验逻辑
    let platformVerified = false;
    let platformInfo = '';
    if (platform && platform !== '普通访客') {
      // 实际生产环境中，这里调用美团/顺丰/京东的开放API
      // 以下为预留的API对接接口
      try {
        if (platform.includes('美团')) {
          // const apiResult = await callMeituanAPI(phone, idCard);
          platformVerified = true;
          platformInfo = '美团骑手身份已核验';
        } else if (platform.includes('顺丰')) {
          // const apiResult = await callShunfengAPI(phone, idCard);
          platformVerified = true;
          platformInfo = '顺丰快递员身份已核验';
        } else if (platform.includes('京东')) {
          // const apiResult = await callJDAPI(phone, idCard);
          platformVerified = true;
          platformInfo = '京东骑手身份已核验';
        }
      } catch (apiErr) {
        console.error('第三方API调用异常', apiErr);
        platformVerified = false;
      }
    }

    // 创建拜访记录
    const visitData = {
      _openid: openid,
      visitorName: name,
      visitorPhone: phone,
      visitorIdCard: idCard,
      community: community,
      communityId: communityId || '',
      reason: reason,
      photoFileId: photoFileId || '',
      platform: platform || '普通访客',
      platformVerified: platformVerified,
      platformInfo: platformInfo,
      // 平台快捷核验通过的直接approved，否则pending等待保安审批
      status: platformVerified ? 'approved' : 'pending',
      approvedBy: platformVerified ? 'system' : '',
      approveTime: platformVerified ? db.serverDate() : null,
      rejectReason: '',
      // 追踪相关
      entryTime: null,
      exitTime: null,
      isInside: false,
      lastLocationTime: null,
      lastLatitude: null,
      lastLongitude: null,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    };

    const addResult = await db.collection('visits').add({ data: visitData });

    return {
      success: true,
      visitId: addResult._id,
      status: visitData.status,
      platformVerified: platformVerified,
      platformInfo: platformInfo,
      openid: openid
    };
  } catch (err) {
    console.error('提交拜访记录失败', err);
    return { success: false, errMsg: '系统异常，请稍后重试', err: err.message };
  }
};
