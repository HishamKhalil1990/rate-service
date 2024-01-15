'use strict'
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require("path");
const mainRouter = require('./routes/mainRoute')
const supervisorRouter = require('./routes/supervisorRoute')
const trucksRouter = require('./routes/trucksRoute')
const rateRouter = require('./routes/rateRoute')
const trainningRouter = require('./routes/trainningRoute')
const barcodeRouter = require('./routes/barcodeRoute')

const PORT = process.env.PORT

const app = express()
app.use(bodyParser.json({limit: '50mb'}))
app.use(cors())
app.use(express.static(path.join(__dirname, "public")));
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
app.use('/rate',rateRouter)
app.use('/trainning',trainningRouter)
app.use('/barcode',barcodeRouter)