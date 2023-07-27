const functions = require('../utils/functions')

const getBarcodeByItem = async(req,res) => {
    const { itemName } = req.params
    functions.searchBarcodes(itemName)
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
    getBarcodeByItem
}