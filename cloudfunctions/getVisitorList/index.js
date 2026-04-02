const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const guardOpenid = wxContext.OPENID;
  const { status, communityId, page, pageSize } = event;

  try {
    // 验证保安身份
    const guardCheck = await db.collection('guards').where({ _openid: guardOpenid }).get();
    if (guardCheck.data.length === 0) {
      return { success: false, errMsg: '无权操作，非保安账号' };
    }

    const guardInfo = guardCheck.data[0];
    const limit = pageSize || 20;
    const skip = ((page || 1) - 1) * limit;

    // 构建查询条件
    let query = {};

    // 如果保安绑定了特定小区，只显示该小区的数据
    if (guardInfo.communityId) {
      query.communityId = guardInfo.communityId;
    }
    if (communityId) {
      query.communityId = communityId;
    }

    // 按状态筛选
    if (status === 'pending') {
      query.status = 'pending';
    } else if (status === 'approved') {
      query.status = 'approved';
    } else if (status === 'rejected') {
      query.status = 'rejected';
    } else if (status === 'active') {
      query.status = 'approved';
      query.isInside = true;
    } else if (status === 'completed') {
      query.status = 'completed';
    }

    // 查询总数
    const countResult = await db.collection('visits').where(query).count();

    // 查询列表
    const listResult = await db.collection('visits')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(limit)
      .get();

    return {
      success: true,
      total: countResult.total,
      list: listResult.data,
      guardName: guardInfo.name,
      guardCommunity: guardInfo.community || '全部小区'
    };
  } catch (err) {
    console.error('获取访客列表失败', err);
    return { success: false, errMsg: '系统异常', err: err.message };
  }
};
