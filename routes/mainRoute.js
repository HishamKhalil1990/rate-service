require('dotenv').config()
const express = require('express')
const router = express.Router()
const controller = require('../controller/mainController')
const functions = require('../utils/functions')
const authentication = functions.authentication

router.get('/supervisor/:cardcode',controller.supervisorOrders)
router.post('/bill-of-lading',authentication,controller.billOfLadingInfo)

module.exports = router