const express = require('express');
const router = express.Router();
const unirest = require("unirest"); //unirest is an http request library so any other preferred library can be used.

let Packages = require('../../models/packages');
const Transaction = require('../../models/transactions');
const config = require('../../config');
let validator = require('../../utils/validator'),
    Admin = require('../../models/admin_user'),
    User = require('../../models/user');

/*** END POINT FOR GETTING PERSONAL WALLET DETAILS BY CURRENTLY LOGGED IN USER */
router.get('/balance', function(req, res) {

    let id = req.user.id;
    User.findOne({_id: id}, function (err, user) {
        if(err){
            console.log(err)
            return res.badRequest('something unexpected happened')
        }
        if(!user){
            return res.badRequest('no user found with id provided')
        }

        res.success({balance: user.walletBalance})
    })
});

/*** END POINT FOR PAYING FROM WALLET BY CURRENTLY LOGGED IN USER */
router.post('/wallet', function(req, res) {

    let userId = req.user.id,
        expertId = req.body.expertId;

    let valid = validator.isCurrency(res, currency)&&
                validator.isAmount(res, amount)&&
                validator.isWord(res, expertId);
    if (!valid) return;

    console.log(userId, expertId, amount, currency);

    validAmount(expertId, function (err, info) {
        if (err) {
            return res.badRequest(err);
        }
        if (amount > info.chat.max.amount) {
            return res.badRequest("you are billing more than your package maximum allowed pricing of :" + info.chat.max.amount);
        }

        userVerify(userId, function (err, user) {
            if (err) {
                console.log(err);
                return res.badRequest(err);
            }
            if (amount > user.walletBalance.amount) {
                return res.badRequest('insufficient fund in wallet to perform this action')
            }

            createTransactionWallet(userId, expertId, amount, currency, function (errorMessage, userInfo) {
                if (errorMessage) {
                    res.badRequest(errorMessage);
                }
                console.log(userInfo);

                User.update(
                    {"_id": userId},
                    {$inc: {'walletBalance.amount': -amount}}, function (err, f) {
                        if (err) {
                            console.log(err);
                            return res.badRequest('something happened')
                        }
                        console.log(f + ' this is 1');
                    }
                );

                User.update(
                    {"_id": expertId},
                    {
                        $inc: {'walletBalance.amount': amount}
                    }, function (err, f) {
                        if (err) {
                            console.log(err);
                            return res.badRequest('something happened')
                        }

                        console.log(f + '  this is 2');

                        res.success('payment successful')
                    }
                );
            })
        })
    });
});

/*** END POINT FOR paying from wallet BY CURRENTLY LOGGED IN USER */
router.post('/card', function(req, res) {

    let userId = req.user.id,
        expertId = req.body.expertId,
        amount = req.body.amount,
        currency = req.body.currency;
    let txref = req.body.reference;
    if(typeof amount !== 'number' || amount === undefined){
        return res.badRequest('amount must be number and is required')
    }
    if (typeof(txref) !== 'string' || txref.trim() === 0) {
        return res.badRequest('Reference is required and cannot be empty');
    }

    let payload = {
        "SECKEY": config.rave,
        "txref": txref,
        "include_payment_entity": 1
    };

    let server_url = "https://ravesandboxapi.flutterwave.com/flwv3-pug/getpaidx/api/xrequery";
//please make sure to change this to production url when you go live

    // toRave(server_url, payload, function (errorMessage, response) {
    //     if (errorMessage) {
    //         res.badRequest(errorMessage);
    //     }
    validViewCost(expertId, function (err, info) {
        if (err) {
            return res.badRequest(err);
        }
        // if (amount > info.chat.max.amount) {
        //     return res.badRequest("you are billing more than your package maximum allowed pricing of :" + info.chat.max.amount);
        // }
        unirest.post(server_url)
            .headers({'Content-Type': 'application/json'})
            .send(payload)
            .end(function (response) {
                if (response.error) {
                    console.log(response.error);
                    return res.badRequest('something unexpected happened')
                }

                //check status is success.
                if (response.body.data[0].status === "successful" && response.body.data[0].chargecode === '00') {
                    if (response.body.data[0].amount === amount && response.body.data[0].currency === currency) {

                        let amountPaid = response.body.data[0].amount;
                        createWalletTransactionC(response, userId, expertId, function (errorMessage, userInfo) {
                            if (errorMessage) {
                                res.badRequest(errorMessage);
                            }

                            User.update(
                                {"_id": expertId},
                                {$inc: {'walletBalance.amount': amountPaid}}, function (err, f) {
                                    if (err) {
                                        console.log(err);
                                        return res.badRequest('something happened')
                                    }
                                    res.success('payment successful')
                                }
                            );
                        })
                    }
                }
                else {
                    return res.badRequest("transaction was not successful due to any of the reasons: currency or amount paid");
                }
            });
    });
});

function userVerify(userId, callback) {
    User.findOne({_id: userId}, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("no user found with this id");
        }

        return callback(null, user)
    })
}

function createTransactionCard(response, userId, expertId, callback) {
    let data ={
        'deposit.amount' : response.body.data[0].amount,
        'deposit.currency' : response.body.data[0].currency,
        status : response.body.data[0].status,
        reason : 'payment for chat with expert by direct payment',
        depositedBy : userId,
        receivedBy : expertId
    };

    Wallet.create(data, function (err, info) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        return callback(null, info)
    })
}

function createTransactionWallet(userId, expertId, amount, currency, callback) {

    let data = {
        'deposit.amount' : amount,
        'deposit.currency' : currency,
        status : 'successful',
        reason : 'payment for chat with expert from wallet',
        depositedBy : userId,
        receivedBy : expertId
    };

    Wallet.create(data, function (err, info) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        return callback(null, info)
    })
}

function validAmount(expertId, callback) {
    User.findOne({_id: expertId}, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user || user === null || user === undefined) {
            return callback("no user found with id provided");
        }
        Packages.findOne({plan: user.packageType}, function (err, pack) {
            if (err) {
                console.log(err);
                return callback("Something unexpected happened");
            }
            if (!pack || pack === undefined || pack === null) {
                return callback("no package found with that name");
            }
            // console.log(pack)

            return callback(null, pack)
        });
    })
}

function createWalletTransaction(response, userId, callback) {
    let data ={
        'deposit.amount' : response.body.data[0].amount,
        'deposit.currency' : response.body.data[0].currency,
        status : response.body.data[0].status,
        reason : 'wallet crediting',
        depositedBy : userId
    };

    Transaction.create(data, function (err, info) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        Admin.updateOne(
            {role: 'general'},
            {$inc: {'walletBalance.amount': response.body.data[0].amount}},
            function (err, f) {
                if (err) {
                    console.log(err);
                }
                console.log(f);
            });

        return callback(null, info)
    })
}

module.exports = router;