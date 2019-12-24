// pages/revert/revert.js
import regeneratorRuntime from '../../libs/runtime';
var gbk = require('../../utils/urlEncodeGBK.js')
var util = require('../../utils/util.js'); 
Page({

  /**
   * 页面的初始数据
   */
  data: {
      ToolID:'',
      Revertlist:[],
    _discoveryStarted: false,
    devices: [],
    connected: false,
    chs: [],
    deviceId: '',
    deviceName: '',
    serviceId: '',
    services: [],
    write_id:'',
    phonesystem:'',
    flag:'0',
    Time:'',
    Openid:'',
    UserName:'',
    isDisabled:true,
    Userstate:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  // 返回主页面
  backHomeTap: function () {
    wx.switchTab({
      url: '../index/index',
    })
  },
  onLoad: function (options) {
    // 调用函数时，传入new Date()参数，返回值是日期和时间  
    var time = util.formatTime(new Date());
    // 再通过setData更改Page()里面的data，动态更新页面的数据  
    this.setData({
      Time: time,
    });  
    if (options.scene)//判断是否是扫描二维码进入
    {
      let scene = decodeURIComponent(options.scene);//获取参数
      this.setData({
        ToolID: scene
      })
      //获取用户信息
      wx.cloud.init({
        env: 'toolsbox-test-220cc3',
        traceUser: true
      });
      // 初始化数据库
      const db = wx.cloud.database();
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
          const db = wx.cloud.database();
          const _ = db.command;
          db.collection('User').where({
            _openid: this.data.Openid
          }).get({
            success: res => {
              if (res.data.length == 1) {
                this.setData({
                  UserName: res.data[0].username,
                  Userstate: res.data[0].state,
                })
                this.GetBox();
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
        fail: console.error
      })

    }
  },
  async GetBox() {
    var that = this;
    // 初始化云
    wx.cloud.init({
      env: 'toolsbox-test-220cc3',
      traceUser: true
    });
    // 初始化数据库
    const db = wx.cloud.database();
    wx.cloud.callFunction({
      name: 'GetRevertTools',
      data: {
        ToolsID: that.data.ToolID,
      },
      success: res => {
        that.setData({
          Revertlist: res.result,
          isDisabled: false
        })
        console.log('[云函数] [GetToolsInfo]调用成功: ', res.result)
      },
      fail: console.error
    }) 
  },
 //归还按钮点击事件
  revert: function () {
    // 初始化云 
    var that = this;
    that.setData({
      isDisabled: true
    })
    //判断是否是已借出状态
    wx.cloud.callFunction({
      name: 'CheckToolsState',
      data: {
        BorrowToolID: that.data.ToolID,
      },
      success: res => {
        console.log('[云函数] [CheckToolsState] 调用成功！ ', res.result)
        that.setData({
          ToolState: res.result,
        })
        if (that.data.ToolState == '已借出') {
          //连接蓝牙，发送开格口指令，接收到正确返回值后
          that.openBluetoothAdapter();
        }
        if (that.data.ToolState == '可借用') {
          wx.showToast({
            title: '工具还未借出，不可归还！',
            icon: 'none',
            duration: 2000,
            mask: true
          })
        }

      },
      fail: console.error
    })



  },

  //蓝牙连接
  //打开蓝牙适配器
  openBluetoothAdapter() {
    var that = this;
    wx.openBluetoothAdapter({
      success: (res) => {
        that.getBluetoothAdapterState()//获取本机适配器状态，判断是否可用
        console.log('openBluetoothAdapter success', res)
        that.startBluetoothDevicesDiscovery()//搜索附近蓝牙设备
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.showModal({
            title: '错误',
            content: '未找到蓝牙设备, 请打开蓝牙后重试。',
            showCancel: false
          })
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
          })
        }
      }
    })
  },
  ////获取本机适配器状态，判断是否可用
  getBluetoothAdapterState() {
    var that = this;
    wx.getBluetoothAdapterState({
      success: (res) => {
        console.log('getBluetoothAdapterState', res)
        
        var available = res.available,

          discovering = res.discovering;

        if (!available) {

          wx.showToast({

            title: '设备无法开启蓝牙连接',

            icon: 'success',

            duration: 2000

          })

          setTimeout(function () {

            wx.hideToast()

          }, 2000)

        } else {

          if (!discovering) {

            that.startBluetoothDevicesDiscovery();
//            that.getConnectedBluetoothDevices();

          }
      }
      }
    })
  },
  //搜索附近蓝牙设备
  startBluetoothDevicesDiscovery() {
    var that = this
    wx.showLoading({
      title: '蓝牙搜索',
    })
    if (that.data._discoveryStarted) {
      return
    }
    that.setData({
      _discoveryStarted:true
    })
    
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: true,
          success: (res) => {
            console.log('startBluetoothDevicesDiscovery success', res)
            that.onBluetoothDeviceFound()
          },
        })
  },
  //停止搜索附近蓝牙设备
  stopBluetoothDevicesDiscovery() {

    var that = this
    wx.stopBluetoothDevicesDiscovery({
      complete: () => {
        that.setData({
          _discoveryStarted : false
        })
        
      }
    })

  },
  //开启蓝牙设备监听
  onBluetoothDeviceFound() {
    var that = this;
    var BlueToothName = that.data.Revertlist[0].BlueTooth;
    var deviceId = '';
    var devicename = '';
    console.log('开启蓝牙设备监听onBluetoothDeviceFound！！！')
    wx.onBluetoothDeviceFound((res) => {
      if (res.devices[0]) {

        var name = res.devices[0]['name'];

        if ((name != '') && (deviceId == '')) {

          if (name == BlueToothName) {

            deviceId = res.devices[0]['deviceId'];
            devicename = res.devices[0]['name'];
            that.setData({
              deviceId: deviceId,
              deviceName: devicename
            })
            if (that.data._discoveryStarted) {
              console.log('获取规定的蓝牙')
              that.startConnectDevices();
            }
            that.stopBluetoothDevicesDiscovery();
            console.log('设备停止发现')
          }
        }
      }
    })
  },
  startConnectDevices:function(){
    var that = this;
    var deviceid = that.data.deviceId;
    var devicename = that.data.deviceName;





    // 监听设备的连接状态
    wx.onBLEConnectionStateChanged(function (res) {
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
    })
    //连接设备
    wx.createBLEConnection({
      deviceId: that.data.deviceId,
      success: function (res) {
        console.log('---createBLEConnection---success---:', res);
        wx.showToast({
          icon: "success",
          title: '成功连接蓝牙',
        })
        //连接成功后开始获取设备的服务列表
        wx.getBLEDeviceServices({
          // 这里的 deviceId 需要在上面的 getBluetoothDevices中获取
          deviceId: that.data.deviceId,
          success: function (res) {
            console.log('device services:', res)
            console.log('device services:', res.services)
            that.setData({
              services: res.services
            });

            if (res.services.length >= 1) {
              console.log('device services:', that.data.services[0].uuid);
              that.setData({
                serviceId: that.data.services[0].uuid
              });
              console.log('--------------------------------------');
              console.log('device设备的id:', that.data.deviceId);
              console.log('device设备的服务id:', that.data.serviceId);

              //延迟3秒，根据服务获取特征 
              setTimeout(function () {
                wx.getBLEDeviceCharacteristics({
                  // 这里的 deviceId 需要在上面的 getBluetoothDevices
                  deviceId: that.data.deviceId,
                  // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
                  serviceId: that.data.serviceId,
                  success: function (res) {
                    console.log('000000000000---' + that.data.serviceId);
                    console.log('device getBLEDeviceCharacteristics:', res.characteristics)
                    if (res.characteristics.length >= 1) {
                      for (var i = 0; i < res.characteristics.length - 1; i++) {
                        let charc = res.characteristics[i];
                        if (charc.properties.notify) {
                          that.setData({ notify_id: charc.uuid });
                          console.log('notify_id:', that.data.notify_id);
                        }
                        if (charc.properties.write) {
                          that.setData({ write_id: charc.uuid });
                          console.log('write_id:', that.data.write_id);
                        }
                        if (charc.properties.read) {
                          console.log("Find flow control characteristic");
                        }
                      }
                    }
                    console.log('notify_id= ' + that.data.notify_id);
                    console.log('write_id= ' + that.data.write_id);
                    setTimeout(function () {
                      wx.notifyBLECharacteristicValueChanged({
                        // 启用 notify 功能          
                        // 这里的 deviceId 需要在上面的 getBluetoothDevices 或onBluetoothDeviceFound 接口中获取           
                        deviceId: that.data.deviceId,
                        serviceId: that.data.serviceId,
                        characteristicId: that.data.notify_id,
                        state: true,
                        success: function (res) {
                          console.log('notifyBLECharacteristicValueChanged success', res)
                          that.getphonesystem();
                          console.log('手机系统：',that.data.phonesystem);
                          that.IOSSenddata();
                        }
                      })
                    }, 1500);

                  },
                  fail: function (res) {
                    console.log(res);
                  }
                })
              }, 1500);
            }
          },
          fail: function (res) {
            console.log('---createBLEConnection---fail---:', res);
            wx.showModal({
              title: '提示',
              showCancel: false,
              content: '蓝牙连接失败，请重新连接',
              success: function (res) {

              },
              complete: function () {
                wx.navigateBack({
                  delta: 1
                })
              }
            })
          },
          complete: function (res) {
            console.log('---createBLEConnection---complete---:', res);
          }
        })
      }
    })
  
  },
  //IOS发送开柜指令

  IOSSenddata:function(){
    var that = this;
    var PortAddr = that.data.Revertlist[0].PortID
    var CommandHead = "2101"
    var CommandTail = "0101010016"
    var hex = CommandHead + PortAddr + CommandTail;
    var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    }))
    console.log('hex:' + hex)
    //分包发送数据
    for (var i = 0; i < typedArray.length; i += 20) {
      var endLength = 0
      var senddata = typedArray
      endLength = senddata.length
      let buffer = new ArrayBuffer(endLength)
      let dataView = new DataView(buffer)
      let dataSend = []
        for (var j = i; j < senddata.length; j++) {
          dataView.setUint8(j - i, senddata[j])
          dataSend.push(dataView.getUint8(j - i))
        }
        console.log('最后一包或仅有的第一包数据:' + dataSend)
        wx.writeBLECharacteristicValue({
          deviceId: that.data.deviceId,
          serviceId: that.data.serviceId,
          characteristicId: that.data.write_id,
          value: buffer,
          success: function (res) {
            console.log('一包writeBLECharacteristicValue success', res.errMsg)
            //ios读取蓝牙的返回值
            wx.onBLECharacteristicValueChange(function (characteristic) {
              console.log('characteristic value comed:', characteristic)

              let buffer = characteristic.value
              let dataView = new DataView(buffer)
              let dataResult = []
              console.log("拿到的数据")
              console.log("dataView.byteLength", dataView.byteLength)
              for (let i = 0; i < dataView.byteLength; i++) {
                console.log("0x" + dataView.getUint8(i).toString(16))
                dataResult.push(dataView.getUint8(i).toString(16))
              }
              const result = dataResult
              console.log('发送开柜指令接收到的数据:',result)
              if (result[5] == '1'){
                console.log('开柜成功！')
                wx.showToast({
                  icon: "none",
                  duration: 2000,
                  title: '正在归还，请不要退出此界面！',
                })
                //写数据库
                that.UpdateDB();
                that.IOSSendSearchdata();
                
              }
              else {
                console.log('接收失败')
                wx.showToast({
                  icon: "none",
                  duration: 2000,
                  title: '开柜失败！请及时联系管理员！',
                })
                that.closeBluetoothAdapter();
              }
            })
          },
          fail: function (res) {
            console.log('发送失败')
          }
        })
    }
  },
  //发送查询指令

  async IOSSendSearchdata() {
    var that = this;
    var PortAddr = that.data.Revertlist[0].PortID
    var CommandHead = "2101"
    var CommandTail = "0201010016"
    var hex = CommandHead + PortAddr + CommandTail;
    var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    }))
    console.log('hex:' + hex)
    for (var i = 0; i < 30; i++) {
      //分包发送数据
      var endLength = 0
      var senddata = typedArray
      endLength = senddata.length
      let buffer = new ArrayBuffer(endLength)
      let dataView = new DataView(buffer)
      let dataSend = []

      for (var j = 0; j < senddata.length; j++) {
        dataView.setUint8(j, senddata[j])
        dataSend.push(dataView.getUint8(j))
      }
      console.log('IOSSendSearchdata:' + dataSend)
      let result = await new Promise((resolve) => {
        wx.writeBLECharacteristicValue({
          deviceId: that.data.deviceId,
          serviceId: that.data.serviceId,
          characteristicId: that.data.write_id,
          value: buffer,
          success: function (res) {
            console.log('IOSSendSearchdata success', res.errMsg)
            console.log("IOSSendSearchdata 进入查询")
            wx.onBLECharacteristicValueChange(function (characteristic) {
              console.log('IOSSendSearchdata characteristic value comed:', characteristic)

              let buffer = characteristic.value
              let dataView = new DataView(buffer)
              let dataResult = []
              console.log("IOSSendSearchdata 拿到的数据")
              console.log("IOSSendSearchdata dataView.byteLength", dataView.byteLength)
              for (let i = 0; i < dataView.byteLength; i++) {
                console.log("0x" + dataView.getUint8(i).toString(16))
                dataResult.push(dataView.getUint8(i).toString(16))
              }
              const result = dataResult
              console.log('发送查询指令接收到的数据:', result)
              resolve('send success!')
              if (result[5] == '0') {
                that.setData({
                  flag: '1'
                })
                that.closeBluetoothAdapter();
                console.log('close success')
                resolve('close success!')
                return;
              }
              else {
                console.log('柜门未关闭！')
                wx.showToast({
                  icon: "success",
                  title: '柜门未关闭！',
                })
              }
            })
          },
          fail: function (res) {
            console.log('IOSSendSearchdata 发送失败')

          }
        })
      })

      let result1 = await new Promise((resolve) => {
        setTimeout(function () {
          resolve('send success!')
          console.log("IOSSendSearchdata 进入定时器")
        }, 2000);
      })
    }

    that.closeBluetoothAdapter();
    console.log('IOSSendSearchdata 关闭蓝牙适配器')


  },
  //更新工具数据库
  UpdateDB:function(){
    var that = this;
    var dataid = that.data.Revertlist[0]._id;
    wx.cloud.init({
      env: 'toolsbox-test-220cc3',
      traceUser: true
    });

    // 初始化数据库
    const db = wx.cloud.database();

    wx.cloud.callFunction({
      name: 'update',
      data: {
        dataid: dataid,
        status: '可借用',
        Borrower: '无',
        currenttime: 'null'
      },
      success: res => {
        console.log('[云函数] [update] user database: ', res)
        that.Record();
      }
    })

  },
  //记录数据库
  Record:function(){
    var that = this;
    wx.cloud.init({
      env: 'toolsbox-test-220cc3',
      traceUser: true
    });

    // 初始化数据库
    const db = wx.cloud.database();
    wx.cloud.callFunction({
      name: 'insert',
      data: {
        ToolID: that.data.ToolID,
        ToolName: that.data.Revertlist[0].Name,
        ToolDetails: that.data.Revertlist[0].Details,
        Borrower: that.data.UserName,
        Time: that.data.Time,
        Action: '归还',
      },
      success: res => {
        console.log('[云函数] [insert] user database: ', res)
        wx.switchTab({
          url: '../index/index',
        })
        wx.showToast({
          icon: "success",
          duration: 1000,
          title: '归还成功！',
        })
      }
    })
  },
  ///读取蓝牙设备返回特征值并解析
  ReadBLECharacteristicValue:function(){
    var that = this;
    //安卓需要读取
        wx.readBLECharacteristicValue({
        deviceId: that.data.deviceId,
        serviceId: that.data.serviceId,
        characteristicId: that.data.write_id,
        success: function (res) {
          console.log('readBLECharacteristicValue:', res.errCode)
        },
        fail: function (res) {
          console.log('接收失败！')
        }

      })
    },
  //关闭蓝牙模块
  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },
//获取手机型号
getphonesystem:function(){
var that = this;
wx.getSystemInfo({
  success: function(res) {
    that.setData({
      phonesystem: res.platform
    })
  },
})
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
    this.closeBluetoothAdapter()
  },
  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
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
function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i
    }
  }
  return -1
}
