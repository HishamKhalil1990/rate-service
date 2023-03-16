require('dotenv').config()
const express = require('express')
const router = express.Router()
const controller = require('../controller/rateController')

router.get('/get-rate-questions',controller.getQuestions)
router.get('/get-branches',controller.getBranchesList)
router.post('/check-supervisor-user',controller.checkUser)
router.post('/save-rate',controller.saveRate)
router.post('/send-customer-info',controller.saveCustomer)

module.exports = router