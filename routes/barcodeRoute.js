const express = require('express')
const router = express.Router()
const controller = require('../controller/barcodeController')

router.get('/:itemName/:partner',controller.getBarcodeByItem)
router.get('/partners',controller.getPartners)


module.exports = router