const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID; // 获取用户唯一的微信标识
  
  // 从前端传入的数据：姓名、电话、身份证、所属平台
  const { name, phone, idCard, platform } = event; 

  try {
    // 1. 实现“全区通用”：根据 OpenID 查询用户是否已在系统数据库登记过
    const userCheck = await db.collection('users').where({ _openid: openid }).get();
    
    // 🌟 预留：对接第三方物流 API (美团/顺丰/京东)
    let isMatch = false; 
    let passReason = '普通访客登记';

    if (platform && idCard) {
      // 此处未来填写真实的 API 请求逻辑
      // 例如：const res = await axios.post('第三方接口地址', { idCard });
      console.log(`正在根据身份证 ${idCard} 向 ${platform} 发起状态查询...`);
      isMatch = true; // 模拟 API 返回核验成功
      passReason = `${platform}骑手核验通过`;
    }

    // 2. 数据库操作：不存在则新增，存在则更新信息
    if (userCheck.data.length === 0) {
      await db.collection('users').add({
        data: { _openid: openid, name, phone, idCard, createTime: db.serverDate() }
      });
    } else {
      await db.collection('users').where({ _openid: openid }).update({
        data: { name, phone, idCard, updateTime: db.serverDate() }
      });
    }

    // 3. 返回处理结果给前端
    return {
      success: true,
      isMatch: isMatch,
      passReason: passReason,
      openid: openid
    };
  } catch (err) {
    return { success: false, err: err };
  }
};