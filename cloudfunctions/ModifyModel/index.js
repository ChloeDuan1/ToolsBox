// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  return await db.collection("Tools_Box_Address").where({
    Box_Name: event.boxname
  }).update({
    data: {
      Model: event.model,
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