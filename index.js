const express = require('express');
const mysql = require('mysql');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require("cors")

const app = express();
const port = 4000;

const database = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'karze_hasana'
});

// cross origin issue
const allowedOrigins = ["http://localhost:3000", "https://korze-hasan-frontend.vercel.app"]

app.use(
    cors({
        origin: allowedOrigins,
    })
)

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'static')));









// sign up
app.post('/api/signup', (req, res) => {
    const { user_name, full_name, joining_date, address, city, email, pass } = req.body;
    let query = 'insert into members values(?,?,?,?,?,?,?)';
    const values = [user_name, full_name, joining_date, address, city, email, pass];

    console.log(user_name + " " + full_name + " " + joining_date + " " + address + " " + city + " " + email + " " + pass);
    database.query(query, values, (error) => {
        if (error) {
            res.status(500).send({
                message: "Something went wrong!"
            });
        }
        else {
            res.status(200).send({
                message: "Sign up successful!"
            });
        }
    })
});

// sign in
app.post('/api/login', (req, res) => {//check login info and verify it
    const user_name = req.body.username;
    const pass = req.body.pass;
    let query = 'select * from members where memberUser_name=? and pass=?';
    const values = [user_name, pass];

    database.query(query, values, (error, results) => {
        if (error) {
            res.status(500).send({
                message: "Something went wrong!"
            });
        }
        else {
            if (results.length == 0) {
                res.status(401).send({
                    message: "Invalid username or password!"
                });
            }
            else {
                user = results[0];
                user.user_name = user_name
                res.status(200).send({
                    message: "Sign in successful!",
                    result: user
                });
            }
        }
    })
});

// all transactions
app.get("/api/transactions/:user_name", (req, res) => {

    // get all transactions
    const GetTransactionsData = () => {
        const query = `select * from transactions`
        database.query(query, (error, result) => {
            if (error) {
                res.status(500).send({
                    message: "Something went wrong!"
                });
            }
            else {
                if (result.length == 0) {
                    res.status(404).send({
                        message: "No data found!"
                    });
                }
                else {
                    res.status(200).send({
                        message: "",
                        result
                    });

                }
            }
        })
    }

    // user access
    const UserAccess = () => {
        const user_name = req.params.user_name;
        let query = 'select * from members where memberUser_name=?';

        database.query(query, user_name, (error, result) => {
            if (error) {
                console.log(error)
                res.status(500).send({
                    message: "Something went wrong!"
                });
            }
            else {
                if (result.length == 0) {
                    res.status(500).send({
                        message: "Invalid username or password!"
                    });
                }
                else {
                    const user = result[0];
                    if (user.role === "admin") {
                        GetTransactionsData(req, res)
                    } else {
                        res.status(409).send({
                            message: "Ask to admin for confidential data!",
                        });
                    }

                }
            }
        })
    }

    UserAccess();
})

// donate
app.post("/api/transactions/donate", (req, res) => {

    const { amount, user_name } = req.body;

    // adding donation to db
    const AddDonation = (previousAmount, id) => {
        const date = new Date()
        const dataToSet = [id + 1, user_name, "donate", amount, amount + previousAmount, date.toLocaleDateString()]
        const query = 'insert into transactions values(?,?,?,?,?,?)';
        database.query(query, dataToSet, (error) => {
            if (error) {
                console.log(error)
                res.status(500).send({
                    message: "Something went wrong!"
                });
            }
            else {
                res.status(200).send({
                    message: "Donation successful!"
                });
            }
        })
    }

    // getting balance
    const GetAmount = () => {
        const query = `select * from transactions`

        database.query(query, (error, result) => {
            if (error) {
                res.status(500).send({
                    message: "Something went wrong!"
                });
            }
            else {
                if (result.length == 0) {
                    res.status(500).send({
                        message: "No data found!"
                    });
                }
                else {
                    const capital = result[result.length - 1].capital;
                    const id = result[result.length - 1].id;
                    if (capital, id) {
                        AddDonation(capital, id);
                    }
                }
            }
        })
    }

    // user access
    const UserAccess = () => {
        let query = 'select * from members where memberUser_name=?';

        database.query(query, user_name, (error, result) => {
            if (error) {
                res.status(500).send({
                    message: "Something went wrong!"
                });
            }
            else {
                if (result.length == 0) {
                    res.status(500).send({
                        message: "Invalid username or password!"
                    });
                }
                else {
                    const user = result[0];
                    if (user) {
                        GetAmount();
                    }
                }
            }
        })
    }

    UserAccess();
})

// loan
app.post("/api/transactions/loan", (req, res) => {

    const { amount, user_name } = req.body;

    // adding loan to db
    const AddLoan = (previousAmount, id) => {
        const date = new Date()
        const dataToSet = [id + 1, user_name, "loan", amount, previousAmount - amount, date.toLocaleDateString()]
        const query = 'insert into transactions values(?,?,?,?,?,?)';
        database.query(query, dataToSet, (error) => {
            if (error) {
                console.log(error)
                res.status(500).send({
                    message: "Something went wrong!"
                });
            }
            else {
                res.status(200).send({
                    message: "Loan successful!"
                });
            }
        })
    }

    // getting balance
    const GetAmount = () => {
        const query = `select * from transactions`

        database.query(query, (error, result) => {
            if (error) {
                res.status(500).send({
                    message: "Something went wrong!"
                });
            }
            else {
                if (result.length == 0) {
                    res.status(500).send({
                        message: "No data found!"
                    });
                }
                else {
                    const capital = result[result.length - 1].capital;
                    const id = result[result.length - 1].id;
                    if (capital && id) {

                        if (capital >= amount && capital > 2000) {
                            AddLoan(capital, id);
                        } else {
                            res.status(404).send({
                                message: "Not enough money!"
                            })
                        }
                    } else {
                        res.status(500).send({
                            message: "Something went wrong!"
                        });
                    }
                }
            }
        })
    }

    // user access
    const UserAccess = () => {
        let query = 'select * from members where memberUser_name=?';

        database.query(query, user_name, (error, result) => {
            if (error) {
                res.status(500).send({
                    message: "Something went wrong!"
                });
            }
            else {
                if (result.length == 0) {
                    res.status(500).send({
                        message: "Invalid username or password!"
                    });
                }
                else {
                    const user = result[0];
                    if (user) {
                        GetAmount();
                    }
                }
            }
        })
    }

    UserAccess();
})

// listening server
app.listen(port, () => {
    console.log(`app is listening to port ${port}`);
});