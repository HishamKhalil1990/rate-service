require('dotenv').config()
const express = require('express')
const router = express.Router()
const controller = require('../controller/mainController')

router.get('/supervisor/:cardcode',controller.supervisorOrders)

module.exports = router