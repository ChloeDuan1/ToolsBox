// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  return await db.collection('Record').add({
    data: {
      ID: event.ToolID,
      name: event.ToolName,
      information: event.ToolDetails,
      user: event.Borrower,
      time: event.Time,
      action:event.Action,
    },
    success: res => {
      console.log(res);
    },
    fail: err => {
      icon: 'none',
        console.error('[数据库][插入记录]失败：', err)
    }
  })
}