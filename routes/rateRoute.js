require('dotenv').config()
const express = require('express')
const multer = require('multer');
const upload = multer({
    limits: { fieldSize: 52428800 }
});
const router = express.Router()
const controller = require('../controller/rateController')

router.post('/get-rate-questions',controller.getQuestions)
router.get('/get-branches',controller.getBranchesList)
router.post('/check-supervisor-user',controller.checkUser)
router.post('/save-rate',upload.array('images'),controller.saveRate)
router.post('/send-customer-info',controller.saveCustomer)

module.exports = router