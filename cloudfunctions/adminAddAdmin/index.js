const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { name, phone, communityId } = event;

  if (!name || !phone || !communityId) {
    return { success: false, errMsg: '请填写完整的管理员信息' };
  }

  // 权限校验：仅 super 管理员
  const adminCheck = await db.collection('admins').where({ _openid: openid }).get();
  if (adminCheck.data.length === 0) return { success: false, errMsg: '无管理员权限' };
  const admin = adminCheck.data[0];
  if (admin.role !== 'super') return { success: false, errMsg: '仅超级管理员可操作' };

  try {
    // 检查是否已存在同手机号管理员
    const existCheck = await db.collection('admins').where({ phone }).get();
    if (existCheck.data.length > 0) {
      return { success: false, errMsg: '该手机号已被注册为管理员' };
    }

    await db.collection('admins').add({
      data: {
        name,
        phone,
        communityId,
        role: 'admin',
        password: '123456', // 默认密码，首次登录后修改
        createdAt: db.serverDate()
      }
    });

    return { success: true };
  } catch (err) {
    console.error('添加管理员失败', err);
    return { success: false, errMsg: '添加失败', err: err.message };
  }
};
