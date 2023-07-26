const express = require('express')
const router = express.Router()
const controller = require('../controller/barcodeController')

router.get('/:itemName',controller.getBarcodeByItem)

module.exports = router