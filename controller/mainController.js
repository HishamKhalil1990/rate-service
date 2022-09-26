const hana = require('../utils/hana')
const functions = require('../utils/functions')
const fs = require('fs')

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
    data = data['FileOne'].split(',')[1]
    let buf = Buffer.from(data, 'base64');
    fs.writeFile('./pdf/hisham.pdf', buf, error => {
        if (error) {
            throw error;
        } else {
            console.log('buffer saved!');
        }
    });
    res.send({msg:'done'})
}

module.exports = {
    supervisorOrders,
    billOfLadingInfo,
    checkMaltransUser,
    saveMaltData
}