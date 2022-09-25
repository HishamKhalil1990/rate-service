'use strict'
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const functions = require('./utils/functions')
const mainRouter = require('./routes/mainRoute')

const PORT = process.env.PORT

const app = express()
app.use(bodyParser.json({limit: '50mb'}))
app.use(cors())
app.listen(PORT, (err) => {
    if(err){
        console.log(err)
    }else{
        console.log('server started')
    }
})

app.use('/',mainRouter)

// const startFetching = async() => {
//     const msg = await functions.fetchRates()
//     console.log(msg)
// }

// startFetching()