//app.js

App({
  globalData:{
    openid:'',
    Time: '',
    Tools: [],
    num: '',
    BoxList:[],
    ToolsList:[],

  },
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'toolsbox-test-220cc3',
        traceUser: true,
      })
    }
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        this.globalData.openid = res.result.openid;
      },
      fail: console.error
    })

    var util = require('utils/util.js'); 
    // var time = util.formatTime(new Date());
    // this.globalData.Time = time
    // this.DLRTools();
  },
  // DLRTools: function () {
  //   var that = this;

  //   // 初始化云
  //   wx.cloud.init({
  //     env: 'toolsbox-test-220cc3',
  //     traceUser: true
  //   });
  //   // 初始化数据库
  //   const db = wx.cloud.database();
  //   const _ = db.command
  //   db.collection('Tools_Information').where({
  //     StartTime: _.neq("null")
  //   }).get({
  //     success: res => {
  //       that.globalData.Tools = res.data
        
  //       that.JudgeOverdue();
  //     }, fail: err => {
  //       wx.showToast({
  //         icon: "none",
  //         title: '查询工具信息失败',
  //       })
  //     }
  //   })
  // },
  // CompareTime: function (borrowtime) {
  //   var that = this;
  //   var starttime = borrowtime;
  //   var endtime = that.globalData.Time;
  //   var start_date = new Date(starttime.replace(/-/g, "/"));
  //   var end_date = new Date(endtime.replace(/-/g, "/"));
  //   var days = end_date.getTime() - start_date.getTime();
  //   var day = parseInt(days / (1000 * 60 * 60));
  //   if (day > 0) {
  //     that.globalData.num = day
      
  //   } else {
  //     that.globalData.num = 1
  //   }


  // },
  // JudgeOverdue: function () {
  //   var that = this;
  //   var toolarray = that.globalData.Tools
  //   var currenttime = that.globalData.Time
  //   for (var i = 0; i < toolarray.length; i++) {
  //     var starttime = toolarray[i].StartTime
  //     var endline = toolarray[i].Borrowing_Cycle
  //     that.CompareTime(starttime)
  //     if (parseInt(endline) < that.globalData.num) {
  //       that.Modifypermission(toolarray[i].Current_Borrower);
  //     }
  //   }


  // },
  // Modifypermission: function (username) {
  //   var that = this;
  //   wx.cloud.callFunction({
  //     name: 'update_permission',
  //     data: {
  //       username: username,
  //       status: '黑名单',
  //       forbidtime: that.globalData.Time,
  //     },
  //     success: res => {
  //       console.log('[云函数] [update_permission] user database: ', res)
  //     }
  //   })
  // }

})
