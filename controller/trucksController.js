require('dotenv').config()
const functions = require('../utils/functions')

const checkNumber = async (req,res) => {
    const {number} = req.params
    const info = {
        truckNo:number
    }
    try{
        functions.executeTransSql('truckInfo',info)
        .then(result => {
            if(result.length > 0){
                res.send({
                    msg : 'success',
                    data : {
                        goods:result[0].U_PO_Description,
                    }
                })
            }else{
                res.send({
                    msg : 'رقم الشاحنة غير موجود',
                })
            }
        })
        .catch(() => {
            res.send({msg : 'حدث خطأ داخلي! الرجاء المحاولة مرة اخرى'})
        })
    }catch(err){
        res.send({msg : 'حدث خطأ داخلي! الرجاء المحاولة مرة اخرى'})
    }
}

const insertStatus = async (req,res) => {
    const {number, status} = req.body
    const info = {
        truckNo:number,
        status
    }
    try{
        functions.executeTransSql('saveTruckStatus',info)
        .then(() => {
            res.send({
                msg : 'success',
            })
        })
        .catch(() => {
            res.send({msg : 'حدث خطأ داخلي! الرجاء المحاولة مرة اخرى'})
        })
    }catch(err){
        res.send({msg : 'حدث خطأ داخلي! الرجاء المحاولة مرة اخرى'})
    }
}

module.exports = {
    checkNumber,
    insertStatus
}