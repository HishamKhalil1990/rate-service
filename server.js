'use strict'
require('dotenv').config()
const api = require('./utils/apis')

const fetchRates = async() => {
    const response = await api.getData("allRates")
    const data = response.data
    const idList = []
    const mappedData = data.map(rec => {
        const arr = rec.answers.split("")
        idList.push(parseInt(rec.id))
        return {
            warehouse: rec.warehouse,
            visit: rec.visit ,
            firstAnswer: arr[0],
            secondAnswer: arr[1],
            thirdAnswer: arr[2],
            fourthAnswer: arr[3],
            fifthAnswer: arr[4],
            note: rec.note? rec.note : undefined,
            username: rec.username
        }
    })
}

fetchRates()