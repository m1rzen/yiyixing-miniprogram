const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const guardOpenid = wxContext.OPENID;
  const { status, communityId, page, pageSize, jobId } = event;

  try {
    // 查找保安身份：优先 jobId 精确匹配，回退 openid
    let guardInfo;
    if (jobId) {
      const guardByJob = await db.collection('guards').where({ jobId }).get();
      if (guardByJob.data.length > 0) {
        guardInfo = guardByJob.data[0];
        if (guardInfo._openid !== guardOpenid) {
          await db.collection('guards').doc(guardInfo._id).update({ data: { _openid: guardOpenid } });
        }
      }
    }
    if (!guardInfo) {
      const guardByOpenid = await db.collection('guards').where({ _openid: guardOpenid }).get();
      if (guardByOpenid.data.length > 0) guardInfo = guardByOpenid.data[0];
    }
    if (!guardInfo) {
      return { success: false, errMsg: '无权操作，非保安账号' };
    }

    const limit = pageSize || 20;
    const skip = ((page || 1) - 1) * limit;

    // 构建查询条件
    let query = {};
    if (guardInfo.communityId) query.communityId = guardInfo.communityId;
    if (communityId) query.communityId = communityId;

    if (status === 'pending') {
      query.status = 'pending';
    } else if (status === 'approved') {
      query.status = 'approved';
    } else if (status === 'active') {
      query.status = 'approved';
    } else if (status === 'completed') {
      query.status = 'completed';
    } else if (status === 'history') {
      query.status = _.in(['approved', 'rejected', 'completed']);
    }

    const countResult = await db.collection('visits').where(query).count();
    const listResult = await db.collection('visits')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(limit)
      .get();

    const visits = listResult.data;

    // 批量查询访客的身份认证状态（最多20条，与分页一致）
    let userVerifyMap = {};
    if (visits.length > 0) {
      const openids = [...new Set(visits.map(v => v._openid).filter(Boolean))];
      // 微信云数据库 _.in 最多支持100个值
      const usersResult = await db.collection('users')
        .where({ _openid: _.in(openids) })
        .field({ _openid: true, identityVerified: true, verifiedBy: true, verifiedCommunity: true, verifiedAt: true, totalVisits: true })
        .limit(openids.length)
        .get();
      usersResult.data.forEach(u => {
        userVerifyMap[u._openid] = {
          identityVerified: u.identityVerified || false,
          verifiedBy: u.verifiedBy || '',
          verifiedCommunity: u.verifiedCommunity || '',
          totalVisits: u.totalVisits || 0
        };
      });
    }

    // 将身份认证信息合并到每条拜访记录
    const enrichedList = visits.map(v => ({
      ...v,
      userIdentityVerified: userVerifyMap[v._openid] ? userVerifyMap[v._openid].identityVerified : false,
      userVerifiedBy: userVerifyMap[v._openid] ? userVerifyMap[v._openid].verifiedBy : '',
      userVerifiedCommunity: userVerifyMap[v._openid] ? userVerifyMap[v._openid].verifiedCommunity : '',
      userTotalVisits: userVerifyMap[v._openid] ? userVerifyMap[v._openid].totalVisits : 0
    }));

    return {
      success: true,
      total: countResult.total,
      list: enrichedList,
      guardName: guardInfo.name,
      guardCommunity: guardInfo.community || '全部小区'
    };
  } catch (err) {
    console.error('获取访客列表失败', err);
    return { success: false, errMsg: '系统异常', err: err.message };
  }
};
