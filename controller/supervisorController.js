const axios = require('axios')
const sql =  require('../utils/sql')
const hana =  require('../utils/hana')

async function getSupervisorOrders(req,res){
    try{
        const {cardcode} = req.params
        hana.getSupervisorOrders(cardcode)
        .then(results => {
            res.send(results)
        })
        .catch(() => {
            res.send({msg : "error"})
        })
    }catch(err){
        res.send({msg : "error"})
    }
}

async function getSupervisorUsers(req,res){
    const client = await sql.getSQL()
    const getSupervisorUsers = 'select * from supervisorUsers';
    client.request().query(getSupervisorUsers).then(data => {
        client.close()
        res.send(data.recordset)
    }).catch(err => {
        console.log(err)
        res.send({
            status: 'failed',
            msg:"could not get all supervisor users due to server internal error, please try again"
        })
    });
}

function fetchSupervisorUsers(req,res){
    axios({
        baseURL:'https://alrayhan-rate.herokuapp.com',
        url: '/get-all-supervisor-user',
        method: 'get',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
    }).then(response => {
        const records = response.data
        let i = 0
        const start = async() => {
            for(i; i < records.length; i++){
                const rec = records[i];
                const data = {
                    username:rec.username,
                    password:rec.pass,
                    cardcode:rec.cardcode,
                    confirmPass:'P@$$word'
                }
                await axios({
                    baseURL:`http://localhost:3030/mobile`,
                    url: '/register-supervisor-user',
                    method: 'post',
                    headers: {
                      'Accept': 'application/json, text/plain, */*',
                      'Content-Type': 'application/json'
                    },
                    data: JSON.stringify(data)
                }).then((response) => {
                    if(i + 1 == records.length){
                        axios({
                            baseURL:`http://localhost:3030/mobile`,
                            url: '/get-all-supervisor-user',
                            method: 'get',
                            headers: {
                                'Accept': 'application/json, text/plain, */*',
                                'Content-Type': 'application/json'
                            },
                        }).then(response => {
                            res.send(response.data)
                        })
                    }
                })
            }
        }
        if(records.length != 0){
            start()
        }else{
            res.send('empty')
        }
    })
}

async function saveSupervisorUser(req,res){
    const client = await sql.getSQL()
    const {username, password,cardcode,confirmPass} = req.body;
    if(confirmPass == 'P@$$word'){
        const getSupervisorUser = `select * from supervisorUsers where username = '${username}'`;
        client.request().query(getSupervisorUser).then(data => {
            if(data.recordset[0]?.username == username){
                res.send({
                    status: 'failed',
                    msg:"username exists"
                })
            }else{
                const addUser = `insert into supervisorUsers (username,pass,cardcode) values ('${username}', '${password}', '${cardcode}')`;
                client.request().query(addUser).then(data => { 
                    res.send({
                        status: 'success',
                    })
                }).catch(err => {
                    console.log(err)
                    res.send({
                        status: 'failed',
                        msg:"could not save supervisor user due to server internal error, please try again"
                    })
                })
            }
            client.close()
        }).catch(err => {
            console.log(err)
            res.send({
                status: 'failed',
                msg:"could not save supervisor user due to server internal error, please try again"
            })
        });
    }else{
        res.send({
            status: 'failed',
            msg:"confirmation password is wrong"
        })
    }
}

async function updateSupervisorUser(req,res){
    const client = await sql.getSQL()
    const {username,newpass,newcode,confirmPass} = req.body;
    let updateSupervisorUser;
    if(newpass){
        updateSupervisorUser = `update supervisorUsers set pass='${newpass}' where username = '${username}'`
    }else if(newcode){
        if(confirmPass == 'P@$$word'){
            updateSupervisorUser = `update supervisorUsers set cardcode='${newcode}' where username = '${username}'`
        }else{
            res.send({
                status: 'failed',
                msg:"confirmation password is wrong"
            })
        }
    }
    client.request().query(updateSupervisorUser).then(data=>{
        client.close()
        res.send({
            status: 'success',
        });
    }).catch(err => {
        console.log(err)
        res.send({
            status: 'failed',
            msg:"could not update supervisor user due to server internal error, please try again"
        })
    });
}

async function deleteSupervisorUser(req,res){
    const client = await sql.getSQL()
    const {username} = req.body;
    const deleteSupervisorUser = `delete from supervisorUsers where username = '${username}'`
    client.request().query(deleteSupervisorUser).then(data=>{
        client.close()
        res.send({
            status: 'success',
        });
    }).catch(err => {
        console.log(err)
        res.send({
            status: 'failed',
            msg:"could not delete supervisor user due to server internal error, please try again"
        })
    });
}

async function checkSupervisorUser(req,res){
    const client = await sql.getSQL()
    const {username,password} = req.body;
    const checkSupervisorUser = `select * from supervisorUsers where username = '${username}'`;
    client.request().query(checkSupervisorUser).then(data => {
        client.close()
        if(data.recordset.length > 0){
            if(data.recordset[0].pass == password){
                res.send({
                    status: 'success',
                    data : {
                        username : data.recordset[0].username,
                        cardcode : data.recordset[0].cardcode
                    }
                })
            }else{
                res.send({
                    status: 'faild',
                })
            }
        }else{
            res.send({
                status: 'faild',
            })
        }
    }).catch(err => {
        console.log(err)
        res.send({
            status: 'faild',
        })
    });
}

module.exports = {
    getSupervisorOrders,
    getSupervisorUsers,
    fetchSupervisorUsers,
    saveSupervisorUser,
    updateSupervisorUser,
    deleteSupervisorUser,
    checkSupervisorUser
}