// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const GetTime = await cloud.callFunction({
    name: 'gettime',
    success: res => {
      console.log('gettime成功！')
    }, fail: err => {
      console.log('gettime失败！')
    }
  })
  var Systemtime = GetTime.result;
  let BorrowedTools = await db.collection('Tools_Information').where({
    StartTime: _.neq("null")
  }).get({
    success: res => {
      console.log('Tools_Information查询成功！')
    }, fail: err => {
      console.log('Tools_Information查询失败！')
    }
  })

  let Array_Tools = BorrowedTools.data
  try {
    for (let i = 0; i < Array_Tools.length; i++) {
      var starttime = Array_Tools[i].StartTime
      var cycle = Array_Tools[i].Borrowing_Cycle
      var endtime = Systemtime
      var start_date = new Date(starttime.replace(/-/g, "/"));
      var end_date = new Date(endtime.replace(/-/g, "/"));
      var days = end_date.getTime() - start_date.getTime();
      var day = parseInt(days / (1000 * 60 * 60));
      day = cycle - day
      let Borrower = Array_Tools[i].Current_Borrower
      if (day <= 0) {
        let BorrowerInfo = await db.collection('User').where({
          username: _.eq(Borrower)
        }).get({
          success: res => {
            console.log('User查询成功！')
          }, fail: err => {
            console.log('User查询失败！')
          }
        })
        let Array_Borrower = BorrowerInfo.data
        if (Array_Borrower.length > 0) {
          if (Array_Borrower[0].state == "普通") {
            let Intweek = parseInt(Array_Borrower[0].WeekNum) + 1
            const Forbid = await cloud.callFunction({
              name: 'update_permission',
              data: {
                username: Borrower,
                status: '黑名单',
                forbidtime: Systemtime,
                BorrowState: "1",
                WeekNum: String(Intweek)
              },
              success: res => {
                console.log('[云函数] [update_permission] user database: ', res)
              }
            })
          } 
        }
 
      }
    }
  } catch (e) {
    console.error(e)
  }



}