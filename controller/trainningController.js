const functions = require('../utils/functions')

const checkUser = async (req, res) => {
  const info = {
    roleNo:0
  }
  try{
    const {username,password} = req.body
    const users = await functions.checkUser(username,password)
    if(users?.length > 0){
      const branches = await functions.getBranches(info)
      if(branches){
        const categories = await functions.getTrainCategories()
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
  const info = {
    roleNo:0
  }
  try{
    const branches = await functions.getBranches(info)
    if(branches){
      const categories = await functions.getTrainCategories()
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

const saveTrainning = async (req, res) => {
  const data = req.body
  functions.saveCategoriesReport(data)
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
  const info = {
    roleNo:0
  }
  try{
    const branches = await functions.getBranches(info)
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

module.exports = {
    checkUser,
    getQuestions,
    saveTrainning,
    getBranchesList,
};
  