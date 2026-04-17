const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const { data } = await db.collection('residents').where({ _openid: openid }).get();

    const verified = data.filter(r => r.status === 'verified');
    const pending = data.filter(r => r.status === 'pending');

    return { success: true, verified, pending };
  } catch (err) {
    console.error('住户登录查询失败', err);
    return { success: false, errMsg: '查询失败', err: err.message };
  }
};
