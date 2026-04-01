const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, communityId, deviceId } = event; // 模拟闸机上传的参数

  // 1. 查询该访客是否有登记记录
  const user = await db.collection('users').where({ _openid: userId }).get();

  if (user.data.length > 0) {
    // 2. 实时记录轨迹：在 locations_log 集合中插入一条位置点数据
    await db.collection('locations_log').add({
      data: {
        userId: userId,
        communityId: communityId,
        deviceId: deviceId, // 闸机设备编号
        timestamp: db.serverDate() // 记录确切时间戳
      }
    });

    return { code: 200, status: 'OPEN', msg: '核验成功，准予进入' };
  } else {
    return { code: 403, status: 'CLOSE', msg: '未登记信息，请先扫码登记' };
  }
};