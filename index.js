const express = require('express');
const mysql = require('mysql');
const path = require('path');
const bodyParser = require('body-parser');
const { error } = require('console');

const app = express();
const port = 4000;

const con = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'karje_hasana'
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static(path.join(__dirname,'static')));

//insert data
app.post('/api/signup',(req,res)=>{
    const {user_name,full_name,joining_date,address,city,email,pass} = req.body; 
    let query = 'insert into members values(?,?,?,?,?,?,?)';
    const values = [user_name,full_name,joining_date,address,city,email,pass];

    console.log(user_name+" "+full_name+" "+joining_date+" "+address+" "+city+" "+email+" "+pass);
    con.query(query,values,(error,results,fields)=>{
        if(error) {
            res.sendStatus(500);
            console.log("error");
        }
        else{
            res.sendStatus(200);
            console.log("ok");
        }
    })
});
app.post('/api/login',(req,res)=>{//check login info and verify it
    const user_name = req.body.user_name;
    const pass = req.body.pass;
    let query = 'select * from members where memberUser_name=? and pass=?';
    const values = [user_name,pass];

    con.query(query,values,(error,results,feilds)=>{
        if(error){
            res.sendStatus(500);
            
        }
        else{
            if(results.length==0){
                res.sendStatus(401);//wrong user_name or pass
            }
            else{
                user=results[0];
                res.sendStatus(200);
            }
        }
    })
});

//read data
app.get('/api/profile/:user_name',(req,res)=>{//show profile after sending user_name in URL parameter
    const user_name=req.params.user_name;
    //console.log(results);
    let query = `select memberUser_name,full_name,joining_date,address,city,email,deposit `+
    `from members,(select user_name,sum(amount)as deposit `+
    `from transactiontable `+
    `where user_name=? and (type = 1 or type = 2) `+
    `GROUP BY user_name) temp `+
    `where members.memberUser_name=temp.user_name;`

    con.query(query,[user_name],(error,results,fields)=>{
        if(error){
            res.sendStatus(500);
            console.log("Failed");
        }
        else{
            res.json(results);
            
        }
    })
    
});

app.post('/api/deposit',(req,res)=>{//only to handle deposit
    /*
    when type = 1 => deposit
    when type = 2 => withdraw
    when type = 3 => loan 
    when type = 4 => return loan
    */
    const {type,user_name,amount,TRANSACTION_date,TRANSACTION_time} = req.body;
    let query='insert into transactiontable values(?,?,?,?,?)';
    const values = [type,user_name,amount,TRANSACTION_date,TRANSACTION_time];
    con.query(query,values,(error,results,fields)=>{
        if(error){
            res.sendStatus(500);
        }
        else{
            res.sendStatus(200);
        }
    })
});

app.get('/api/tranHis/:user_name',(req,res)=>{//transaction history of a user_name
    const user_name = req.params.user_name;
    let query = 'select * from transactiontable where user_name=?;'

    con.query(query,[user_name],(error,results)=>{
        if(error){
            res.sendStatus(500);
        }
        else{
            res.json(results);
            console.log(results);
        }
    });
});

app.post('/api/donate',(req,res)=>{//insert donation
    const {user_name,donation_amount,donation_date} = req.body;
    let query = 'insert into donation values(?,?,?)';
    const values = [user_name,donation_amount,donation_date];

    con.query(query,values,(error,results,fields)=>{
        if(error){
            res.sendStatus(500);
            console.log(error);
        }
        else{
            res.sendStatus(200);
        }
    });
});

app.post('/api/checkWithdraw',(req,res)=>{//this will check if the user can withdraw or not
    const user_name = req.body.user_name;
    const amount = req.body.amount;
    //console.log(req.body);
    let query = 'select user_name,sum(amount)as deposit '+
    'from transactiontable '+
    'where user_name=? and (type = 1 or type = 2) '+
    'GROUP BY user_name;'

    con.query(query,[user_name],(error,results,fields)=>{
        //console.log(results);
        if(error){
            res.sendStatus(500);
            //console.log(error);
        }
        else{
            if(results[0].deposit>=amount){
                res.sendStatus(200);
                
            }
            else{
                res.sendStatus(404);
                //res.json(results);
            }
        }
    });
});

app.post('/api/withdraw',(req,res)=>{//only to handle withdraw
    let {type,user_name,amount,TRANSACTION_date,TRANSACTION_time} = req.body;
    amount*=(-1);
    let query='insert into transactiontable values(?,?,?,?,?)';
    const values = [type,user_name,amount,TRANSACTION_date,TRANSACTION_time];
    con.query(query,values,(error,results,fields)=>{
        if(error){
            res.sendStatus(500);
        }
        else{
            res.sendStatus(200);
        }
    })
});

app.post('/api/checkAdmin',(req,res)=>{//check if the user is admin or not
    const user_name = req.body.user_name;
    let query = 'select * from admin where adminUser_name = ?';
    
    con.query(query,[user_name],(error,results,fields)=>{
        if(error){
            res.sendStatus(500);
        }
        else{
            if(results.length==0){
                res.sendStatus(404);
            }
            else{
                res.sendStatus(200);
            }
        }
    });
});

app.get('/api/adminInfo/:user_name',(req,res)=>{//show admin information
    const user_name = req.params.user_name;
    let query = 'select * from admin where adminUser_name=?';
    con.query(query,[user_name],(error,results,fields)=>{
        if(error){
            res.sendStatus(500);
        }
        else{
            res.json(results);
        }
    });
});

app.post('api/checkLoaninfo',(req,res)=>{//check if the user has paid debt or not
    const user_name = req.body.user_name;
    const return_date = req.body.return_date;
    let query = 'select * from loan where user_name=?';
    
    con.query(query,[user_name],(error,results,fields)=>{
        if(error){
            res.sendStatus(500);
        }
        else{
            if(results[0].return_date<return_date){
                res.sendStatus(404);
            }
            else{
                res.sendStatus(200);
            }
        }
    });
});

app.post('/api/takeLoan',(req,res)=>{//insert loan info
    const {user_name,jimmadar1,jimmadar2,issue_date,return_date,amount} = req.body;
    let query = 'insert into loan values(?,?,?,?,?,?)';
    const values = [user_name,jimmadar1,jimmadar2,issue_date,return_date,amount];

    con.query(query,values,(error,results,fields)=>{
        if(error){
            res.sendStatus(500);
        }
        else{
            res.sendStatus(200);
        }
    });
});

app.get('api/showLoan/:user_name',(req,res)=>{//show loan information
    const user_name = req.params.user_name;
    let query = 'select * from loan where user_name=?';

    con.query(query,[user_name],(error,results,fields)=>{
        if(error){
            res.sendStatus(500);
        }
        else{
            res.json(results);
        }
    });
});

//delete data
app.delete('/api/deleteLoan/:user_name',(req,res)=>{//delete info from loan table after clearing debt
    const user_name = req.params.user_name;
    let query = 'delete from loan where user_name=?';

    con.query(query,[user_name],(error,results,fields)=>{
        if(error){
            res.sendStatus(500);
        }
        else{
            res.sendStatus(200);
        }
    });
});

app.listen(port,()=>{
    console.log(`app is listening to port ${port}`);
});