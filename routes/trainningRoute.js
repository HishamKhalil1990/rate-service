require('dotenv').config()
const express = require('express')
const router = express.Router()
const controller = require('../controller/trainningController')

router.get('/get-trainning-questions',controller.getQuestions)
router.get('/get-branches',controller.getBranchesList)
router.post('/check-supervisor-user',controller.checkUser)
router.post('/save-trainning',controller.saveTrainning)

module.exports = router