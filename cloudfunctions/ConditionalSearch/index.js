// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
//云函数入口函数

exports.main = async (event, context) => {
  return await db.collection('Record').where({
    ID: event.toolid
  }).orderBy('time', 'desc').get()
  console.log('云函数【ConditionalSearch】查询成功！')
}