const functions = require('../utils/functions')

const checkUser = async (req, res) => {
  try{
    const {username,password} = req.body
    const users = await functions.checkUser(username,password)
    if(users?.length > 0){
      const branches = await functions.getBranches()
      if(branches){
        const categories = await functions.getCategories()
        if(categories){
          res.send({
            status: "success",
            username: users[0].supervisorName,
            data: {
              branches,
              categories
            }
          })
        }else{
          res.send({
            status: "failed",
            msg:'لم يتم سحب البيانات لوجود خلل تقني الرجاء المحاولة لاحقا'
          })
        }
      }else{
        res.send({
          status: "failed",
          msg:'لم يتم سحب البيانات لوجود خلل تقني الرجاء المحاولة لاحقا'
        })
      }
    }else{
      let msg;
      if(users){
        msg = 'اسم المستخدم او كلمة المرور خاطئة'
      }else{
        msg = 'لم يتم التحقق من المستخدم لوجود خلل تقني الرجاء المحاولة لاحقا'
      }
      res.send({
        status: "failed",
        msg
      })
    }
  }catch(err){
    res.send({
      status: "failed",
      msg:'لم يتم التحقق من المستخدم لوجود خلل تقني الرجاء المحاولة لاحقا'
    })
  }
};

const getQuestions = async (req, res) => {
  try{
    const branches = await functions.getBranches()
    if(branches){
      const categories = await functions.getCategories()
      if(categories){
        res.send({
          status: "success",
          data: {
            branches,
            categories
          }
        })
      }else{
        res.send({
          status: "failed",
          msg:'لم يتم تحديث الاسئلة'
        })
      }
    }else{
      res.send({
        status: "failed",
        msg:'لم يتم تحديث قائمة الفروع'
      })
    }
  }catch(err){
    res.send({
      status: "failed",
      msg:'لم يتم سحب البيانات لوجود خلل تقني الرجاء المحاولة لاحقا'
    })
  }
};

const saveRate = async (req, res) => {
  const data = req.body
  functions.saveCategoriesRate(data)
  .then(() => {
    res.send({
      status: "success",
    });
  })
  .catch(() => {
    res.send({
      status: "failed",
      msg:'خلل تقني'
    });
  })
};

const getBranchesList = async (req, res) => {
  try{
    const branches = await functions.getBranches()
    if(branches){
      res.send({
        status: "success",
        data: {
          branches,
        }
      })
    }else{
      res.send({
        status: "failed",
        msg:'لم يتم تحديث قائمة الفروع'
      })
    }
  }catch(err){
    res.send({
      status: "failed",
      msg:'لم يتم سحب البيانات لوجود خلل تقني الرجاء المحاولة لاحقا'
    })
  }
}

const saveCustomer = async (req, res) => {
  let data = req.body
  try{
    data.userName = data.userName? data.userName : 'غير مدخل'
    data.serviceLevelValue = data.serviceLevelValue? data.serviceLevelValue : 'غير مدخل'
    functions.saveInCustTable(data)
    .then((uniqueValue) => {
      functions.sendMsg(data,uniqueValue)
      res.send({
        status: "success",
      })
    }).catch(() => {
      res.send({
        status: "failed",
        msg:'لم يتم حفظ المعلومات'
      })
    })
  }catch(err){
    res.send({
      status: "failed",
      msg:'لم يتم حفظ المعلومات'
    })
  }
}

module.exports = {
  checkUser,
  getQuestions,
  saveRate,
  getBranchesList,
  saveCustomer
};
