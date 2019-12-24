// pages/load/load.js
var app = getApp();
Page({
  data: {
    userName: '',
    apartment: '',
    formId:'',
    userPasswordAgain: '',
    repetition: false
  },
  // 返回主页面
  backHomeTap: function () {
    wx.switchTab({
      url: '../index/index',
    })
  },
  // 用户名
  userNameInput: function (e) {
    this.setData({
      userName: e.detail.value
    });
  },
  // 部门
  apartmentInput: function (e) {
    this.setData({
      apartment: e.detail.value
    });
  },
  // 保存按钮
  registerSuccessTap: function (event) {
    let formId = event.detail.formId;
    console.log('formid:', formId);
    this.setData({
      formId: formId
    });
    var userName = this.data.userName;
    var apartment = this.data.apartment;
    var namereg = /^[\u4E00-\u9FA5]+$/;
    var that = this;
    if (userName === '') {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none',
        duration: 2000,
        mask: true
      })
    }
    else if (apartment === '') {
      wx.showToast({
        title: '请输入部门',
        icon: 'none',
        duration: 2000,
        mask: true
      })
    }
    else if (!namereg.test(userName)) {
      wx.showToast({
        title: '请输入正确的名字',
        icon: 'none',
        duration: 2000,
        mask: true
      })
    }
     else {
      // 初始化云
      wx.cloud.init({
        env: 'toolsbox-test-220cc3',
        traceUser: true
      });
      // 初始化数据库
      const db = wx.cloud.database();
      const _ = db.command;
      db.collection('User').where({
        username: _.eq(userName)
      }).get({
        success: res => {
          if (res.data.length <= 0) {
            that.AddPersonalInfo()
          }
          else{
            wx.showToast({
              title: '当前数据库已存在您的个人信息，请联系管理员！',
              icon: 'none',
              duration: 2000,
              mask: true
            })
          }
        }
      })
    }
  },
  AddPersonalInfo: function(){
    var that = this;
    // 初始化云
    wx.cloud.init({
      env: 'toolsbox-test-220cc3',
      traceUser: true
    });
    // 初始化数据库
    const db = wx.cloud.database();

    db.collection('User').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        username: that.data.userName,
        userapartment: that.data.apartment,
        role: '用户',
        state: '普通',
        formid: that.data.formId,
        WeekNum: '0',
        ForbidTime: '0',
        BorrowState: '0'
      },
      success: function (res) {
        // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
        console.log(res);
        console.log(res.errMsg);
        //显示成功并跳转页面回到个人中心页面
        wx.switchTab({
          url: '../index/index',
        })
      }
    })
  
  },
})