const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // ── 模式一：仅查询用户档案（不创建拜访记录）──────────────────────────────
  if (event.checkProfile) {
    try {
      const userCheck = await db.collection('users').where({ _openid: openid }).get();
      if (userCheck.data.length === 0) {
        return { success: true, hasProfile: false, user: null };
      }
      const user = userCheck.data[0];
      return {
        success: true,
        hasProfile: true,
        user: {
          name: user.name || '',
          phone: user.phone || '',
          idCard: user.idCard || '',
          photoFileId: user.photoFileId || '',
          identityVerified: user.identityVerified || false,
          verifiedBy: user.verifiedBy || '',
          verifiedCommunity: user.verifiedCommunity || '',
          totalVisits: user.totalVisits || 0
        }
      };
    } catch (err) {
      return { success: false, errMsg: '查询用户档案失败', err: err.message };
    }
  }

  // ── 模式二：提交拜访申请 ──────────────────────────────────────────────────
  const { name, phone, idCard, platform, community, communityId, reason, photoFileId } = event;

  if (!community || !reason) {
    return { success: false, errMsg: '请选择拜访小区和事由' };
  }

  try {
    // 查询用户已有档案
    const userCheck = await db.collection('users').where({ _openid: openid }).get();
    const existingUser = userCheck.data.length > 0 ? userCheck.data[0] : null;

    // 已有档案的用户：从数据库读取身份信息，无需重新填写
    const finalName = (name && name.trim()) || (existingUser && existingUser.name) || '';
    const finalPhone = phone || (existingUser && existingUser.phone) || '';
    const finalIdCard = idCard || (existingUser && existingUser.idCard) || '';
    const finalPhoto = photoFileId || (existingUser && existingUser.photoFileId) || '';

    // 新用户必须填写完整信息
    if (!existingUser) {
      if (!finalName) return { success: false, errMsg: '请输入真实姓名' };
      if (!/^1[3-9]\d{9}$/.test(finalPhone)) return { success: false, errMsg: '手机号格式不正确' };
      if (!/^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(finalIdCard)) {
        return { success: false, errMsg: '身份证号格式不正确' };
      }
    }

    // 第三方平台快捷核验
    let platformVerified = false;
    let platformInfo = '';
    if (platform && platform !== '普通访客') {
      try {
        if (platform.includes('美团')) {
          platformVerified = true;
          platformInfo = '美团骑手身份已核验';
        } else if (platform.includes('顺丰')) {
          platformVerified = true;
          platformInfo = '顺丰快递员身份已核验';
        } else if (platform.includes('京东')) {
          platformVerified = true;
          platformInfo = '京东骑手身份已核验';
        }
      } catch (apiErr) {
        platformVerified = false;
      }
    }

    // 判断此次申请提交时用户身份是否已预认证
    const wasAlreadyVerified = (existingUser && existingUser.identityVerified) || false;
    // 平台核验通过也算已认证
    const identityPreVerified = wasAlreadyVerified || platformVerified;

    // 更新或创建用户档案
    const userUpdateData = {
      name: finalName,
      phone: finalPhone,
      idCard: finalIdCard,
      photoFileId: finalPhoto,
      updateTime: db.serverDate()
    };
    // 平台核验通过时顺带认证身份
    if (platformVerified && existingUser && !existingUser.identityVerified) {
      userUpdateData.identityVerified = true;
      userUpdateData.verifiedBy = 'system';
      userUpdateData.verifiedCommunity = community;
      userUpdateData.verifiedAt = db.serverDate();
    }

    if (!existingUser) {
      await db.collection('users').add({
        data: {
          _openid: openid,
          ...userUpdateData,
          role: 'visitor',
          identityVerified: platformVerified,
          verifiedBy: platformVerified ? 'system' : '',
          verifiedCommunity: platformVerified ? community : '',
          verifiedAt: platformVerified ? db.serverDate() : null,
          totalVisits: 0,
          createTime: db.serverDate()
        }
      });
    } else {
      await db.collection('users').where({ _openid: openid }).update({ data: userUpdateData });
    }

    // 创建拜访记录
    const visitData = {
      _openid: openid,
      visitorName: finalName,
      visitorPhone: finalPhone,
      visitorIdCard: finalIdCard,
      community,
      communityId: communityId || '',
      reason,
      photoFileId: finalPhoto,
      platform: platform || '普通访客',
      platformVerified,
      platformInfo,
      identityPreVerified,          // 提交时是否已是认证用户
      status: (platformVerified || wasAlreadyVerified) ? 'approved' : 'pending',
      approvedBy: (platformVerified || wasAlreadyVerified) ? 'system' : '',
      approveTime: (platformVerified || wasAlreadyVerified) ? db.serverDate() : null,
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
      identityPreVerified,
      openid
    };
  } catch (err) {
    console.error('提交拜访记录失败', err);
    return { success: false, errMsg: '系统异常，请稍后重试', err: err.message };
  }
};
