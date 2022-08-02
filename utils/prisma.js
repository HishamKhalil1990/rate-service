require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const createAllRates = async(params) => {
    await prisma.rate.createMany({
        data: params
    })
}

const execute = async(func,params) => {
    return func(params)
    .catch(err => {
        return err
    })
    .finally(async () => {
        await prisma.$disconnect()
    }) 
}

module.exports = {
    createAllRates,
    execute
}