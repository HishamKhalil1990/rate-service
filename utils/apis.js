require('dotenv').config()
const axios = require('axios')
const BASE_URL = process.env.BASE_URL || "http://localhost:3000"
const urls = {
    allRates: "/get-all-rates", // get
    numAllRates: "/get-no-rates", // get
    saveRate: "/save-rate", // post
    deleteRate: "/delete-rates", // delete
    allUsers: "/get-all-user", // get
    getUser: "/get-user", // post
    saveUser: "/save-user", // post
    updateUser: "/update-user", // put
    deleteUser: "/delete-user" // delete
}

const getData = async (url) => {
    return axios({
        url: urls[url],
        method: 'get',
        baseURL: BASE_URL,
    })
}

const postData = async (url,data) => {
    const headers = {
        'Content-Type': 'application/json'
    }
    return axios({
        url: urls[url],
        method: 'post',
        baseURL: BASE_URL,
        headers,
        data
    })
}

const putData = async (url,data) => {
    const headers = {
        'Content-Type': 'application/json'
    }
    return axios({
        url: urls[url],
        method: 'put',
        baseURL: BASE_URL,
        headers,
        data
    })
}

const deleteData = async (url,data) => {
    const headers = {
        'Content-Type': 'application/json'
    }
    return axios({
        url: urls[url],
        method: 'delete',
        baseURL: BASE_URL,
        headers,
        data
    })
}

module.exports = {
    getData,
    postData,
    putData,
    deleteData
}