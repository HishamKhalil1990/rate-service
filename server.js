'use strict'
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const mainRouter = require('./routes/mainRoute')
const supervisorRouter = require('./routes/supervisorRoute')
const trucksRouter = require('./routes/trucksRoute')

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
app.use('/mobile',supervisorRouter)
app.use('/truck',trucksRouter)