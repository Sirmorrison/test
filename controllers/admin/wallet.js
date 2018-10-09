const express = require('express');
const router = express.Router();
const unirest = require("unirest"); //unirest is an http request library so any other preferred library can be used.

const validator = require('../../utils/validator');
let Admin = require('../../models/admin_user');
const config = require('../../config');
const Transaction = require('../../models/transactions');
const Withdraw = require('../../models/withdrawal');
const User = require('../../models/user');
let async = require('async');
let crypto = require("crypto");

//START FOR THE WALLET TOP NAV AND DASHBOARD WALLET DISPLAY
/*** END POINT FOR GETTING TOTAL NUMBER OF WALLET TRANSACTION BY ADMIN USER*/
router.get('/total_transactions', allow('wallet'), function (req, res) {

    let month = parseInt(req.query.month),
        year = parseInt(req.query.year);

    if (month && !year) {
        Transaction.aggregate([
            {$project: {'month': {'$month':'$createdAt'}}},
            {$match: {month: month}},
            {$group: {_id: null, total: {$sum: 1}}}
            ],function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            res.success(data);
        })
    }else if(year  && !month){
        Transaction.aggregate([
            {$project: {'year': {'$year':'$createdAt'}}},
            {$match: {year: year}},
            {$group: {_id: null, total: {$sum: 1}}}
        ],function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            res.success(data);
        })
    }else if(month && year){
        Transaction.aggregate([
            {$project: {'year': {'$year':'$createdAt'}, 'month': {'$month':'$createdAt'}}},
            {$match: {year: year, month: month}},
            {$group: {_id: null, total: {$sum: 1}}}
        ],function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            res.success(data);
        })
    } else{
        Transaction.find({}, function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            if (!data) {
                return res.success([]);
            }

            res.success(data.length);
        })
    }
});

/*** END POINT FOR GETTING WALLET TOTAL WALLET BALANCE BY ADMIN USER*/
router.get('/wallet_balance', allow('wallet'), function (req, res) {
    Admin.find({role: 'general'}, {walletBalance: 1}, function (err, bal) {
        if(err){
            console.log(err);
            return res.badRequest("something happened")
        }
        if(!bal){
            return res.success({})
        }

        res.success(bal)
    })
});

/*** END POINT FOR GETTING TOTAL NUMBER OF PENDING WITHDRAWALS BY ADMIN USER*/
router.get('/total_pending', allow('wallet'), function (req, res) {
    Withdraw.find({status: 'pending'}, function (err, bal) {
        if(err){
            console.log(err);
            return res.badRequest("something happened")
        }
        if(!bal){
            return res.success({})
        }

        res.success(bal.length)
    })
});
//END OF DASHBOARD

//TRANSACTIONS
/*** END POINT FOR GETTING WALLET TRANSACTION IN DATABASE BY LOGGED IN ADMIN USERS*/
router.get('/transactions/', allow('wallet'), function (req, res) {

    let from = req.query.from,
        to = req.query.to;
    if (from && to) {
        Transaction.find({createdAt: {$gte: to, $lte: from}}, {updatedAt: 0, __v: 0})
            .populate({
                path: 'depositedBy',
                select: 'name'
            })
            .populate({
                path: 'receivedBy',
                select: 'name'
            })
            .sort({createdAt: -1})
            .limit(20)
            .exec(function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                if (!data) {
                    return res.success("Something unexpected happened");
                }

                res.success(data);
            })
    }else{
        Transaction.find({}, {updatedAt: 0, __v: 0})
            .populate({
                path: 'depositedBy',
                select: 'name'
            })
            .populate({
                path: 'receivedBy',
                select: 'name'
            })
            .sort({createdAt: -1})
            .limit(20)
            .exec(function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                if (!data) {
                    return res.success("Something unexpected happened");
                }

                res.success(data);
            })
    }
});

//INDIVIDUAL USER WALLET ACCOUNT STATEMENT
/*** END POINT FOR GETTING WALLET TRANSACTION OF A USER IN DATABASE BY LOGGED IN ADMIN USERS*/
//not done with this need to group debit and credits as one output
router.get('/user/:userId', allow('wallet'), function (req, res) {

    let userId = req.params.userId;
    User.aggregate([
        {$match: {_id: userId}},
        {
            $lookup: {
                from: "transactions",
                localField: "_id",
                foreignField: "receivedBy",
                as: "credits"
            }
        },
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
                from: "withdraws",
                localField: "_id",
                foreignField: "withdrawBy",
                as: "withdrawal"
            }
        },
        {
        $project: {
            walletBalance: 1,
            withdrawals: {$size: "$withdrawals"},
            'total credits': {$size: "$credits"},
            'total withdrawals': {$size: '$withdrawal'},
            debit: {
                $map: {
                    input: '$debits',
                    as: "element",
                    in: {
                        debitId: "$$element._id",
                        postedOn: '$$element.createdAt',
                        detail: '$$element.deposit',
                        status: '$$element.status',
                        reason: '$$element.reason',
                        receivedBy: "$$element.receivedBy"
                    }
                }
            },
            credits: {
                $map: {
                    input: '$credits',
                    as: "element",
                    in: {
                        creditId: "$$element._id",
                        postedOn: '$$element.createdAt',
                        detail: '$$element.deposit',
                        status: '$$element.status',
                        reason: '$$element.reason',
                        depositedBy: "$$element.depositedBy",
                    }
                },
            },
        }
    },
    {$sort: {createdAt: -1}},
    {$limit: 20}
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        // User.populate(data, {
        //         'path': 'postedBy',
        //         // 'model': 'users',
        //         'select': 'name photoUrl'
        //     },
        //
        //     function (err, post) {
        //
        //         if (err) {
        //             console.log(err);
        //             return res.badRequest("Something unexpected happened");
        //         }

                res.success(data);
            }
        );
    // });
});

//PENDING, APPROVED, DECLINED, ALL
/*** END POINT FOR GETTING WALLET TRANSACTION IN DATABASE BY LOGGED IN ADMIN USERS*/
router.get('/all', allow('wallet'), function (req, res) {
    Withdraw.aggregate([
        {
            $project: {
                withdrawDetails: 1,
                accountDetails: 1,
                withdrawBy: 1,
                status: 1,
                createdAt: 1
            },
        },
        {$sort: {createdAt: -1}},
        {$limit: 20}
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        User.populate(data, {
                'path': 'withdrawBy',
                'select': 'name walletBalance status'
            },

            function (err, info) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(info);
            }
        );
    });
});

/*** END POINT FOR GETTING THE ALL UNAPPROVED BLOGS BY LOGGED IN ADMIN USERS*/
router.get('/pending', allow('wallet'), function (req, res) {

    Withdraw.aggregate([
        {$match: {status: 'pending'}},
        {
            $project: {
                withdrawDetails: 1,
                accountDetails: 1,
                withdrawBy: 1,
                status: 1,
                createdAt: 1
            },
        },
        {$sort: {createdAt: -1}},
        {$limit: 20}
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        User.populate(data, {
                'path': 'withdrawBy',
                'select': 'name walletBalance status'
            },

            function (err, data) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(data);
            });
    });
});

/*** END POINT FOR GETTING THE ALL APPROVED WITHDRAW BY LOGGED IN ADMIN USERS*/
router.get('/approved', allow('wallet'),function (req, res) {

    Withdraw.aggregate([
        {$match: {status: 'approved'}},
        {
            $project: {
                withdrawDetails: 1,
                accountDetails: 1,
                withdrawBy: 1,
                status: 1,
                createdAt: 1
            },
        },
        {$sort: {createdAt: -1}},
        {$limit: 20}
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Withdraw.populate(data, {
                'path': 'withdrawBy',
                'select': 'name walletBalance status'
            },

            function (err, post) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(post);
            });
    });
});

/*** END POINT FOR GETTING THE ALL APPROVED WITHDRAW BY LOGGED IN ADMIN USERS*/
router.get('/approved/rave', allow('wallet'),function (req, res) {

    let payload = {
        "seckey": config.rave,
    };
    let url = 'https://ravesandboxapi.flutterwave.com/v2/gpx/transfers'; //please make sure to change this to production url when you go live
    unirest.get(url)
        .headers({'Content-Type': 'application/json'})
        .send(payload)
        .end(function (response) {
            if (response.error) {
                console.log(response.error);
                return res.badRequest(response.error)
            }

            return res.success(response.body.data)
        })
});

/*** END POINT FOR GETTING THE ALL DECLINED WITHDRAWS BY LOGGED IN ADMIN USERS*/
router.get('/declined', allow('wallet'), function (req, res) {

    Withdraw.aggregate([
        {$match: {status: 'declined'}},
        {
            $project: {
                withdrawDetails: 1,
                accountDetails: 1,
                withdrawBy: 1,
                status: 1,
                createdAt: 1
            },
        },
        {$sort: {createdAt: -1}},
        {$limit: 20}
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Withdraw.populate(data, {
                'path': 'withdrawBy',
                'select': 'name walletBalance status'
            },

            function (err, post) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(post);
            });
    });
});

/*** END POINT FOR APPROVING OR DECLINING A WITHDRAW REQUEST BY ADMIN USER*/
router.post('/approval/:withdrawId', allow('wallet'), function (req, res) {

    async.waterfall([
        function (done) {
            let id = req.params.withdrawId,
                status = req.body.status;

            let valid = validator.isAllowed(res, status);
            if (!valid) return;

            Withdraw.findOne({_id: id})
                .populate({
                    path: 'withdrawBy',
                    select: 'name walletBalance'
                })
                .exec(function (err, info) {
                    if (err) {
                        console.log(err);
                        return res.serverError("Something unexpected happened");
                    }
                    if (!info) {
                        return res.badRequest('no withdraws request found with details provided')
                    }
                    // if(info.withdrawBy.walletBalance.amount < info.withdrawDetails.amount){
                    //     return res.badRequest('insufficient fund in user account to perform this action')
                    // }
                    done(err, info);
                })
        },
        function (info, done) {

            crypto.randomBytes(20, function (err, buf) {
                let token = buf.toString('hex');
                done(err, info, token);
            });
        },
        function (info, token, done) {
            if(info.accountDetails.country === 'NG' || info.accountDetails.country === 'GH' || info.accountDetails.country === 'KE') {
                console.log(info.accountDetails.country, 'point one')
                let payload = {
                    "amount": info.withdrawDetails.amount,
                    "SECKEY": config.rave,
                    "origin_currency": info.withdrawDetails.currency,
                };
                if(info.accountDetails.country === 'NG'){
                    payload.destination_currency = 'NGN'
                }else if(info.accountDetails.country === 'GH'){
                    payload.destination_currency = 'GHS'
                }else {
                    payload.destination_currency = 'KES'
                }
                converter(payload, function (err, result) {
                    if (err) {
                        return res.badRequest(err)
                    }
                    let payload = {
                        "account_bank": info.accountDetails.bank_code,
                        "account_number": info.accountDetails.account_number,
                        "amount": result.converted_amount,
                        "seckey": config.rave,
                        "narration": "fund transfer from ask oleum",
                        "currency": result.destinationcurrency,
                        "reference": token,
                    };

                    transfer(payload, function (err, result) {
                        if (err) {
                            return res.badRequest(err)
                        }

                        User.update({_id: info.withdrawBy._id}, {$inc: {'walletBalance.amount': -info.withdrawDetails.amount}},
                            function (err, data) {
                                if (err) {
                                    console.log('this error is from updating user profile', err)
                                }
                            });

                        res.success(result.body.data);
                        done(err, 'done')
                    })
                })
            }else {
                let payload = {
                    "amount": info.withdrawDetails.amount,
                    "seckey": config.rave,
                    "narration": "fund transfer from ask oleum",
                    "currency": info.withdrawDetails.currency,
                    "reference": token,
                    "meta": [
                        {
                            "IBAN": info.accountDetails.account_number,
                            "RoutingNumber": info.accountDetails.RoutingNumber,
                            "SwiftCode": info.accountDetails.SwiftCode,
                            "BankName": info.accountDetails.bankName,
                            "BeneficiaryName": info.accountDetails.account_name,
                            "BeneficiaryAddress": info.address,
                            "BeneficiaryCountry": info.accountDetails.country
                        }]
                    // {
                    //     "IBAN": "09182972BH",
                    //     "RoutingNumber": "0000000002993",
                    //     "SwiftCode": "ABJG190",
                    //     "BankName": "BANK OF AMERICA, N.A., SAN FRANCISCO, CA",
                    //     "BeneficiaryName": "Mark Cuban",
                    //     "BeneficiaryAddress": "San Francisco, 4 Newton",
                    //     "BeneficiaryCountry": "US"
                    // }]
                };
                console.log(payload);

                transfer(payload, function (err, result) {
                    if (err) {
                        return res.badRequest(err)
                    }

                    User.update({_id: info.withdrawBy._id}, {$inc: {'walletBalance.amount': -info.withdrawDetails.amount}},
                        function (err, data) {
                            if (err) {
                                console.log('this error is from updating user profile', err)
                            }
                        });

                    res.success(result.body.data);
                    done(err, 'done')
                })
            }
        }], function (err) {
        if (err) {
            return res.badRequest(err);
        }
    })
});

function transfer(payload, callback) {
    let url = 'https://ravesandboxapi.flutterwave.com/v2/gpx/transfers/create'; //please make sure to change this to production url when you go live
    unirest.post(url)
        .headers({'Content-Type': 'application/json'})
        .send(payload)
        .end(function (response) {
            if (response.error) {
                console.log(response.error.code);
                return callback(response.error.code)
            }
            if(response.body.data.status === 'FAILED'){
                return callback(response.body.data.complete_message)
            }

            return callback(null, response)
        })
}

function converter(payload, callback) {
    let url = 'https://ravesandboxapi.flutterwave.com/flwv3-pug/getpaidx/api/forex'; //please make sure to change this to production url when you go live
    unirest.post(url)
        .headers({'Content-Type': 'application/json'})
        .send(payload)
        .end(function (response) {
            if (response.error) {
                return callback(response.error.code)
            }

            return callback(null, response.body.data)
        })
}

function allow(admin_function) {
    return function (req, res, next) {
        let userId = req.user.id;
        Admin.findById(userId, function (err, user) {
            if(err){
                console.log(err);
                return res.badRequest('something happened')
            }
            if (user) {
                let that = user.admin_function;
                for (let i = 0; i < that.length; i++) {
                    if (that[i].match(admin_function) || user.role === 'general') {
                        req.user = user;

                        return next();
                    }
                }
            }


            // if (user) {
            //     let that = user.admin_function;
            //     console.log(that)
            //
            //     for (let i = 0; i < that.length; i++) {
            //         console.log(that[i].indexOf(admin_function.split(',')))
            //
            //         if (that[i].indexOf(admin_function.split(',')) >= 0) {
            //             console.log(user)
            //
            //             req.user = user;
            //             return next();
            //         }
            //     }
            // }
            return res.unauthorized('you are not authorized to perform this action')
        })

    }
}

module.exports = router;