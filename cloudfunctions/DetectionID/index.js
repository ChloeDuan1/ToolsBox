// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const UserInfo = await db.collection('User').where({
    _openid: event.Openid
  }).get({
    success: res => {
    }, fail: err => {
      console.log('查找身份信息失败！')
    }
  })
  let UserState = UserInfo.data;
  let ROLE = 'NULL';
  if (UserState.length > 0){
    ROLE = UserState[0].role;
  }
  return ROLE;
}