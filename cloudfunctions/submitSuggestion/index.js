const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { communityId, category, content, contact } = event;

  if (!communityId || !category || !content) {
    return { success: false, errMsg: '请填写完整的诉求信息' };
  }

  try {
    // 查询该住户在当前小区的 verified 记录
    const { data: residents } = await db.collection('residents').where({
      _openid: openid,
      communityId,
      status: 'verified'
    }).get();

    if (residents.length === 0) {
      return { success: false, errMsg: '仅认证住户可提交诉求' };
    }

    await db.collection('suggestions').add({
      data: {
        _openid: openid,
        communityId,
        category,
        content,
        contact: contact || '',
        residentName: residents[0].name,
        residentRoom: residents[0].room,
        status: '待处理',
        reply: '',
        replyTime: null,
        createdAt: db.serverDate()
      }
    });

    return { success: true };
  } catch (err) {
    console.error('提交诉求失败', err);
    return { success: false, errMsg: '提交失败', err: err.message };
  }
};
