// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  let BorrowedTools = await db.collection('Tools_Information').where({
    ID: event.BorrowToolID
  }).get({
    success: res => {
      console.log('Tools_Information查询成功！')
    }, fail: err => {
      console.log('Tools_Information查询失败！')
    }
  })

  let Array_Tools = BorrowedTools.data
  return Array_Tools[0].State
}