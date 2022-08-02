'use strict'
require('dotenv').config()
const functions = require('./utils/functions')

const startFetching = async() => {
    const msg = await functions.fetchRates()
    console.log(msg)
}

startFetching()