const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 1. 插入超级管理员
    const superAdminCheck = await db.collection('admins').where({ _openid: 'test_super_admin' }).get();
    if (superAdminCheck.data.length === 0) {
      await db.collection('admins').add({
        data: {
          _openid: 'test_super_admin',
          name: '系统管理员',
          phone: '13800000000',
          communityId: 'c001',
          role: 'super',
          createdAt: db.serverDate()
        }
      });
    }

    // 2. 插入普通管理员
    const adminCheck = await db.collection('admins').where({ _openid: 'test_admin' }).get();
    if (adminCheck.data.length === 0) {
      await db.collection('admins').add({
        data: {
          _openid: 'test_admin',
          name: '张管理',
          phone: '13800000001',
          communityId: 'c001',
          role: 'admin',
          password: '123456',
          createdAt: db.serverDate()
        }
      });
    }

    // 3. 插入演示公告
    const announcements = [
      {
        communityId: 'c001',
        title: '关于小区绿化养护的通知',
        content: '为提升小区绿化品质，物业将于本周六对中心花园进行养护作业，届时部分区域将临时围蔽，请各位业主注意安全，绕行通行。',
        type: '物业通知',
        isTop: true,
        createdAt: db.serverDate()
      },
      {
        communityId: 'c001',
        title: '电梯年检公告',
        content: '根据特种设备安全法规要求，小区3栋、5栋电梯将于下周一进行年度检验，检验期间电梯暂停使用，请提前做好出行安排。',
        type: '物业通知',
        isTop: false,
        createdAt: db.serverDate()
      },
      {
        communityId: 'c001',
        title: '端午节社区活动报名通知',
        content: '一年一度端午佳节即将来临，社区将举办包粽子比赛、传统文化体验等活动，欢迎各位业主及家属踊跃报名参加。',
        type: '社区活动',
        isTop: false,
        createdAt: db.serverDate()
      }
    ];
    for (const ann of announcements) {
      await db.collection('announcements').add({ data: ann });
    }

    // 4. 插入演示活动
    const activities = [
      {
        communityId: 'c001',
        title: '小区停车场改造方案讨论会',
        content: '针对地下车库地面破损、车位规划不合理等问题，邀请业主代表共同讨论改造方案，征集意见建议。',
        type: '议事',
        location: '社区党群服务中心二楼会议室',
        startTime: '2026-05-01 14:00',
        endTime: '2026-05-01 16:00',
        participants: [],
        maxParticipants: 50,
        status: '进行中',
        createdAt: db.serverDate()
      },
      {
        communityId: 'c001',
        title: '社区义诊活动',
        content: '联合越秀区社区卫生服务中心，为小区居民提供免费健康检查，包括血压测量、血糖检测、中医问诊等服务。',
        type: '民生',
        location: '小区中心花园',
        startTime: '2026-05-10 09:00',
        endTime: '2026-05-10 12:00',
        participants: [],
        maxParticipants: 200,
        status: '即将开始',
        createdAt: db.serverDate()
      },
      {
        communityId: 'c001',
        title: '邻里互助群——家电维修志愿服务队',
        content: '小区热心业主自发组成家电维修志愿服务队，为有需要的邻居提供免费或低价维修服务，弘扬邻里互助精神。',
        type: '互助',
        location: '线上群组 + 上门服务',
        startTime: '2026-04-20 00:00',
        endTime: '2026-12-31 23:59',
        participants: [],
        maxParticipants: 0,
        status: '长期有效',
        createdAt: db.serverDate()
      }
    ];
    for (const act of activities) {
      await db.collection('activities').add({ data: act });
    }

    return { success: true, message: '初始化完成' };
  } catch (err) {
    console.error('初始化失败', err);
    return { success: false, errMsg: '初始化失败', err: err.message };
  }
};
