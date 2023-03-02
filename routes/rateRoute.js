require('dotenv').config()
const express = require('express')
const router = express.Router()
const controller = require('../controller/rateController')

router.get('/get-rate-questions',controller.getQuestions)
router.post('/check-supervisor-user',controller.checkUser)
router.post('/save-rate',controller.saveRate)

module.exports = router