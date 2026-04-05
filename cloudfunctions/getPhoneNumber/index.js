const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  try {
    const res = await cloud.openapi.phonenumber.getPhoneNumber({
      code: event.code
    })

    if (res.errCode !== 0) {
      return { success: false, errMsg: res.errMsg || '获取手机号失败' }
    }

    const phoneInfo = res.phoneInfo
    return {
      success: true,
      phoneNumber: phoneInfo.phoneNumber,
      purePhoneNumber: phoneInfo.purePhoneNumber,
      countryCode: phoneInfo.countryCode
    }
  } catch (err) {
    console.error('获取手机号失败', err)
    return { success: false, errMsg: err.message || '获取手机号异常' }
  }
}
