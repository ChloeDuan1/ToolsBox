// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const GetToolsBox = await cloud.callFunction({
    name: 'search',
    data: {
      table: 'Tools_Box_Address',
    },
    success: res => {
      console.log('[云函数] [search]调用成功！')
    }, fail: err => {
      console.log('[云函数] [search]调用失败！')
    }
  })
  var ToolsBox = GetToolsBox.result.data;
  const GetToolsInfo = await db.collection('Tools_Information').where({
    ID: event.ToolsID
  }).get({
    success: res => {
    }, fail: err => {
      console.log('找不到此工具信息！')
    }
  })
  let ToolsInfo = GetToolsInfo.data;
  try {
    for (let i = 0; i < ToolsBox.length; i++){
      var BoxName = ToolsBox[i].Box_Name;
      const GetToolsInfo = await db.collection(BoxName).where({
        Tools_ID: event.ToolsID
      }).get({
        success: res => {
        }, fail: err => {
          console.log('找不到此工具格口信息！')
        }
      })
      var BoxInfo = GetToolsInfo.data
      if (BoxInfo.length != 0){
        ToolsInfo[0].PortID = BoxInfo[0].Addr;
        ToolsInfo[0].BlueTooth = ToolsBox[i].Bluetooth;
        ToolsInfo[0].BoxAddr = ToolsBox[i].Addr;

      }
      
    }
  } catch (e) {
    console.error(e)
  }
  return ToolsInfo
}