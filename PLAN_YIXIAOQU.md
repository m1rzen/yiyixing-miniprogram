# 邑小区 — 完整系统迭代计划 v2

> 基于需求确认：缴费/财务暂模拟、需要管理员端、公告需后台发布、多小区身份+严格审核

---

## 一、系统架构总览

```
┌─────────────────────────────────────────────────────┐
│                   微信小程序                         │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ 入口选择 │→│  邑易行  │  │     邑小区        │  │
│  │  entry   │  │ 访客通行 │  │ 住户端 + 管理员端 │  │
│  └──────────┘  └──────────┘  └──────┬────────────┘  │
│                                     │                │
└─────────────────────────────────────┼────────────────┘
                                      │ wx.cloud.callFunction
┌─────────────────────────────────────┼────────────────┐
│              微信云开发后端            │                │
│                                     ▼                │
│  ┌─────────────────────────────────────────────┐     │
│  │           邑易行云函数（已有，不动）            │     │
│  │  registerUser · approveVisit · guardLogin ...  │     │
│  └─────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────┐     │
│  │           邑小区云函数（新增）                  │     │
│  │                                              │     │
│  │  身份层:                                      │     │
│  │   residentLogin · residentAuth · adminLogin   │     │
│  │                                              │     │
│  │  内容层:                                      │     │
│  │   getAnnouncements · submitSuggestion          │     │
│  │   getActivities · joinActivity                 │     │
│  │   applyOpen                                  │     │
│  │                                              │     │
│  │  管理层:                                      │     │
│  │   adminDashboard · adminResidents             │     │
│  │   adminAnnouncements · adminSuggestions       │     │
│  │   adminActivities · adminApplyOpen            │     │
│  └─────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────┐     │
│  │                  云数据库                      │     │
│  │                                              │     │
│  │  已有: users · visits · guards · ...          │     │
│  │  新增: residents · admins · announcements     │     │
│  │        suggestions · activities · open_apps   │     │
│  └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

---

## 二、角色与权限体系

### 三种角色

| 角色 | 集合 | 获取方式 | 权限范围 |
|------|------|---------|---------|
| **住户** | `residents` | 小程序内登录+认证+管理员审核 | 绑定的那一个小区 |
| **管理员** | `admins` | 系统初始化时手动写入，后续可由超级管理员添加 | 绑定的那一个小区 |
| **超级管理员** | `admins`(role=super) | 初始化脚本写入 | 所有小区，可管理其他管理员 |

### 多身份 + 严格审核流程

```
用户A ──申请住户身份──→ residents(status=pending)
         │
管理员 ──审核通过────→ residents(status=verified) ✅
         │
管理员 ──审核驳回────→ residents(status=rejected) ❌ → 可重新提交

用户A ──申请B小区身份──→ 新增一条 residents 记录（status=pending）
         │                  （同一 openid 多条记录，communityId 不同）
管理员 ──审核通过────→ 该条 verified
```

- 一个 `_openid` 可以对应**多条** `residents` 记录（不同小区）
- 用户登录后需要**选择当前所在小区**（类似邑易行的 `tempRecord.selectedCommunity`）
- 住户只能操作自己认证通过的小区数据
- 管理员只能管理自己绑定的小区

---

## 三、数据库设计

### 新增 6 个集合

| 集合 | 用途 | 核心字段 | 索引 |
|------|------|---------|------|
| **residents** | 住户档案 | `_openid`, `name`, `phone`, `idCard`, `communityId`, `room`, `status`(pending/verified/rejected), `rejectReason`, `appliedAt`, `verifiedAt` | `_openid`+`communityId` 联合唯一 |
| **admins** | 管理员账号 | `_openid`, `name`, `phone`, `communityId`, `role`(super/admin), `createdAt` | `_openid` 唯一 |
| **announcements** | 公告 | `communityId`, `title`, `content`, `authorName`, `type`(公告/通知/紧急/安全/规则/合同/公示), `isTop`, `createdAt` | `communityId`+`createdAt` |
| **suggestions** | 诉求建议 | `communityId`, `residentId`, `residentName`, `room`, `category`, `content`, `contact`, `status`(待处理/处理中/已办结), `adminReply`, `createdAt`, `repliedAt` | `communityId`+`createdAt` |
| **activities** | 活动/议事/民生/互助 | `communityId`, `authorId`, `authorName`, `type`(consultation/livelihood/neighbor-help), `title`, `desc`, `progress`(0-100), `status`(进行中/已完成/已结束), `deadline`, `participants`[], `createdAt` | `communityId`+`type`+`createdAt` |
| **open_apps** | 开通申请 | `orgName`, `contactName`, `contactPhone`, `applyType`(业委会/物业/居委会), `status`(待审核/已通过/已拒绝), `createdAt` | `createdAt` |

---

## 四、云函数设计

### 身份层（3 个）

| 云函数 | 功能 | 参数 |
|--------|------|------|
| **residentLogin** | 住户登录/刷新身份 | `{ phone }` → 返回该 openid 下所有 verified 的住户身份列表 |
| **residentAuth** | 提交住户认证 | `{ communityId, name, phone, idCard, room }` → 写入/更新 pending 记录 |
| **adminLogin** | 管理员登录 | `{ communityId, phone, password }` → 验证 admins 集合 |

### 内容层 — 住户端（5 个）

| 云函数 | 功能 | 权限 |
|--------|------|------|
| **getAnnouncements** | 公告列表+详情 | 无需登录（登录后显示本小区公告） |
| **submitSuggestion** | 提交诉求 | 需 verified 住户 |
| **getActivities** | 活动列表 | 无需登录（登录后显示本小区） |
| **joinActivity** | 参与/投票 | 需 verified 住户 |
| **applyOpen** | 提交开通申请 | 无需登录 |

### 管理层 — 管理员端（7 个）

| 云函数 | 功能 | 权限 |
|--------|------|------|
| **adminDashboard** | 仪表盘统计（住户数/待审核/待处理诉求/本月公告数） | admin |
| **adminResidents** | 住户列表+审核（通过/驳回+填理由） | admin |
| **adminAnnouncements** | 公告 CRUD（增删改查+置顶） | admin |
| **adminSuggestions** | 诉求列表+回复（改状态+填回复） | admin |
| **adminActivities** | 活动 CRUD + 更新进度 | admin |
| **adminApplyOpen** | 开通申请列表+审核 | super |
| **adminAddAdmin** | 添加管理员（仅超管） | super |

---

## 五、前端页面设计

### 5.1 入口页改造 `entry`
- 底部入口行新增「管理员入口」按钮
- 点击弹出管理员登录弹窗（选择小区 + 手机号 + 密码）

### 5.2 管理员端 — 新增页面

需要 **2 个新页面**：

| 页面 | 功能 |
|------|------|
| **admin/dashboard** | 管理员工作台首页：统计卡片（住户/待审核/诉求/公告）+ 快捷操作入口 |
| **admin/manage** | 通用管理页：Tab 切换（住户管理/公告管理/诉求管理/活动管理/开通申请），每个 Tab 下是列表+操作 |

> 两个页面足够，通过 Tab 和子弹窗实现全部管理功能，不需要为每个模块建独立页面。

#### 管理端 UI 结构

```
admin/dashboard（工作台首页）
├── 顶部 Banner（暖棕风格 + 小区名）
├── 统计卡片行
│   ├── 住户总数  |  待审核  |  待处理诉求  |  本月公告
├── 快捷操作网格
│   ├── 住户审核  |  发布公告  |  诉求处理  |  活动管理
│   └── 开通申请  |  （扩展）
└── 返回主页按钮

admin/manage（通用管理页，Tab 驱动）
├── Tab: 住户管理
│   └── 列表(姓名/房号/状态标签) → 点击弹出详情弹窗(审核通过/驳回)
├── Tab: 公告管理
│   └── 列表(标题/类型/置顶标签) → 点击弹出编辑弹窗(标题+内容+类型+置顶)
│   └── 右上角 +发布新公告 按钮
├── Tab: 诉求管理
│   └── 列表(内容摘要/状态/时间) → 点击弹出详情弹窗(改状态+写回复)
├── Tab: 活动管理
│   └── 列表(标题/类型/进度) → 点击弹出编辑弹窗(更新进度/状态)
│   └── 右上角 +创建活动 按钮
└── Tab: 开通申请（仅超管可见）
    └── 列表(单位/类型/状态) → 点击弹出审核弹窗
```

### 5.3 住户端改造

| 改造点 | 说明 |
|--------|------|
| 登录后选择小区 | 如果 verified 了多个小区，弹出小区选择弹窗 |
| 当前小区切换 | banner 区地址胶囊可点击切换 |
| sub-feature 数据源 | 8 个模块从云端拉取 |
| 未登录降级 | 公告/安全可查看（公开），诉求/投票/缴费等需登录 |

---

## 六、实施顺序（8 步）

| Step | 内容 | 新增文件 | 预估 |
|------|------|---------|------|
| **1** | 数据库集合创建（控制台 + 初始化脚本） | 0 | 手动操作 |
| **2** | 云函数 — 身份层（3 个） | 3 个云函数 | 核心基础 |
| **3** | 云函数 — 内容层（5 个） | 5 个云函数 | 主要工作量 |
| **4** | 云函数 — 管理层（7 个） | 7 个云函数 | 最大工作量 |
| **5** | 前端 — 管理员端页面（2 页面） | admin/dashboard + admin/manage | UI 重点 |
| **6** | 前端 — 住户端对接（yixiaoqu + sub-feature） | 改造现有文件 | 中等 |
| **7** | 前端 — 入口页+全局优化 | 改造 entry + app.js | 轻量 |
| **8** | 测试数据初始化 + 推送 | seed 脚本 + git | 收尾 |

**总新增文件**：~30 个（15 云函数 + 6 前端页面 + 初始化脚本 + 文档）

---

## 七、安全规则

| 规则 | 说明 |
|------|------|
| 住户数据隔离 | `residents` 查询必须带 `communityId`，住户只能读写自己小区 |
| 管理员验证 | 所有 `admin*` 云函数第一行验证调用者 `_openid` 是否在 `admins` 集合 |
| 超管专属 | `adminAddAdmin` 和 `adminApplyOpen` 检查 `role === 'super'` |
| 审核唯一性 | 住户认证审核时检查该房号是否已被其他人 verified |
| 多身份隔离 | 住户操作活动/诉求时，校验 `residents._openid === OPENID && residents.communityId === 活动.communityId` |
