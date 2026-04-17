const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { communityId, phone, password } = event;

  try {
    const { data } = await db.collection('admins').where({ _openid: openid }).get();

    if (data.length === 0) {
      return { success: false, errMsg: '未找到管理员账号，请先在后台配置' };
    }

    const admin = data[0];

    if (admin.role === 'super') {
      // 超管：openid 匹配即可
      return {
        success: true,
        adminInfo: {
          name: admin.name,
          role: admin.role,
          communityId: admin.communityId
        }
      };
    }

    // 普管：验证 phone + password
    if (!phone || !password) {
      return { success: false, errMsg: '请输入手机号和密码' };
    }

    if (communityId && admin.communityId !== communityId) {
      return { success: false, errMsg: '该管理员不属于此小区' };
    }

    if (admin.phone !== phone || admin.password !== password) {
      return { success: false, errMsg: '手机号或密码错误' };
    }

    return {
      success: true,
      adminInfo: {
        name: admin.name,
        role: admin.role,
        communityId: admin.communityId
      }
    };
  } catch (err) {
    console.error('管理员登录失败', err);
    return { success: false, errMsg: '登录失败', err: err.message };
  }
};
