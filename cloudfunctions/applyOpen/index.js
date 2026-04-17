const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { orgName, contactName, contactPhone, applyType } = event;

  if (!orgName || !contactName || !contactPhone || !applyType) {
    return { success: false, errMsg: '请填写完整的申请信息' };
  }

  try {
    await db.collection('open_apps').add({
      data: {
        _openid: openid,
        orgName,
        contactName,
        contactPhone,
        applyType,
        status: '待审核',
        createdAt: db.serverDate()
      }
    });

    return { success: true };
  } catch (err) {
    console.error('提交开通申请失败', err);
    return { success: false, errMsg: '提交失败', err: err.message };
  }
};
