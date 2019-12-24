// pages/personal/personal.js
var app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    Openid: '',
    UserINFO:[],
    BorrowList:[],
    num: '0',
    selectedFlag: false,
    searchFlag: false,
    BorrowList: [],
    username:'',
    toolsid:'',
    Recordlist:[],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })


    // 初始化云
    wx.cloud.init({
      env: 'toolsbox-test-220cc3',
      traceUser: true
    });
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        this.setData({
          Openid: res.result.openid
        })
        // 初始化数据库
        getApp().globalData.openid = this.data.Openid;
        const db = wx.cloud.database();
        const _ = db.command;
        db.collection('User').where({
          _openid: this.data.Openid
        }).get({
          success: res => {
            if (res.data.length == 1) {
              this.setData({
                UserINFO: res.data,
              })
              this.Check();
            }
            else {
              wx.navigateTo({
                url: '../load/load',
              })
            }
          }, fail: err => {
            wx.showToast({
              icon: "none",
              title: '查询记录失败',
            })
          }
        })
      },
      fail:console.error
    })
  },
  onGetUserInfo: function (e) {
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },
  Check:function(){
    var that = this;
    // 初始化云 
    wx.cloud.init({
      env: 'toolsbox-test-220cc3',
      traceUser: true
    });
    var user = that.data.UserINFO[0].username;
    // 初始化数据库
    const db = wx.cloud.database();
    db.collection('Tools_Information').where({
      Current_Borrower: user
    }).get({
      success: res => {
        if (res.data.length >= 1) {
          that.setData({
            num: res.data.length,
            BorrowList: res.data,
          })
        }
      }, fail: err => {
        wx.showToast({
          icon: "none",
          duration: 1000,
          title: 'Tools_Information数据库查询失败',
        })
      }
    })
  },
  // 展开折叠选择  
  changeToggle: function (e) {
 //   console.log("personal--formid",e.detail.formId);
    if (this.data.selectedFlag) {
      this.data.selectedFlag = false;
    } else {
      this.data.selectedFlag = true;
    }

    this.setData({
      selectedFlag: this.data.selectedFlag
    })
  },
  ToolsIDInput: function (e) {
    this.setData({
      toolsid: e.detail.value
    });
  },
  //搜索功能
  ConditionalSearch: function(e) {
    this.setData({
      searchFlag: true
    })
    var ToolsID = this.data.toolsid;
    ToolsID = ToolsID.toLocaleUpperCase();
    if (ToolsID === '') {
      wx.showToast({
        title: '请输入工具ID',
        icon: 'none',
        duration: 2000,
        mask: true
      })
    }
    wx.cloud.callFunction({
      name: 'ConditionalSearch',
      data: {
        toolid: ToolsID
      },
      success: res => {
        console.log('[云函数] [ConditionalSearch] user database: ', res)
        this.setData({
          Recordlist: res.result.data,
        })
        if (this.data.Recordlist.length == 0) {
          wx.showToast({
            title: '数据库查询不到此工具借用记录，请检查输入是否正确！',
            icon: 'none',
            duration: 2000,
            mask: true
          })
        }
      }
    })


  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },


  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})