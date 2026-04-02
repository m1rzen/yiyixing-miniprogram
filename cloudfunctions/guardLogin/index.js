const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { jobId, password } = event;

  if (!jobId || !password) {
    return { success: false, errMsg: '请输入工号和密码' };
  }

  try {
    // 查询保安账号
    const guardCheck = await db.collection('guards').where({
      jobId: jobId
    }).get();

    if (guardCheck.data.length === 0) {
      return { success: false, errMsg: '工号不存在，请联系管理员' };
    }

    const guard = guardCheck.data[0];

    // 密码校验（生产环境应使用加密）
    if (guard.password !== password) {
      return { success: false, errMsg: '密码错误' };
    }

    // 绑定OpenID
    if (!guard._openid || guard._openid !== openid) {
      await db.collection('guards').doc(guard._id).update({
        data: {
          _openid: openid,
          lastLoginTime: db.serverDate()
        }
      });
    } else {
      await db.collection('guards').doc(guard._id).update({
        data: { lastLoginTime: db.serverDate() }
      });
    }

    return {
      success: true,
      guardInfo: {
        name: guard.name,
        jobId: guard.jobId,
        community: guard.community || '',
        communityId: guard.communityId || '',
        phone: guard.phone || ''
      }
    };
  } catch (err) {
    console.error('保安登录失败', err);
    return { success: false, errMsg: '系统异常', err: err.message };
  }
};
