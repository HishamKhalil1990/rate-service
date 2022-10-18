require('dotenv').config()
const express = require('express')
const multer = require('multer');
const upload = multer({
    limits: { fieldSize: 52428800 }
  });
const router = express.Router()
const controller = require('../controller/mainController')
const functions = require('../utils/functions')
const authentication = functions.authentication

router.get('/supervisor/:cardcode',controller.supervisorOrders)
router.post('/bill-of-lading',authentication,controller.billOfLadingInfo)
router.post('/check-maltrans-user', controller.checkMaltransUser)
router.post('/save-maltrans-data',authentication ,upload.array(), controller.saveMaltData)
router.post('/get-container-info',authentication,controller.getContainerInfo)

module.exports = router