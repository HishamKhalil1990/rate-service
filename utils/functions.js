require('dotenv').config()
const api = require('./apis')
const prisma = require('./prisma')
const jwt = require("jsonwebtoken");
const sql = require('./sql')
const fs = require('fs')
const sendEmail = require('./email')

const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY
const MALTRANS_USERS_TABLE = process.env.MALTRANS_USERS_TABLE
const PDF_FOLDER_PATH = process.env.PDF_FOLDER_PATH
const MSSQL_MALTRANS_SUBMIT_PROCEDURE = process.env.MSSQL_MALTRANS_SUBMIT_PROCEDURE
const MALTRANS_HISTORY_TABLE = process.env.MALTRANS_HISTORY_TABLE
const MALTRANS_SUBMIT_TABLE = process.env.MALTRANS_SUBMIT_TABLE
const MALTRANS_GET_CONTAINER_INFO_PROCEDURE = process.env.MALTRANS_GET_CONTAINER_INFO_PROCEDURE
const MALTRANS_SAVE_CONTAINER_INFO_PROCEDURE = process.env.MALTRANS_SAVE_CONTAINER_INFO_PROCEDURE
const MSSQL_TRUCK_INFO = process.env.MSSQL_TRUCK_INFO
const MSSQL_TRUCK_STATUS = process.env.MSSQL_TRUCK_STATUS

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
                        console.log("Transaction committed.");
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
                        console.log("Transaction committed.");
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
                        console.log("Transaction committed.");
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
                .input("ContainerID",data.containerNo)
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
                        console.log("Transaction committed.");
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
                        console.log("Transaction committed.");
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
                        console.log("Transaction committed.");
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

module.exports = {
    fetchRates,
    authentication,
    create,
    getUser,
    savePdf,
    executeTransSql,
    convertTime,
    sendMaltransEmail
}