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

module.exports = {
    supervisorOrders
}