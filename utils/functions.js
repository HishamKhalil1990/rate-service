require('dotenv').config()
const api = require('./apis')
const prisma = require('./prisma')
const jwt = require("jsonwebtoken");
const sql = require('./sql')
const fs = require('fs')

const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY
const USERS_TABLE = process.env.USERS_TABLE
const PDF_FOLDER_PATH = process.env.PDF_FOLDER_PATH

const fetchRates = async() => {
    try{
        const response = await api.getData("allRates")
        const data = response.data
        if(data.length > 0){
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
                    note: rec.note? rec.note : "لا يوجد",
                    username: rec.username
                }
            })
            const isSaved = await saveFetched(mappedData)
            if(isSaved){
                return await deleteFetched({"ids":idList})
            }else{
                return 'internal error'
            }
        }else{
            return 'no new data'
        }
    }catch(err){
        return 'api error'
    }
}

const saveFetched = async(data) => {
    try{
        return prisma.execute(prisma.createAllRates,data)
    }catch(err){
        return
    }
}

const deleteFetched = async(list) => {
    const response = await api.deleteData("deleteRate",list)
    return response.data.msg
}

const createToken = (username) => {
    return jwt.sign({ username: username }, TOKEN_SECRET_KEY, {
      expiresIn: "24h",
    });
};

const create = (username) => {
    auth = {
        token : createToken(username),
        expiresIn : '24 hour'
    }
    return auth
}

const authentication = (req,res,next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if(!token){
        res.send({
            status: 'unauthorized',
            msg : "session has been ended"
        })
    }else{
        jwt.verify(token, TOKEN_SECRET_KEY, (err, user) => {
            if (err) return res.send({
                status: 'unauthorized',
                msg : "session has been ended"
            });
            req.user = user;
            next();   
        }); 
    }
}

const getUser = async (username,password) => {
    try{
        const pool = await sql.getSQL();
        if(pool){
            const user = await pool.request().query(`select * from ${USERS_TABLE} where Username = '${username}' and Password = '${password}'`)
            .then(result => {
                pool.close();
                return result.recordset;
            })
            return user
        }else{
            return
        }
    }catch(err){
        return
    }
}

const savePdf = (fileStr,fileName) => {
    const data = fileStr.split(',')[1]
    let buf = Buffer.from(data, 'base64');
    fs.writeFile(`${PDF_FOLDER_PATH}/${fileName}`, buf, error => {
        if (error) {
            throw error;
        } else {
            console.log('buffer saved!');
        }
    });
}

module.exports = {
    fetchRates,
    authentication,
    create,
    getUser,
    savePdf
}