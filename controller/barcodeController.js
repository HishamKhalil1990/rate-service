const functions = require('../utils/functions')

const getPartners = async(req,res) => {
    const data = await functions.getPartners()
    res.send(data)
}

const getBarcodeByItem = async(req,res) => {
    const { itemName,partner } = req.params
    functions.searchBarcodes(itemName,partner)
    .then(result => {
        const mappedResult = []
        result.recordsets[0].forEach((rec,index) => {
            if(rec.BarCode != ''){
                mappedResult.unshift({
                    id:index,
                    name:rec.ItemName,
                    barcode:rec.BarCode,
                    itemCode:rec.ItemCode,
                    partnerName:rec.PartnerName,
                    scale:rec.U_ScaleType
                })
            }else{
                mappedResult.push({
                    id:index,
                    name:rec.ItemName,
                    barcode:rec.BarCode,
                    itemCode:rec.ItemCode,
                    partnerName:rec.PartnerName,
                    scale:rec.U_ScaleType
                })
            }
        })
        res.send(mappedResult)
    }).catch(() => {
        res.send('failed')
    })
}

module.exports = {
    getBarcodeByItem,
    getPartners
}