const hana = require('../utils/hana')

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

module.exports = {
    supervisorOrders,
    billOfLadingInfo
}