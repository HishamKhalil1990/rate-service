require('dotenv').config()
const api = require('./apis')
const prisma = require('./prisma')
const jwt = require("jsonwebtoken");
const sql = require('./sql')
const fs = require('fs')
const sendEmail = require('./email')
const hana = require('./hana')
const axios = require('axios')
const locations = require('./locations')

const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY
const MALTRANS_USERS_TABLE = process.env.MALTRANS_USERS_TABLE
const PDF_FOLDER_PATH = process.env.PDF_FOLDER_PATH
const IMAGE_FOLDER_PATH = process.env.IMAGE_FOLDER_PATH
const MSSQL_MALTRANS_SUBMIT_PROCEDURE = process.env.MSSQL_MALTRANS_SUBMIT_PROCEDURE
const MALTRANS_HISTORY_TABLE = process.env.MALTRANS_HISTORY_TABLE
const MALTRANS_SUBMIT_TABLE = process.env.MALTRANS_SUBMIT_TABLE
const MALTRANS_GET_CONTAINER_INFO_PROCEDURE = process.env.MALTRANS_GET_CONTAINER_INFO_PROCEDURE
const MALTRANS_SAVE_CONTAINER_INFO_PROCEDURE = process.env.MALTRANS_SAVE_CONTAINER_INFO_PROCEDURE
const MSSQL_TRUCK_INFO = process.env.MSSQL_TRUCK_INFO
const MSSQL_TRUCK_STATUS = process.env.MSSQL_TRUCK_STATUS
const MSSQL_SUPERVISORS_USER_TABLE = process.env.MSSQL_SUPERVISORS_USER_TABLE
const MSSQL_CHECK_LIST_QUESTIONS = process.env.MSSQL_CHECK_LIST_QUESTIONS
const MSSQL_RATE_QUESTIONS_SCORES = process.env.MSSQL_RATE_QUESTIONS_SCORES
const MSSQL_RATE_GENERAL_INFO = process.env.MSSQL_RATE_GENERAL_INFO
const MSSQL_RATE_IMAGES_PATH = process.env.MSSQL_RATE_IMAGES_PATH
const MSSQL_RATE_QUESTIONS_ANSWERS = process.env.MSSQL_RATE_QUESTIONS_ANSWERS
const MSSQL_CUSTOMER_RATING_TABLE = process.env.MSSQL_CUSTOMER_RATING_TABLE
const MSSQL_TRAIN_LIST_QUESTIONS = process.env.MSSQL_TRAIN_LIST_QUESTIONS
const MSSQL_TRAIN_QUESTIONS_SCORES = process.env.MSSQL_TRAIN_QUESTIONS_SCORES
const MSSQL_TRAIN_GENERAL_INFO = process.env.MSSQL_TRAIN_GENERAL_INFO
const MSSQL_BARCODE_SEARCH = process.env.MSSQL_BARCODE_SEARCH
const MSSQL_PARTNERS = process.env.MSSQL_PARTNERS
const JORMAL_SERNDERID = process.env.JORMAL_SERNDERID
const JORMAL_ACCNAME = process.env.JORMAL_ACCNAME
const JORMAL_ACCPASS = process.env.JORMAL_ACCPASS

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
        const pool = await sql.getTransSQL();
        if(pool){
            const user = await pool.request().query(`select * from ${MALTRANS_USERS_TABLE} where username = '${username}' and password = '${password}'`)
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

/////////////////////////////////////////////////////////////////////////////////
const convertTime = (datetime) => {
    let date = new Date(datetime)
    date = date.toISOString()
    return date
}

const executeTransSql = async (type,info) => {
    return new Promise((resolve,reject) => {
        const start = async () => {
            try{
                const pool = await sql.getTransSQL()
                if(pool){
                    switch(type){
                        case 'send':
                            startTransaction(info,pool).then(() => {
                                pool.close();
                                resolve()
                            })
                            .catch((err) => {
                                pool.close();
                                reject()
                            })
                            break
                        case 'getData':
                            const data = await getSavedData(0,info,pool)
                            if(data){
                                pool.close();
                                resolve(data)
                            }else{
                                pool.close();
                                reject()
                            }
                            break
                        case 'getHistoryData':
                            const histData = await getSavedData(1,info,pool)
                            if(histData){
                                pool.close();
                                resolve(histData)
                            }else{
                                pool.close();
                                reject()
                            }
                            break
                        case 'getContainerData':
                            const containerInfo = await getContainerData(info.bL,info.containerNo,pool)
                            if(containerInfo){
                                pool.close();
                                resolve(containerInfo)
                            }else{
                                pool.close();
                                reject()
                            }
                            break
                        case 'saveContainerInfo':
                            startContainerTransaction(info,pool).then(() => {
                                pool.close();
                                resolve()
                            })
                            .catch((err) => {
                                pool.close();
                                reject()
                            })
                            break
                        case 'truckInfo':
                            getTruckInfo(info,pool).then((data) => {
                                pool.close();
                                resolve(data)
                            })
                            .catch((err) => {
                                pool.close();
                                reject()
                            })
                            break
                        case 'saveTruckStatus':
                            saveTruckStatus(info,pool).then((data) => {
                                pool.close();
                                resolve()
                            })
                            .catch((err) => {
                                pool.close();
                                reject()
                            })
                            break
                        default:
                            break
                    }
                }else{
                    reject()
                }
            }catch(err){
                console.log(err)
                reject()
            }
        }
        start()
    })
}

const startTransaction = async (data,pool) => {
    const transaction = await sql.getTransaction(pool);
    return new Promise((resolve,reject) => {
        try{
            transaction.begin((err) => {
                if(err){
                    console.log("pool",err)
                    reject()
                }
                pool.request()
                .input("BL",data.BL)
                .input("customCenter",data.customCenter)
                .input("clearanceNo",data.clearanceNo)
                .input("clearanceDate",data.clearanceDate)
                .input("healthPath",data.healthPath)
                .input("customPath",data.customPath)
                .input("agriPath",data.agriPath)
                .input("customeInsurance",data.customeInsurance)
                .input("clearanceFinish",data.clearanceFinish)
                .input("requiredAction",data.requiredAction)
                .input("customeDeclaration",data.customeDeclaration)
                .input("clearanceBill",data.clearanceBill)
                .input("samplingModel",data.samplingModel)
                .input("dataResults",data.dataResults)
                .input("UserName",data.UserName)
                .input("DocDone",data.docDone)
                .input("Notes",data.notes)
                .input("customTerms",data.customTerms)
                .input("Ins215",data.ins215)
                .input("Ins250",data.ins250)
                .input("Ins251",data.ins251)
                .input("Ins265",data.ins265)
                .input("Ins270",data.ins270)
                .input("energyPath",data.energyPath)
                .input("operationNo",data.operationNo)
                .execute(MSSQL_MALTRANS_SUBMIT_PROCEDURE,(err,result) => {
                    if(err){
                        console.log('excute',err)
                        reject()
                    }
                    transaction.commit((err) => {
                        if(err){
                            console.log('transaction error : ',err)
                            reject()
                        }
                        resolve();
                    });
                })
            })
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const getSavedData = async (type,bl,pool) => {
    const statments = [MALTRANS_SUBMIT_TABLE,MALTRANS_HISTORY_TABLE]
    const transaction = await sql.getTransaction(pool);
    return new Promise((resolve,reject) => {
        try{
            transaction.begin((err) => {
                if(err){
                    console.log("pool",err)
                    reject()
                }
                pool.request()
                .input("BL",bl)
                .execute(statments[type],(err,result) => {
                    if(err){
                        console.log('excute',err)
                        reject()
                    }
                    transaction.commit((err) => {
                        if(err){
                            console.log('transaction error : ',err)
                            reject()
                        }
                        resolve(result.recordset);
                    });
                })
            })
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const getAttachment = (data) => {
    let attach = `<ul>`
    if(data.customeDeclaration != 'no file'){
        attach += `<li><a href="${data.customeDeclaration}">البيان الجمركي</a></li>`
    }
    if(data.clearanceBill != 'no file'){
        attach += `<li><a href="${data.clearanceBill}">فواتير التخليص</a></li>`
    }
    if(data.samplingModel != 'no file'){
        attach += `<li><a href="${data.samplingModel}">نموذج سحب العينات</a></li>`
    }
    if(data.dataResults != 'no file'){
        attach += `<li><a href="${data.dataResults}">نتائج البيانات والانجازات</a></li>`
    }
    attach += `</ul>`
    return attach
}

const sendMaltransEmail = async(billNo) => {

    let data = await executeTransSql('getData',billNo)
    data = data[0]
    const attachment = getAttachment(data)
    const date = new Date(data.clearanceDate).toISOString().split('T')[0]
    let date2
    if((data.requiredAction == "إنجاز") || (data.DocDone == "منجز")){
        date2 = new Date(data.clearanceFinish).toISOString().split('T')[0]
    }else{
        date2 = "غير منجز"
    }
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml" lang="en">
    <head>
        <link rel="stylesheet" type="text/css" hs-webfonts="true" href="https://fonts.googleapis.com/css?family=Lato|Lato:i,b,bi">
        <title>Email template</title>
        <meta property="og:title" content="Email template"> 
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style type="text/css">
            table{
                border: 3px solid black;
                border-collapse: collapse;
            }
            th{
                text-align: center;
                padding: 20px 10px 20px 10px;
            }
            td{
                min-width: 125px;
                text-align: right;
                padding: 10px;
            }
            div{
                min-width: 125px;
                text-align:center; 
                border: 1px solid black;
                padding: 0px 5px 0px 5px;
            }
            li{
                padding: 5px;
            }
        </style>  
    </head>
    <body style="width: 100%; margin: auto 0; padding:0; font-family:Lato, sans-serif; font-size:18px; word-break:break-word">
        <table>
            <thead>
                <tr>
                    <th colspan="8">
                        ${data.BL} بوليصة رقم
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <div>
                            ${data.customCenter}
                        </div>
                    </td>
                    <td>
                        المركز الجمركي
                    </td>
                    <td>
                        <div>
                            ${data.clearanceNo}
                        </div>
                    </td>
                    <td>
                        رقم البيان الجمركي
                    </td>
                    <td>
                        <div>
                            ${date}
                        </div>
                    </td>
                    <td>
                        تاريخ البيان الجمركي
                    </td>
                    <td>
                        <div>
                            ${data.operationNo}
                        </div>
                    </td>
                    <td>
                        رقم العملية
                    </td>
                </tr>
                <tr>
                    <td>
                        <div>
                            ${data.healthPath}
                        </div>
                    </td>
                    <td>
                        المسرب الصحي
                    </td>
                    <td>
                        <div>
                            ${data.customPath}
                        </div>
                    </td>
                    <td>
                        المسرب الجمركي
                    </td>
                    <td>
                        <div>
                            ${data.agriPath}
                        </div>
                    </td>
                    <td>
                        المسرب الزراعي
                    </td>
                    <td>
                        <div>
                            ${data.energyPath}
                        </div>
                    </td>
                    <td>
                        مسرب الطاقة
                    </td>
                </tr>
                <tr>
                    <td>
                        <div>
                            ${data.notes}
                        </div>
                    </td>
                    <td>
                        الملاحظات
                    </td>
                    <td>
                        <div>
                            ${date2}
                        </div>
                    </td>
                    <td>
                        إنجاز البيان
                    </td>
                    <td>
                        <div>
                            ${data.requiredAction}
                        </div>
                    </td>
                    <td>
                        الإجراء المطلوب
                    </td>
                    <td>
                        <div>
                            ${data.Ins215}
                        </div>
                    </td>
                    <td>
                        بدل وثائق غير مصدقة مستوفاة بالتأمين : 215
                    </td>
                </tr>
                <tr>
                    <td>
                        <div>
                            ${data.Ins250}
                        </div>
                    </td>
                    <td>
                        250: رسم موحد بأمانة
                    </td>
                    <td>
                        <div>
                            ${data.Ins251}
                        </div>
                    </td>
                    <td>
                        251: ضريبة مبيعات عامة نسبية بأمانة
                    </td>
                    <td>
                        <div>
                            ${data.Ins265}
                        </div>
                    </td>
                    <td>
                        265: تأمين بدل خدمات على المستودات المعفاة %1
                    </td>
                    <td>
                        <div>
                            ${data.Ins270}
                        </div>
                    </td>
                    <td>
                        270: تأمين بدل خدمات على بضائع خاضعة للرسوم %5
                    </td>
                </tr>
            </tbody>
        </table>
        ${attachment}
    </body>
    </html>`
    sendEmail(data.BL,html)
}

const getContainerData = async (bL,containerNo,pool) => {
    const transaction = await sql.getTransaction(pool);
    return new Promise((resolve,reject) => {
        try{
            transaction.begin((err) => {
                if(err){
                    console.log("pool",err)
                    reject()
                }
                pool.request()
                .input("BL",bL)
                .input("ContainerNo",containerNo)
                .execute(MALTRANS_GET_CONTAINER_INFO_PROCEDURE,(err,result) => {
                    if(err){
                        console.log('excute',err)
                        reject()
                    }
                    transaction.commit((err) => {
                        if(err){
                            console.log('transaction error : ',err)
                            reject()
                        }
                        resolve(result.recordset);
                    });
                })
            })
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const startContainerTransaction = async (data,pool) => {
    const transaction = await sql.getTransaction(pool);
    return new Promise((resolve,reject) => {
        try{
            transaction.begin((err) => {
                if(err){
                    console.log("pool",err)
                    reject()
                }
                pool.request()
                .input("BL",data.bL)
                .input("ContainerNo",data.containerNo)
                .input("DriverName",data.driverName)
                .input("DriverMobile",data.driverNumber)
                .input("TruckNo",data.truckNumber)
                .input("ShippingCompany",data.shippingName)
                .input("Notes",data.note)
                .input("UserName",data.username)
                .execute(MALTRANS_SAVE_CONTAINER_INFO_PROCEDURE,(err,result) => {
                    if(err){
                        console.log('excute',err)
                        reject()
                    }
                    transaction.commit((err) => {
                        if(err){
                            console.log('transaction error : ',err)
                            reject()
                        }
                        resolve();
                    });
                })
            })
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const getTruckInfo = async (data,pool) => {
    const transaction = await sql.getTransaction(pool);
    return new Promise((resolve,reject) => {
        try{
            transaction.begin((err) => {
                if(err){
                    console.log("pool",err)
                    reject()
                }
                pool.request()
                .input("TruckNo",data.truckNo)
                .execute(MSSQL_TRUCK_INFO,(err,result) => {
                    if(err){
                        console.log('excute',err)
                        reject()
                    }
                    transaction.commit((err) => {
                        if(err){
                            console.log('transaction error : ',err)
                            reject()
                        }
                        resolve(result.recordset);
                    });
                })
            })
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const saveTruckStatus = async (data,pool) => {
    const transaction = await sql.getTransaction(pool);
    return new Promise((resolve,reject) => {
        try{
            transaction.begin((err) => {
                if(err){
                    console.log("pool",err)
                    reject()
                }
                pool.request()
                .input("Truckno",data.truckNo)
                .input("Status",data.status)
                .execute(MSSQL_TRUCK_STATUS,(err,result) => {
                    if(err){
                        console.log('excute',err)
                        reject()
                    }
                    transaction.commit((err) => {
                        if(err){
                            console.log('transaction error : ',err)
                            reject()
                        }
                        resolve();
                    });
                })
            })
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const checkUser = async (username,password) => {
    try{
        const pool = await sql.getSQL();
        if(pool){
            const user = await pool.request().query(`select * from ${MSSQL_SUPERVISORS_USER_TABLE} where username = '${username}' and password = '${password}'`)
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

const getBranches = async(info) => {
    if(info.roleNo == 0 || info.warehouses == 'allrayhan'){
        let whs = await hana.getWhsNames()
        whs = whs.map(rec => {
            return {
                whsName:rec.WhsName,
                location:locations[`${rec.WhsCode}`]
            }
        }).filter(rec => rec.location)
        return whs
    }else{
        const arr = info.warehouses.split('-')
        let whs = await hana.getWhsNames()
        whs = whs.filter(rec => arr.includes(rec.WhsCode))
        whs = whs.map(rec => {
            return {
                whsName:rec.WhsName,
                location:locations[`${rec.WhsCode}`]
            }
        })
        return whs
    }
}

const getCategories = async (info) => {
    try{
        const pool = await sql.getSQL();
        if(pool){
            const user = await pool.request().query(`select * from ${MSSQL_CHECK_LIST_QUESTIONS} where status = 'active' and roleNo = ${info.roleNo}`)
            .then(result => {
                pool.close();
                let mappedResult = []
                let categoriesList = {}
                result.recordset.forEach(rec => {
                    const keys = Object.keys(categoriesList)
                    if(keys.includes(rec.category)){
                        const id = mappedResult[categoriesList[`${rec.category}`]].questions.length
                        mappedResult[categoriesList[`${rec.category}`]].questions.push({
                            id: id,
                            max: rec.noOfQuestions,
                            score: 0,
                            qCode: rec.qCode,
                            question: rec.question,
                            maxGrade: rec.maxGrade,
                            qID:rec.ID,
                            answers:[]
                        })
                    }else{
                        const id = mappedResult.length
                        categoriesList[`${rec.category}`] = id
                        mappedResult.push({
                            id: id,
                            max: rec.noOfCategories,
                            total: 0,
                            maxTotal: rec.categoryTotal,
                            name: rec.category,
                            questions: [
                                {
                                    id: 0,
                                    max: rec.noOfQuestions,
                                    score: 0,
                                    qCode: rec.qCode,
                                    question: rec.question,
                                    maxGrade: rec.maxGrade,
                                    qID:rec.ID,
                                    answers:[]
                                }
                            ]
                        })
                    }
                })
                mappedResult = mappedResult.map(cat => {
                    const id = cat.questions.length
                    const max = cat.questions[0].max
                    cat.questions.push({
                        id: id,
                        max: max,
                        note: "",
                    })
                    return cat
                })
                return mappedResult;
            })
            return user
        }else{
            return
        }
    }catch(err){
        return
    }
}

const getQuesAnswers = async(info,categories) =>{
    try{
        const pool = await sql.getSQL();
        if(pool){
            const answers = await pool.request().query(`select * from ${MSSQL_RATE_QUESTIONS_ANSWERS} where status = 'active' and roleNo = ${info.roleNo} order by qID`)
            .then(result => {
                pool.close();
                let answersList = {}
                result.recordset.forEach(rec => {
                    const keys = Object.keys(answersList)
                    if(keys.includes(`${rec.qID}`)){
                        answersList[`${rec.qID}`].push(rec.answer)
                    }else{
                        answersList[`${rec.qID}`] = ['لا يوجد',rec.answer]
                    }
                })
                categories.forEach(cat => {
                    cat.questions.forEach(question => {
                        question.answers = answersList[`${question.qID}`]
                    })
                })
            })
            return answers
        }else{
            return
        }
    }catch(err){
        return
    }
}

const getTrainCategories = async () => {
    try{
        const pool = await sql.getSQL();
        if(pool){
            const user = await pool.request().query(`select * from ${MSSQL_TRAIN_LIST_QUESTIONS} where status = 'active'`)
            .then(result => {
                pool.close();
                let mappedResult = []
                let categoriesList = {}
                result.recordset.forEach(rec => {
                    const keys = Object.keys(categoriesList)
                    if(keys.includes(rec.category)){
                        const id = mappedResult[categoriesList[`${rec.category}`]].questions.length
                        mappedResult[categoriesList[`${rec.category}`]].questions.push({
                            id: id,
                            max: rec.noOfQuestions,
                            score: 'n',
                            qCode: rec.qCode,
                            question: rec.question,
                            maxGrade: rec.maxGrade,
                            note:''
                        })
                    }else{
                        const id = mappedResult.length
                        categoriesList[`${rec.category}`] = id
                        mappedResult.push({
                            id: id,
                            max: rec.noOfCategories,
                            total: 0,
                            maxTotal: rec.categoryTotal,
                            name: rec.category,
                            questions: [
                                {
                                    id: 0,
                                    max: rec.noOfQuestions,
                                    score: 'n',
                                    qCode: rec.qCode,
                                    question: rec.question,
                                    maxGrade: rec.maxGrade,
                                    note:''
                                }
                            ]
                        })
                    }
                })
                return mappedResult;
            })
            return user
        }else{
            return
        }
    }catch(err){
        return
    }
}

const getID = async(path) => {
    try {
        let no = fs.readFileSync(path, 'utf8');
        const rateID = 'r-' + no
        no = parseInt(no) + 1
        no = no.toString()
        fs.writeFileSync(path, no);
        return rateID
    } catch (err) {
        console.log(err)
    }
}

const saveCatRecord = async(category,rateID,pool,info,rateScore) =>{
    return new Promise((resolve,reject) => {
        try{
            const start = async() => {
                const transaction = await sql.getTransaction(pool);
                const request = await sql.getrequest(transaction)
                transaction.begin(err => {
                    if(err){
                        console.log('transaction begin',err)
                        reject()
                    }
                    if(request){
                        return request.query(
                        `insert into ${MSSQL_RATE_GENERAL_INFO} 
                        (
                            rateID,
                            branch,
                            noOfEmployees,
                            names,
                            category,
                            categoryScore,
                            note,
                            ratedate,
                            rateScore,
                            noOfQuestions,
                            username,
                            longitude,
                            latitude
                        ) 
                        values 
                        (
                            N'${rateID}',
                            N'${info.branch}',
                            ${info.noOfEmployees},
                            N'${info.names}',
                            N'${category.name}',
                            ${parseFloat(category.total*100/category.maxTotal).toFixed(3)},
                            N'${category.note}',
                            '${new Date(info.date).toISOString().split('T')[0]}',
                            ${rateScore},
                            ${category.questions.length},
                            N'${info.username}',
                            N'${info.long}',
                            N'${info.lat}'
                        )`
                        , (err, result) => {
                            if(err){
                                console.log('request query',err)  
                                reject()
                            }    
                            transaction.commit(err => {
                                if(err){
                                    console.log('request query',err)
                                    reject()
                                }else{
                                    resolve(true)
                                }  
                            })
                        })
                    }else{
                        reject()
                    }
                })
            }
            start()
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const saveQuestions = async(question,rateID,pool,info,catName) => {
    return new Promise((resolve,reject) => {
        try{
            const start = async () => {
                const transaction = await sql.getTransaction(pool);
                const request = await sql.getrequest(transaction)
                return transaction.begin(err => {
                    if(err){
                        console.log('transaction begin',err)
                        reject()
                    }
                    if(request){
                        return request.query(
                        `insert into ${MSSQL_RATE_QUESTIONS_SCORES} 
                        (
                            rateID,
                            qCode,
                            question,
                            category,
                            score,
                            maxGrade,
                            branch,
                            ratedate,
                            note
                        ) 
                        values 
                        (
                            N'${rateID}',
                            N'${question.qCode}',
                            N'${question.question}',
                            N'${catName}',
                            ${question.score},
                            ${question.maxGrade},
                            N'${info.branch}',
                            '${new Date(info.date).toISOString().split('T')[0]}',
                            N'${question.note}'
                        )`
                        , (err, result) => {
                            if(err){
                                console.log('request query',err)  
                                reject()
                            }    
                            transaction.commit(err => {
                                if(err){
                                    console.log('request query',err)
                                    reject()
                                }else{
                                    resolve()
                                }  
                            })
                        })
                    }else{
                        reject()
                    }
                })
            }
            start()
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const saveCategory = async(category,rateID,pool,info,rateScore) => {
    return new Promise((resolve,reject) => {
        try{
            const start = async() => {
                category.questions.pop()
                const quesLength = category.questions.length
                const quesArr = []
                category.note = category.note? category.note : 'لا يوجد'
                const isSaved = await saveCatRecord(category,rateID,pool,info,rateScore)
                .then(() => {
                    return true
                }).catch(() => {
                    return false
                })
                if(isSaved){
                    category.questions.forEach(question => {
                        question.note = question.note? question.note : 'لا يوجد'
                        saveQuestions(question,rateID,pool,info,category.name)
                        .then(() => {
                            quesArr.push('done')
                            if(quesArr.length == quesLength){
                                resolve()
                            }
                        }).catch(() => {
                            reject()
                        })
                    })
                }else{
                    reject()
                }
            }
            start()
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const getNames = (names) => {
    let str = ''
    names.forEach(name => {
        str += name.name
        str += '-'
    })
    return str
}

const saveImagePath = async(rateID,path,pool) => {
    return new Promise((resolve,reject) => {
        try{
            const start = async () => {
                const transaction = await sql.getTransaction(pool);
                const request = await sql.getrequest(transaction)
                return transaction.begin(err => {
                    if(err){
                        console.log('transaction begin',err)
                        resolve()
                    }
                    if(request){
                        return request.query(
                        `insert into ${MSSQL_RATE_IMAGES_PATH} 
                        (
                            rateID,
                            rateImagePath
                        ) 
                        values 
                        (
                            N'${rateID}',
                            N'${path}'
                        )`
                        , (err, result) => {
                            if(err){
                                console.log('request query',err)  
                                resolve()
                            }else{
                                transaction.commit(err => {
                                    if(err){
                                        console.log('request query',err)
                                        resolve()
                                    }else{
                                        resolve()
                                    }  
                                })
                            }    
                        })
                    }else{
                        resolve()
                    }
                })
            }
            start()
        }catch(err){
            console.log(err)
            resolve()
        }
    })
}

const saveImages = async(files,rateID) => {
    const pool = await sql.getSQL();
    const promises = []
    for(let i = 0; i < files.length; i++){
        const file =files[i]
        fs.writeFileSync(`${IMAGE_FOLDER_PATH}/${rateID}_${file.originalname}.jpeg`, file.buffer);
        promises.push(saveImagePath(rateID,`${IMAGE_FOLDER_PATH}/${rateID}_${file.originalname}.jpeg`,pool))
    }
    return Promise.all(promises).then(() => {
        pool.close()
    })
}

const saveCategoriesRate = async(data,rateID) => {
    return new Promise((resolve,reject) => {
        try{
            const start = async() => {
                const pool = await sql.getSQL();
                const categories = data.allCatData
                const total = categories.reduce((acc,cat) => acc + cat.total,0)
                const maxTotal = categories.reduce((acc,cat) => acc + cat.maxTotal,0)
                const rateScore = parseFloat(total*100/maxTotal).toFixed(3)
                const info = {
                    username:data.username,
                    branch:data.branchValue,
                    names:getNames(data.names),
                    noOfEmployees:data.names.length,
                    date:data.date,
                    long:data.long,
                    lat:data.lat
                }
                const arr = []
                const length = categories.length
                categories.forEach(cat => {
                    saveCategory(cat,rateID,pool,info,rateScore)
                    .then(() => {
                        arr.push('done')
                        if(arr.length == length){
                            pool.close()
                            resolve()
                        }
                    }).catch(() => {
                        reject()
                    })
                })
            }
            start()
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const saveInCustTable = async(data) => {
    return new Promise((resolve,reject) => {
        try{
            const start = async() => {
                const pool = await sql.getSQL();
                saveRecordInCustTable(data,pool)
                .then((uniqueValue) => {
                    resolve(uniqueValue)
                    pool.close()
                })
                .catch(() => {
                    reject()
                })
            }
            start()
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const saveRecordInCustTable = async(data,pool) => {
    return new Promise((resolve,reject) => {
        try{
            const start = async () => {
                const uniqueValue = (new Date()).toISOString().split('T')[0] + data.phoneNo
                const transaction = await sql.getTransaction(pool);
                const request = await sql.getrequest(transaction)
                return transaction.begin(err => {
                    if(err){
                        console.log('transaction begin',err)
                        reject()
                    }
                    if(request){
                        return request.query(
                        `insert into ${MSSQL_CUSTOMER_RATING_TABLE} 
                        (
                            branchName,
                            username,
                            phoneNumber,
                            serviceLevel,
                            smsMsgID
                        ) 
                        values 
                        (
                            N'${data.branch}',
                            N'${data.userName}',
                            N'${data.phoneNo}',
                            N'${data.serviceLevelValue}',
                            N'${uniqueValue}'
                        )`
                        , (err, result) => {
                            if(err){
                                console.log('request query',err)  
                                reject()
                            }    
                            transaction.commit(err => {
                                if(err){
                                    console.log('request query',err)
                                    reject()
                                }else{
                                    resolve(uniqueValue)
                                }  
                            })
                        })
                    }else{
                        reject()
                    }
                })
            }
            start()
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const saveMsg = async (msg,pool,uniqueValue) => {
    return new Promise((resolve,reject) => {
        try{
            const start = async () => {
                let id = ''
                if(msg != "Invalid Mobile Number"){
                    const arr = msg.split(' ')
                    id = arr[arr.length - 1]
                }else{
                    id = msg
                }
                const transaction = await sql.getTransaction(pool);
                const request = await sql.getrequest(transaction)
                return transaction.begin(err => {
                    if(err){
                        console.log('transaction begin',err)
                        reject()
                    }
                    if(request){
                        return request.query(
                        `update ${MSSQL_CUSTOMER_RATING_TABLE} set smsMsgID = '${id}' where smsMsgID = '${uniqueValue}'`
                        , (err, result) => {
                            if(err){
                                console.log('request query',err)  
                                reject()
                            }    
                            transaction.commit(err => {
                                if(err){
                                    console.log('request query',err)
                                    reject()
                                }else{
                                    resolve()
                                }  
                            })
                        })
                    }else{
                        reject()
                    }
                })
            }
            start()
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const sendMsg = async(data,uniqueValue) => {
    let msg = ''
    switch(data.serviceLevelValue){
        case `راضي`:
            msg = 'شكرا لزيارتك الريحان. نتمنى لك يوما سعيدا'
            break;
        case `غير راضي`:
            msg = 'شكرا لزيارتك الريحان. سيتم التواصل معك قريبا لمعرفة كيف كانت تجربتك بفرع الريحان'
            break;
        case `غير مدخل`:
            msg = 'شكرا لزيارتك الريحان. نتمنى لك يوما سعيدا'
            break;
    }
    const params = new URLSearchParams();
    params.append('senderid', JORMAL_SERNDERID);
    params.append('numbers', data.phoneNo);
    params.append('accname', JORMAL_ACCNAME);
    params.append('AccPass', JORMAL_ACCPASS);
    params.append('msg', msg);
    await axios({
        url:'https://josmsservice.com/SMSServices/Clients/Prof/RestSingleSMS/SendSMS',
        params,
        method:'get'
    })
    .then(response => {
        const start = async() => {
            const pool = await sql.getSQL();
            saveMsg(response.data,pool,uniqueValue)
            .then(() => {
                pool.close()
            })
            .catch(() => {})
        }
        start()
    })
    .catch(err => {})
}

const getTimeFormat = (time) => {
    let hours = time.getHours();
    let minutes = time.getMinutes();
    let ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    let strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

const saveVisitQuestions = async(question,visitID,pool,info,catName) => {
    return new Promise((resolve,reject) => {
        try{
            const start = async () => {
                const transaction = await sql.getTransaction(pool);
                const request = await sql.getrequest(transaction)
                return transaction.begin(err => {
                    if(err){
                        console.log('transaction begin',err)
                        reject()
                    }
                    if(request){
                        return request.query(
                        `insert into ${MSSQL_TRAIN_QUESTIONS_SCORES} 
                        (
                            visitID,
                            qCode,
                            question,
                            category,
                            score,
                            maxGrade,
                            note
                        ) 
                        values 
                        (
                            N'${visitID}',
                            N'${question.qCode}',
                            N'${question.question}',
                            N'${catName}',
                            ${question.score},
                            ${question.maxGrade},
                            N'${question.note}'
                        )`
                        , (err, result) => {
                            if(err){
                                console.log('request query',err)  
                                reject()
                            }    
                            transaction.commit(err => {
                                if(err){
                                    console.log('request query',err)
                                    reject()
                                }else{
                                    resolve()
                                }  
                            })
                        })
                    }else{
                        reject()
                    }
                })
            }
            start()
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const saveVisitCatRecord = async(category,visitID,pool,info,visitScore) =>{
    return new Promise((resolve,reject) => {
        try{
            const start = async() => {
                const transaction = await sql.getTransaction(pool);
                const request = await sql.getrequest(transaction)
                transaction.begin(err => {
                    if(err){
                        console.log('transaction begin',err)
                        reject()
                    }
                    if(request){
                        return request.query(
                        `insert into ${MSSQL_TRAIN_GENERAL_INFO} 
                        (
                            visitID,
                            branch,
                            visitorName,
                            supervisorName,
                            category,
                            categoryScore,
                            visitDate,
                            visitStartTime,
                            visitFinishTime,
                            visitScore,
                            noOfQuestions,
                            favourite,
                            username
                        ) 
                        values 
                        (
                            N'${visitID}',
                            N'${info.branch}',
                            N'${info.visitorName}',
                            N'${info.supervisorName}',
                            N'${category.name}',
                            ${parseFloat(category.total*100/category.maxTotal).toFixed(2)},
                            '${new Date(info.date).toISOString().split('T')[0]}',
                            N'${getTimeFormat(new Date(info.date))}',
                            N'${getTimeFormat(new Date(Date.now()))}',
                            ${visitScore},
                            ${category.questions.length},
                            N'${info.favourite}',
                            N'${info.username}'
                        )`
                        , (err, result) => {
                            if(err){
                                console.log('request query',err)  
                                reject()
                            }    
                            transaction.commit(err => {
                                if(err){
                                    console.log('request query',err)
                                    reject()
                                }else{
                                    resolve(true)
                                }  
                            })
                        })
                    }else{
                        reject()
                    }
                })
            }
            start()
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const saveVisitCategory = async(category,visitID,pool,info,visitScore) => {
    return new Promise((resolve,reject) => {
        try{
            const start = async() => {
                const quesLength = category.questions.length
                const quesArr = []
                const isSaved = await saveVisitCatRecord(category,visitID,pool,info,visitScore)
                .then(() => {
                    return true
                }).catch(() => {
                    return false
                })
                if(isSaved){
                    category.questions.forEach(question => {
                        saveVisitQuestions(question,visitID,pool,info,category.name)
                        .then(() => {
                            quesArr.push('done')
                            if(quesArr.length == quesLength){
                                resolve()
                            }
                        }).catch(() => {
                            reject()
                        })
                    })
                }else{
                    reject()
                }
            }
            start()
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const saveCategoriesReport = async(data) => {
    return new Promise((resolve,reject) => {
        try{
            const start = async() => {
                const pool = await sql.getSQL();
                const visitID = await getID('./visitID.txt')
                const categories = data.allCatData
                const total = categories.reduce((acc,cat) => acc + cat.total,0)
                const maxTotal = categories.reduce((acc,cat) => acc + cat.maxTotal,0)
                const visitScore = parseFloat(total*100/maxTotal).toFixed(2)
                const info = {
                    username:data.username,
                    branch:data.branchValue,
                    supervisorName:data.names.supervisor,
                    visitorName:data.names.vistor,
                    date:data.date,
                    favourite:data.favourite,
                }
                const arr = []
                const length = categories.length
                categories.forEach(cat => {
                    saveVisitCategory(cat,visitID,pool,info,visitScore)
                    .then(() => {
                        arr.push('done')
                        if(arr.length == length){
                            pool.close()
                            resolve()
                        }
                    }).catch(() => {
                        reject()
                    })
                })
            }
            start()
        }catch(err){
            console.log(err)
            reject()
        }
    })
}

const searchBarcodes = async(itemName,partner) => {
    return new Promise((resolve,reject) => {
        const start = async() => {
            try{
                const pool = await sql.getSQL();
                if(pool){
                    await getBarcodes(itemName,partner,pool)
                    .then(results => {
                        pool.close()
                        resolve(results)
                    })
                    .catch(() => {
                        pool.close()
                        reject()
                    })
                }
            }catch(err){
                console.log(err)
                reject()
            }

        }
        start()
    })
}

const getBarcodes = async(itemName,partner,pool) => {
    return new Promise((resolve,reject) => {
        const start = async() => {
            try{
                const transaction = await sql.getTransaction(pool);
                transaction.begin((err) => {
                    if(err){
                        console.log("pool",err)
                        reject()
                    }
                    pool.request()
                    .input("ItemDesc",itemName)
                    .input("Partner",partner)
                    .execute(MSSQL_BARCODE_SEARCH,(err,result) => {
                        if(err){
                            console.log('excute',err)
                            reject()
                        }
                        transaction.commit((err) => {
                            if(err){
                                console.log('transaction error : ',err)
                                reject()
                            }
                            resolve(result);
                        });
                    })
                })
            }catch(err){
                console.log(err)
                reject()
            }

        }
        start()
    })
}

const getPartners = async() => {
    try{
        const pool = await sql.getSQL();
        const partners = await pool.request().query(`Select Distinct Partner from ${MSSQL_PARTNERS}`)
        .then(result => {
            pool.close();
            return result.recordset.map(rec => rec.Partner);
        })
        return {
            partners,
            msg:'success'
        }
    }catch(err){
        return {
            partners:[],
            msg: 'الرجاء المحاولة مرة اخرى'
        }
    }
}

const getActions = (customCenter,isTransportor) => {
    const actionArr = []
    if(customCenter == 'عمان'){
        actionArr.push('استلام صورة ملونة عن المستندات')
        actionArr.push('فتح عملية')
        actionArr.push('استلام المستندات الأصل وارسالها للعقبة')
        actionArr.push('استلام إذن تسليم')
        actionArr.push('تفعيل إذن التسليم')
    }else if(customCenter == 'العقبة'){
        actionArr.push('تنظيم البيان')
        actionArr.push('تخمين البيان')
        actionArr.push('استلام موافقة على البيان مع عدم الدفع')
        actionArr.push('دفع البيان')
        actionArr.push('طلب سيارات من الناقل')
        actionArr.push('النتائج')
        actionArr.push('إنجاز')
    }
    if(isTransportor){
        actionArr.push('تحميل من الميناء')
        actionArr.push('معاينة مع عينة')
        actionArr.push('معاينة بدون عينة')
        actionArr.push('تصريح الخروج')
    }
    return actionArr
}

const getCustomCenter = () => {
    return ["جمرك عمان","جمرك المطار","جمرك سحاب","جمرك العقبة"]
}

module.exports = {
    fetchRates,
    authentication,
    create,
    getUser,
    savePdf,
    executeTransSql,
    convertTime,
    sendMaltransEmail,
    checkUser,
    getBranches,
    getCategories,
    saveCategoriesRate,
    saveInCustTable,
    getTrainCategories,
    saveCategoriesReport,
    sendMsg,
    getID,
    saveImages,
    searchBarcodes,
    getQuesAnswers,
    getActions,
    getCustomCenter,
    getPartners
}