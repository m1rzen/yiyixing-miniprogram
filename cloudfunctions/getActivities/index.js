const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { communityId, type, page = 1, pageSize = 10 } = event;

  if (!communityId) {
    return { success: false, errMsg: '缺少小区ID' };
  }

  try {
    const where = { communityId };
    if (type) where.type = type;

    const totalResult = await db.collection('activities').where(where).count();
    const total = totalResult.total;

    const { data } = await db.collection('activities')
      .where(where)
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    return { success: true, list: data, total };
  } catch (err) {
    console.error('获取活动列表失败', err);
    return { success: false, errMsg: '获取活动失败', err: err.message };
  }
};
