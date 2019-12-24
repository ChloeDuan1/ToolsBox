// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  return await db.collection("User").where({
    username: event.username
  }).update({
    data: {
      state: event.status,
      ForbidTime: event.forbidtime,
      BorrowState: event.BorrowState,
      WeekNum: event.WeekNum

    },
    success: res => {
      console.log(res);
    },
    fail: err => {
      icon: 'none',
        console.error('[数据库][更新记录]失败：', err)
    }
  })
}