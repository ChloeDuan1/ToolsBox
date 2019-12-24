// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const GetBoxInfo = await cloud.callFunction({
    name: 'search',
    data: {
      table: event.BoxName,
    },
    success: res => {
      console.log('[云函数] [search]调用成功！')
    }, fail: err => {
      console.log('[云函数] [search]调用失败！')
    }
  })
  var BoxInfo = GetBoxInfo.result.data;
  var ShowList = [];
  try {
  for (let i = 0; i < BoxInfo.length; i++) {
    var Key = BoxInfo[i].Tools_ID;
    const GetToolsInfo = await db.collection('Tools_Information').where({
      ID: Key
    }).get({
      success: res => {
      }, fail: err => {
        console.log('找不到此工具信息！')
      }
    })
    let ToolsInfo = GetToolsInfo.data;
    ToolsInfo[0].portAddr = BoxInfo[i].Addr;
    ShowList[i] = ToolsInfo[0];
    
  }
  } catch (e) {
    console.error(e)
  }
  return ShowList
}


