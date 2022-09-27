const hana = require('../utils/hana')
const functions = require('../utils/functions')

const supervisorOrders = async(req,res) => {
    const {cardcode} = req.params
    hana.getSupervisorOrders(cardcode)
    .then(results => {
        res.send(results)
    })
    .catch(() => {
        res.send({msg : "error"})
    })
}

const billOfLadingInfo = async(req,res) => {
    const {billNo} = req.body
    hana.getBillOfLadingInfo(billNo)
    .then(results => {
        if(results.length > 0){
            res.send({
                status:"success",
                msg:"success",
                data:results[0]
            })
        }else{
            res.send({
                status: 'failed',
                msg : "no data for this number"
            })
        }
    })
    .catch(() => {
        res.send({
            status: 'failed',
            msg : "internal error!, please try again"
        })
    })
}

const checkMaltransUser = async(req,res) => {
    const {username,password} = req.body;
    const data = await functions.getUser(username,password)
    if(data){
        if(data.length > 0){
            let tokens = functions.create(username)
                tokens.username = username
                res.send({
                    status:"success",
                    msg:"success",
                    tokens
                })
        }else{
            res.send({
                status: 'faild',
                msg: 'invalid username or password'
            })
        }
    }else{
        res.send({
            status: 'faild',
            msg: 'server internal error'
        })
    }
}

const saveMaltData = async(req,res) => {
    let data = req.body
    try{
        if(data['FileOneName'] != ""){
            functions.savePdf(data['FileOne'],data['FileOneName'])
        }
        if(data['FileTwoName'] != ""){
            functions.savePdf(data['FileTwo'],data['FileTwoName'])
        }
        if(data['FileThreeName'] != ""){
            functions.savePdf(data['FileThree'],data['FileThreeName'])
        }
        if(data['FileFourName'] != ""){
            functions.savePdf(data['FileFour'],data['FileFourName'])
        }
    }catch(err){
        res.send({
            status: 'faild',
            msg: 'server internal error!, could not save files. please try again'
        })
    }
    res.send({
        status: 'success',
        msg: 'Submit is Done'
    })
}

module.exports = {
    supervisorOrders,
    billOfLadingInfo,
    checkMaltransUser,
    saveMaltData
}