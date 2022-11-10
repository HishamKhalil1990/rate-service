require('dotenv').config()
const express = require('express')
const router = express.Router()
const controller = require('../controller/supervisorController')

router.get('/supervisor-orders/:cardcode', controller.getSupervisorOrders)
router.get('/get-all-supervisor-user', controller.getSupervisorUsers)
router.get('/fetch-all-supervisor-user', controller.fetchSupervisorUsers)
router.post('/check-supervisor-user', controller.checkSupervisorUser)
router.post('/register-supervisor-user', controller.saveSupervisorUser)
router.put('/update-supervisor-user', controller.updateSupervisorUser)
router.delete('/delete-supervisor-user', controller.deleteSupervisorUser)

module.exports = router