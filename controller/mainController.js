require('dotenv').config()
const hana = require('../utils/hana')
const functions = require('../utils/functions')

const PDF_FOLDER_PATH = process.env.PDF_FOLDER_PATH

const supervisorOrders = async(req,res) => {
    try{
        const {cardcode} = req.params
        hana.getSupervisorOrders(cardcode)
        .then(results => {
            res.send(results)
        })
        .catch(() => {
            res.send({msg : "error"})
        })
    }catch(err){
        res.send({msg : "error"})
    }
}

const billOfLadingInfo = async(req,res) => {
    const {billNo,customCenter,companyType,companyName} = req.body
    try{
        const updatedData = await functions.executeTransSql('getData',billNo)
        const historyData = await functions.executeTransSql('getHistoryData',billNo)
        hana.getBillOfLadingInfo(billNo)
        .then(results => {
            let mappedData = {}
            if(updatedData.length > 0){
                mappedData['isUpdated'] = '1'
                mappedData['updatedData'] = updatedData[0]
            }else{
                mappedData['isUpdated'] = '0'
            }
            if(historyData.length > 0){
                mappedData['isHistory'] = '1'
                mappedData['historyData'] = historyData
            }else{
                mappedData['isHistory'] = '0'
            }
            const isTransportor = companyType == 'ناقل'? true : (results[0].TRANSPORTER == 'Maltrans'? true : false)
            mappedData['isTransportor'] = isTransportor
            mappedData['actions'] = functions.getActions(customCenter,isTransportor)
            mappedData['centers'] = customCenter? functions.getCustomCenter() : []
            if(results.length > 0 && companyType != 'ناقل'){
                mappedData['mainData'] = results[0]
                res.send({
                    status:"success",
                    msg:"success",
                    data:mappedData
                })
            }else if(results.length > 0 && companyType == 'ناقل' && results[0].TRANSPORTER == companyName){
                mappedData['mainData'] = results[0]
                res.send({
                    status:"success",
                    msg:"success",
                    data:mappedData
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
    }catch(err){
        res.send({
            status: 'failed',
            msg : "internal error!, please try again"
        })
    }
}

const checkMaltransUser = async(req,res) => {
    const {username,password} = req.body;
    const user = await functions.getUser(username,password)
    if(user){
        if(user.length > 0){
            let tokens = functions.create(username)
                tokens.username = user[0].username
                tokens.customCenter = user[0].customCenter
                tokens.companyType = user[0].companyType
                tokens.companyName = user[0].companyName
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
    let mappedData = {}
    data.notes = data.notes == 'undefined'? "" : data.notes
    try{
        if(data['FileOneName'] != ""){
            functions.savePdf(data['FileOne'],(data.BL + "-" + data['FileOneName']))
            mappedData['customeDeclaration'] = PDF_FOLDER_PATH + "/" + data.BL + "-" + data['FileOneName']
        }else{
            mappedData['customeDeclaration'] = 'no file'
        }
        if(data['FileTwoName'] != ""){
            functions.savePdf(data['FileTwo'],(data.BL + "-" + data['FileTwoName']))
            mappedData['clearanceBill'] = PDF_FOLDER_PATH + "/" + data.BL + "-" + data['FileTwoName']
        }else{
            mappedData['clearanceBill'] = 'no file'
        }
        if(data['FileThreeName'] != ""){
            functions.savePdf(data['FileThree'],(data.BL + "-" + data['FileThreeName']))
            mappedData['samplingModel'] = PDF_FOLDER_PATH + "/" + data.BL + "-" + data['FileThreeName']
        }else{
            mappedData['samplingModel'] = 'no file'
        }
        if(data['FileFourName'] != ""){
            functions.savePdf(data['FileFour'],(data.BL + "-" + data['FileFourName']))
            mappedData['dataResults'] = PDF_FOLDER_PATH + "/" + data.BL + "-" + data['FileFourName']
        }else{
            mappedData['dataResults'] = 'no file'
        }
        mappedData['BL'] = data.BL
        mappedData['customCenter'] = data.customCenter
        mappedData['clearanceNo'] = data.clearanceNo
        mappedData['clearanceDate'] = functions.convertTime(data.clearanceDate)
        mappedData['operationNo'] = data.operationNo == ""? "غير مدخل" : data.operationNo
        mappedData['healthPath'] = data.healthPath
        mappedData['customPath'] = data.customPath
        mappedData['agriPath'] = data.agriPath
        mappedData['energyPath'] = data.energyPath
        mappedData['customTerms'] = "تامينات جمركية"
        mappedData['ins215'] = data.ins215
        mappedData['ins250'] = data.ins250
        mappedData['ins251'] = data.ins251
        mappedData['ins265'] = data.ins265
        mappedData['ins270'] = data.ins270
        mappedData['customeInsurance'] = parseFloat(data.ins215) + parseFloat(data.ins250) + parseFloat(data.ins251) + parseFloat(data.ins265) + parseFloat(data.ins270)
        mappedData['clearanceFinish'] = (data.requiredAction == "إنجاز") || (data.docDone == "منجز")? functions.convertTime(data.clearanceFinish) : ""
        mappedData['requiredAction'] = data.requiredAction
        mappedData['UserName'] = data.UserName
        mappedData['docDone'] = data.docDone
        mappedData['notes'] = data.notes != ""? data.notes : "لا يوجد ملاحظات"
        functions.executeTransSql('send',mappedData)
        .then(() => {
            functions.executeTransSql('getHistoryData',data.BL)
            .then(results => {
                res.send({
                    status: 'success',
                    msg: 'Submit is Done',
                    data:results
                })
                functions.sendMaltransEmail(data.BL)
            })
            .catch(() => {
                res.send({
                    status: 'faild',
                    msg: 'Submit is Done, could not get the updated history due to internal error!.'
                })
            })
        })
        .catch(() => {
            res.send({
                status: 'faild',
                msg: 'server internal error!, could not save files. please try again'
            })
        })
    }catch(err){
        res.send({
            status: 'faild',
            msg: 'server internal error!, could not save files. please try again'
        })
    }
}

const getContainerInfo = async(req,res) => {
    const { containerNo,bL } = req.body
    const info = { containerNo,bL }
    try{
        functions.executeTransSql('getContainerData',info)
        .then(result => {
            res.send({
                status: 'success',
                msg: "success",
                data:result
            })
        })
        .catch(() => {
            res.send({
                status: 'faild',
                msg: 'server internal error!, could not get container info. please try again'
            })
        })
    }catch(err){
        res.send({
            status: 'faild',
            msg: 'server internal error!, could not get container info. please try again'
        })
    }

}

const saveContainerInfo = async(req,res) => {
    const info = req.body
    const mappedInfo = {
        containerNo:info.containerNo,
        bL:info.bL,
        driverName:info.driverName != ""? info.driverName : "غير مدخل",
        driverNumber:info.driverNumber != ""? info.driverNumber : "غير مدخل",
        truckNumber:info.truckNumber != ""? info.truckNumber : "غير مدخل",
        shippingName:info.shippingName != ""? info.shippingName : "غير مدخل",
        note:info.note != ""? info.note : "غير مدخل",
        username:info.username
    }
    try{
        functions.executeTransSql('saveContainerInfo',mappedInfo)
        .then(() => {
            res.send({
                status: 'success',
                msg: 'Submit is Done',
            })
        })
        .catch(() => {
            res.send({
                status: 'faild',
                msg: 'server internal error!, could not get container info. please try again'
            })
        })
    }catch(err){
        res.send({
            status: 'faild',
            msg: 'server internal error!, could not get container info. please try again'
        })
    }

}

module.exports = {
    supervisorOrders,
    billOfLadingInfo,
    checkMaltransUser,
    saveMaltData,
    getContainerInfo,
    saveContainerInfo
}