require('dotenv').config();
const mssql = require('mssql');

// enviroment variables database
const MSSQL_LOCAL_ADDRESS = process.env.MSSQL_LOCAL_ADDRESS
const MSSQL_USER = process.env.MSSQL_USER
const MSSQL_PASS_WORD = process.env.MSSQL_PASS_WORD
const MSSQL_DATABASE = process.env.MSSQL_DATABASE
const MSSQL_MALTRANS_DATABASE = process.env.MSSQL_MALTRANS_DATABASE
const mssqlUsersConfig = {
    user: MSSQL_USER,
    password: MSSQL_PASS_WORD,
    database: MSSQL_DATABASE,
    server: MSSQL_LOCAL_ADDRESS,
    port: 1433,
    pool: {
          max: 1000,
          min: 0,
          idleTimeoutMillis: 30000,
          acquireTimeoutMillis: 30000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 30000,
          reapIntervalMillis: 30000,
          createRetryIntervalMillis: 30000,
    },
    options: {
          enableArithAbort: true,
          encrypt: false
    }
};

const mssqlTransactionConfig = {
    user: MSSQL_USER,
    password: MSSQL_PASS_WORD,
    database: MSSQL_MALTRANS_DATABASE,
    server: MSSQL_LOCAL_ADDRESS,
    port: 1433,
    pool: {
          max: 1000,
          min: 0,
          idleTimeoutMillis: 30000,
          acquireTimeoutMillis: 30000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 30000,
          reapIntervalMillis: 30000,
          createRetryIntervalMillis: 30000,
    },
    options: {
          enableArithAbort: true,
          encrypt: false
    }
};

// create SQL connection
const getSQL = async () => {
    try{
        const pool = await mssql.connect(mssqlUsersConfig)
        .then(pool => {
            return pool
        })
        return pool
    }catch(err){
        return
    } 
}

// create transaction SQL connection
const getTransSQL = async () => {
    try{
        const pool = await mssql.connect(mssqlTransactionConfig)
        .then(pool => {          
            return pool
        })
        return pool
    }catch(err){
        return
    } 
}

// create SQL connection
const getTransaction = async (pool) => {
    try{
        const transaction = new mssql.Transaction(pool)
        return transaction
    }catch(err){
        return
    } 
}

// create SQL request from transaction
const getrequest = async (transaction) => {
    try{
        const request = new mssql.Request(transaction)
        return request
    }catch(err){
        return
    } 
}

module.exports = {
    getSQL,
    getTransaction,
    getTransSQL,
    getrequest
};