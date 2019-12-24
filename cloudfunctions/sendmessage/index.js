const cloud = require('wx-server-sdk')
cloud.init()
console.log('初始化')
exports.main = async (event, context) => {
  try {
    console.log('try')
    const result = await cloud.openapi.templateMessage.send({
        touser: event.useropenid,
        page: "pages/personal/personal",
        templateId: 'zGlMHe2pqjSZUJeoK1FKEccSg7bxtsd589jt81Ua-6E',
        formId: event.formid,
        emphasisKeyword: '',
        data: {
          keyword1: {
            value: event.toolid
          },
          keyword2: {
            value: event.toolname
          },
          keyword3: {
            value: event.toolstarttime
          },
          keyword4: {
            value: event.toolborrowtime
          },
          keyword5: {
            value: event.tip
          },
        },
      // touser: 'oW-yP4t9BDikWpMsgXxA-jt4BAHY',
      // page: "pages/personal/personal",
      // templateId: 'zGlMHe2pqjSZUJeoK1FKEccSg7bxtsd589jt81Ua-6E',
      // formId: '7051dbe11f55457eb3f27171d09d25eb',
      // emphasisKeyword: '',
      // data: {
      //   keyword1: {
      //     value: '1'
      //   },
      //   keyword2: {
      //     value: '2'
      //   },
      //   keyword3: {
      //     value: '3'
      //   },
      //   keyword4: {
      //     value: '4'
      //   },
      //   keyword5: {
      //     value: '5'
      //   },
      // },
    })
    console.log(result)
    return result
  } catch (err) {
    console.log(err)
    return err
  }
}