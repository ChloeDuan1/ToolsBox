// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) =>{
  return await db.collection("Tools_Information").doc(event.dataid).update({
  data: {
    State: event.status,
    Current_Borrower:event.Borrower,
    StartTime:event.currenttime,
    Password:event.password
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