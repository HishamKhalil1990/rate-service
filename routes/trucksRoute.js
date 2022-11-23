require('dotenv').config()
const express = require('express')
const router = express.Router()
const controller = require('../controller/trucksController')

router.get('/check-number/:number',controller.checkNumber)
router.post('/insert-status',controller.insertStatus)

module.exports = router