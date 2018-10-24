const express = require('express');
const router = express.Router();
const unirest = require("unirest"); //unirest is an http request library so any other preferred library can be used.

const validator = require('../../utils/validator');
let User = require('../../models/user');
const config = require('../../config');
const Withdrawal = require('../../models/withdrawal');
const Transaction = require('../../models/transactions');
let Admin = require('../../models/admin_user');

/*** END POINT FOR GETTING PERSONAL WALLET DETAILS BY CURRENTLY LOGGED IN USER */
router.get('/wallet', function(req, res) {

    let id = req.user.id;

    User.aggregate([
        {$match: {'_id': id}},
        {
            $project: {
                walletBalance: 1,
                withdrawals: 1,
                deposits: 1,
                transactions: 1,
            }
        }
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        User.populate(data, {
                'path': 'followers.userId following.userId categoryTags.categoryId posts.postedBy questions.postedBy',
                'select': 'name photoUrl bio title'
            },

            function (err, user) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                if (!user) {
                    return res.badRequest("YOU NEED TO BE A REGISTERED USER TO VIEW GET ACCESS");
                }

                res.success(user);
            });
    });
});

/*** END POINT FOR GETTING PERSONAL WALLET BY CURRENTLY LOGGED IN USER */
router.get('/', function(req, res) {

    let id = req.user.id;
    User.aggregate([
        {$match: {'_id': id}},
        {
            $lookup: {
                from: "transactions",
                localField: "_id",
                foreignField: "depositedBy",
                as: "debits"
            }
        },
        {
            $lookup: {
                from: "transactions",
                localField: "_id",
                foreignField: "receivedBy",
                as: "credits"
            }
        },
        {
            $project: {
                walletBalance: 1,
                withdrawals: 1,
                statement:1,
                'last deposit': {$slice:['$deposits', -1]},
                debits: {
                    $map: {
                        input: '$debits',
                        as: "element",
                        in: {
                            postId: "$$element._id",
                            createdAt: '$$element.createdAt',
                            deposit: '$$element.deposit',
                            status: '$$element.status',
                            reason: '$$element.reason',
                            depositedBy: "$$element.depositedBy",
                            receivedBy: "$$element.receivedBy"
                        }
                    }
                },
                credits: {
                    $map: {
                        input: '$credits',
                        as: "element",
                        in: {
                            postId: "$$element._id",
                            postedOn: '$$element.createdAt',
                            deposit: '$$element.deposit',
                            status: '$$element.status',
                            reason: '$$element.reason',
                            depositedBy: "$$element.depositedBy",
                            receivedBy: "$$element.receivedBy"
                        }
                    },
                },
            }
        }
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        User.populate(data, {
                'path': 'debits.depositedBy debits.receivedBy credits.depositedBy credits.receivedBy',
                'select': 'name'
            },

            function (err, user) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(user);
            });
    });
});

/*** END POINT FOR GETTING PERSONAL WALLET BY CURRENTLY LOGGED IN USER */
router.get('/withdrawals', function(req, res) {

    let id = req.user.id;
    Withdrawal.aggregate([
        {$match: {'withdrawBy': id}},
        {
            $project: {
                withdrawDetails: 1,
                accountDetails: 1,
                status: 1,
                createdAt: 1
            }
        }
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        res.success(data);
    });
});

/*** END POINT FOR GETTING PERSONAL WALLET BY CURRENTLY LOGGED IN USER */
router.get('/account_info', function(req, res) {

    let id = req.user.id;
   User.findById(id, function(err, user){
       if (err){
           console.log(err);
           return res.badRequest('something happened')
       }
       if(!user){
           return res.badRequest('no user found with your login details')
       }

       res.success(user.account_details);
    });
});

/*** END POINT FOR CREDITING WALLET BY USER*/
router.post("/credit", function (req, res) {

    let txref = req.body.reference;
    let userId = req.user.id;

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

    unirest.post(server_url)
        .headers({'Content-Type': 'application/json'})
        .send(payload)
        .end(function (response) {
        if(response.error){
            return res.badRequest('transaction was not successful')
        }
        //check status is success.
        if (response.body.data[0].status === "successful" && response.body.data[0].chargecode === '00') {
            Admin.updateOne(
                {role: 'general'},
                {$inc: {'walletBalance.amount': response.body.data[0].amount}},
                function (err, f) {
                    if (err) {
                        console.log(err);
                        return res.badRequest('something happened unexpectedly')
                    }
                    console.log(f);

                paymentInfo(response, userId, function (errorMessage, userInfo) {
                    if (errorMessage) {
                        res.badRequest(errorMessage);
                    }
                    else {
                        res.success(userInfo);
                    }
                });
            })
        }else {
            return res.badRequest('transaction was not successful')
        }
    })
});

/*** END POINT FOR UPDATING ACCOUNT DETAILS FROM ACCOUNT NUMBER BY CURRENTLY LOGGED IN USER */
router.post('/update_account_info', function(req, res) {

    let account_number = req.body.account_number,
        account_name = req.body.account_name,
        bankName = req.body.bankName,
        SwiftCode = req.body.SwiftCode,
        bank_code = req.body.bank_code,
        RoutingNumber = req.body.RoutingNumber,
        country = req.body.country.toUpperCase(),
        id = req.user.id;

    let v = validator.isWord(res, account_number) &&
        validator.isSentence(res, bankName) &&
        validator.isSentence(res, account_name) &&
        validator.isCountry(res, country);
    if (!v) return;

    if (country === 'NG' || country === 'GH' || country === 'KE') {
        console.log(country)
        let v = validator.isWord(res, bank_code);
        if (!v) return;

        let data = {
            'account_details.account_number': account_number,
            'account_details.account_name': account_name,
            'account_details.bank_code': bank_code,
            'account_details.bankName': bankName,
            'account_details.country': country
        };

        updateUser(id, data, function (err, user) {
            if (err) {
                return res.badRequest(err)
            }

            return res.success(user)
        })
    } else {
        console.log(country)
        let v = validator.isWord(res, SwiftCode) &&
            validator.isWord(res, RoutingNumber);
        if (!v) return;

        let data = {
            'account_details.account_number': account_number,
            'account_details.account_name': account_name,
            'account_details.bankName': bankName,
            'account_details.SwiftCode': SwiftCode,
            'account_details.country': country,
            'account_details.RoutingNumber': RoutingNumber,
        };

        updateUser(id, data, function (err, user) {
            if (err) {
                return res.badRequest(err)
            }

            res.success(user)
        })
    }
});

/*** END POINT FOR MAKING WITHDRAWS FROM WALLET BY USER*/
router.post("/withdraw", function (req, res) {

    let withdrawBy = req.user.id;
    let amount = req.body.amount,
        currency = req.body.currency.toUpperCase();

    let v = validator.isAmount(res, amount);
    if (!v) return;

    User.findOne({_id: withdrawBy}, function (err, user) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!user) {
            return res.badRequest("user not found with your information");
        }
        // if(user && user.walletBalance.amount < amount){
        //     return res.badRequest("your balance is insufficient to perform this action");
        // }
        // if(user.walletBalance.currency !== currency){
        //     return res.badRequest("your currency not supported. currency must be USD");
        // }
        if(user.account_details.account_number === undefined){
            return res.badRequest("your transfer account information is not updated please update bank details and try again");
        }

        let data = {
            'withdrawDetails.amount': amount,
            'withdrawDetails.currency': currency,
            accountDetails: user.account_details,
            withdrawBy: withdrawBy
        };

        Withdrawal.create(data, function (err, info) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }

            let data = {
                amount: info.withdrawDetails.amount,
                currency: info.withdrawDetails.currency,
                'bank name': info.accountDetails.bankName,
                status: info.status,
                'account number': info.accountDetails.account_number,
                message: 'your withdraw request was successfully submitted and pending approval'
            };

            res.success(data)
        })
    });
});

function updateUser(id, dat, callback){
    User.findByIdAndUpdate(id, {$set: dat}, {new: true}, function(err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("User profile not found please be sure you are still logged in");
        }

        return callback(null, user.account_details)
    });
}

function paymentInfo(response, userId, callback) {
    console.log('im about to update user');

    let amount = response.body.data[0].amount,
        currency = response.body.data[0].currency;
    let data = {
        'deposit.amount': amount,
        'deposit.currency': currency
    };

    User.update({_id: userId}, {$inc:{'walletBalance.amount': amount}, $push:{deposits: data}}, function (err, info) {
        if (err) {
            console.log(err);
            return callback('something happened')
        }
        console.log(info);

        return callback(null, 'your deposit was successful and wallet has been credited')
    });
}

module.exports = router;