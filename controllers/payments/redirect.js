const express = require('express');
const router = express.Router();
const unirest = require("unirest"); //unirest is an http request library so any other preferred library can be used.
let mongoose = require("mongoose");

const protector = require('../../middlewares/protector');
const Package = require('../../models/packages');
const Transaction = require('../../models/transactions');
const config = require('../../config');
let validator = require('../../utils/validator'),
    Admin = require('../../models/admin_user'),
    Story = require('../../models/story'),
    Question = require('../../models/question'),
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
        postId = req.body.postId,
        amount = req.body.amount,
        currency = req.body.currency;

    let valid = validator.isCurrency(res, currency)&&
        validator.isAmount(res, amount)&&
        validator.isWord(res, postId);
    if (!valid) return;

    console.log(userId, postId, amount, currency);

    validAmount(postId, amount,currency, function (err, info) {
        if (err) {
            return res.badRequest(err);
        }

        console.log(info);
        let postedBy_comm = info.commission.postedBy,
            answeredBy_comm = info.commission.answeredBy,
            admin_comm = info.commission.admin,
            questionBy = info.questionBy,
            postedBy = info.postedBy;

        userVerify(userId, function (err, user) {
            if (err) {
                console.log(err);
                return res.badRequest(err);
            }
            if (amount > user.walletBalance.amount) {
                return res.badRequest('insufficient fund in wallet to perform this action')
            }

            createTransactionWallet(userId, postId, postedBy, amount, currency, function (errorMessage, userInfo) {
                if (errorMessage) {
                    res.badRequest(errorMessage);
                }
                console.log(userInfo);

                let usercut = ((postedBy_comm/100)*amount);
                let admincut = ((admin_comm/100*amount));
                let answcut = ((answeredBy_comm/100)*amount);

                Admin.update(
                    {role: 'general'},
                    {
                        $inc: {'walletBalance.amount': admincut}
                    }, function (err, f) {
                        if (err) {
                            console.log(err);
                            return res.badRequest('something happened')
                        }

                        console.log(f + '  this is 2');

                        res.success('payment successful')
                    }
                );
                if(questionBy){
                    User.update(
                        {"_id": questionBy},
                        {
                            $inc: {'walletBalance.amount': usercut}
                        }, function (err, f) {
                            if (err) {
                                console.log(err);
                                return res.badRequest('something happened')
                            }

                            console.log(f + '  this is 2');

                            res.success('payment successful')
                        }
                    );
                }
                if(postedBy) {
                    User.update(
                        {"_id": postedBy},
                        {
                            $inc: {'walletBalance.amount': answcut}
                        }, function (err, f) {
                            if (err) {
                                console.log(err);
                                return res.badRequest('something happened')
                            }

                            console.log(f + '  this is 2');

                            res.success('payment successful')
                        }
                    );
                }
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

/*** END POINT FOR GETTING A STORY OF A USER BY LOGGED IN USERS /GUEST USERS */
router.get('/something/:postId', allow('successful'), function (req, res) {
    let storyId = req.params.postId,
        id = mongoose.Types.ObjectId(storyId);

    Question.update(
        {"_id": id},
        {$inc: {views: 1}}, function (err) {
            if (err) {
                console.log(err)
            }

            Question.aggregate([
                {$match: {"answers._id": id}},
                {
                    $project: {
                        story: 1,
                        title: 1,
                        postedBy: 1,
                        views: 1,
                        // 'total comments': {$size: '$comments'}
                    }
                },
            ], function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                Question.populate(data, {
                    'path': 'postedBy comments.commentedBy',
                    'select': 'name email photoUrl'
                },

                function (err, post) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }

                    res.success(post)
                })
            });
        }
    );
});

function getPostInfo(postId, userId, callback) {
    Story.findOne({_id: postId}, function (err, data) {
        if (err) {
            console.log('errror at point 1', err);
            return callback("Something unexpected happened");
        }
        if (data && data.postedBy === userId) {
            console.log(' im viewing post because im owner')
            return callback(null, 'successful')
        }
        if (data && data.postedBy !== userId) {
            console.log('from story ', data)

            let details = {
                resp: 'story',
                view_cost: data.view_cost.amount,
                currency: data.view_cost.currency,
                userId: data.postedBy
            };

            return callback(null, details)

        } else {
            Question.findOne({'answers._id': postId}, function (err, question) {

                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
                if (!question) {
                    return callback("no question found with answer with that details provided");
                }
                if (question.answers.id(postId).answeredBy === userId) {
                    console.log('im found the person');
                    return callback(null, 'successful');
                }

                let details = {
                    resp: 'question',
                    view_cost: question.answers.id(postId).view_cost.amount,
                    currency: question.answers.id(postId).view_cost.currency,
                    postedBy: question.answers.id(postId).answeredBy,
                    questionBy: question.postedBy
                };

                return callback(null, details)
            })
        }
    })
}

function getPackage(plan, callback) {
    Package.findOne({plan: plan}, function (err, pack) {
        if (err) {
            console.log('at story package ', err);
            return callback("Something unexpected happened");
        }
        if (!pack) {
            return callback("no package found");
        }
        console.log(pack);

        return callback(null, pack)
    });
}

function userVerify(userId, callback) {
    User.findOne({_id: userId}, function (err, user) {
        if (err) {
            console.log('errror at point 2', err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("no user found with this id");
        }

        let data = {
            walletBalance: user.walletBalance,
            package: user.packageType
        };

        return callback(null, data)
    })
}

function validAmount(postId, userId, callback) {
    getPostInfo(postId, userId, function (err, post) {
        if (err) {
            console.log('errror at point 1', err);
            return callback("Something unexpected happened");
        }
        if (post && post === 'successful') {
            return callback(null, post)
        }
        if (post && post.resp === 'story') {
            console.log('from story ', post);
            let view_cost = post.view_cost.amount,
                currency = post.view_cost.currency,
                userId = post.postedBy;

            userVerify(userId, function (err, user) {
                if (err) {
                    console.log('at story user verify ', err);
                    return callback(err);
                }

                let plan = user.package;
                getPackage(plan, function (err, pack) {
                    if (err) {
                        console.log('at story package ', err);
                        return callback(err);
                    }

                    console.log(pack);
                    let data = {
                        postedBy: userId,
                        view_cost: view_cost,
                        currency: currency,
                        commission: pack.stories.commission
                    };
                    console.log(data)
                    return callback(null, data)
                });
            })
        } else {

            let view_cost = post.answers(postId).view_cost.amount,
                currency = post.answers(postId).view_cost.currency,
                postedBy = post.answers(postId).answeredBy,
                questionBy = post.postedBy;

            userVerify(postedBy, function (err, user) {
                if (err) {
                    console.log('at story user verify ', err);
                    return callback(err);
                }

                let plan = user.package;
                getPackage(plan, function (err, pack) {
                    if (err) {
                        console.log('at story package ', err);
                        return callback(err);
                    }

                    console.log(pack);
                    let data = {
                        view_cost: view_cost,
                        currency: currency,
                        postedBy: postedBy,
                        questionBy: questionBy,
                        commission: pack.answers.commission
                    };

                    console.log(data);
                    return callback(null, data)
                });
            });
        }
    })
}

function createTransactionCard(response, userId, postId,postedBy, callback) {
    let data ={
        'deposit.amount' : response.body.data[0].amount,
        'deposit.currency' : response.body.data[0].currency,
        status : response.body.data[0].status,
        receiptId: response.body.data[0].flwref,
        reason : postId,
        depositedBy : userId,
        receivedBy : postedBy
    };

    Transaction.create(data, function (err, info) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        return callback(null, info)
    })
}

function createTransactionWallet(userId, postId, postedBy, view_cost, callback) {
    console.log(userId)
    User.update(
        {"_id": userId},
        {$inc: {'walletBalance.amount': -view_cost}}, function (err, f) {
            if (err) {
                console.log(err);
                return callback(err)
            }
            console.log(f + ' this is 1');

            let data = {
                'deposit.amount': view_cost,
                'deposit.currency': 'USD',
                status: 'successful',
                reason: postId,
                depositedBy: userId,
                receivedBy: postedBy
            };
            console.log(data)
            Transaction.create(data, function (err, info) {
                if (err) {
                    console.log(err);
                    return callback(err);
                }

                console.log(info)

                return callback(null, info)
            })
        }
    );
}

function toRave(config, txref, callback) {
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
        if (response.error) {
            console.log(response.error);
            return callback(response.error)
        }

        return callback(null, response)
    });
}

function payWithCard(config, txref, postId, userId, callback) {
    toRave(config, txref, function (err, response) {
        if (err) {
            console.log(err);
            return callback(err)
        }

        validAmount(postId, userId, function (err, info) {
            if (err) {
                console.log(err)
                return callback(err);
            }
            if(info && info === 'successful'){
                return callback(null, info)
            }
            let postedBy_comm = info.commission.user,
                admin_comm = info.commission.admin,
                questionBy = info.questionBy,
                view_cost = info.view_cost,
                postedBy = info.postedBy;
            console.log(view_cost);

            //check status is success.
            if (response.body.data[0].status === "successful" && response.body.data[0].chargecode === '00') {
                if (response.body.data[0].amount === view_cost && response.body.data[0].currency === 'USD') {
                    createTransactionCard(response, userId, postId, postedBy, function (errorMessage, userInfo) {
                        if (errorMessage) {
                            res.badRequest(errorMessage);
                        } else {
                            if (postedBy_comm.question && postedBy_comm.answer) {
                                let answercut = ((postedBy_comm.answer / 100) * view_cost);
                                let questioncut = ((postedBy_comm.question / 100) * view_cost);
                                let admincut = ((admin_comm / 100 * view_cost));
                                //credit user that asked the question
                                User.update(
                                    {"_id": questionBy},
                                    {
                                        $inc: {'walletBalance.amount': questioncut}
                                    }, function (err, f) {
                                        if (err) {
                                            console.log(err);
                                            return callback('something happened')
                                        }

                                        console.log(f + '  this is 1');
                                        //credit user that answered the question
                                        User.update(
                                            {"_id": postedBy},
                                            {
                                                $inc: {'walletBalance.amount': answercut}
                                            }, function (err, f) {
                                                if (err) {
                                                    console.log(err);
                                                    return callback('something happened')
                                                }

                                                console.log(f + '  this is 2');
                                                //credit admin wallet with commission
                                                Admin.update(
                                                    {role: 'general'},
                                                    {
                                                        $inc: {'walletBalance.amount': admincut}
                                                    }, function (err, f) {
                                                        if (err) {
                                                            console.log(err);
                                                            return callback('something happened')
                                                        }

                                                        console.log(f + '  this is 3');

                                                        return callback(null, 'successful')
                                                    }
                                                )
                                            }
                                        )
                                    })
                            } else {
                                console.log('did not find post.com and what ever');

                                let usercut = ((postedBy_comm / 100) * view_cost);
                                let admincut = ((admin_comm / 100 * view_cost));
                                User.update(
                                    {"_id": postedBy},
                                    {
                                        $inc: {'walletBalance.amount': usercut}
                                    }, function (err, f) {
                                        if (err) {
                                            console.log(err);
                                            return callback('something happened')
                                        }

                                        console.log(f + '  this is 1');

                                        Admin.update(
                                            {role: 'general'},
                                            {
                                                $inc: {'walletBalance.amount': admincut}
                                            }, function (err, f) {
                                                if (err) {
                                                    console.log(err);
                                                    return callback('something happened')
                                                }

                                                console.log(f + '  this is 2');

                                                return callback(null, 'successful')
                                            }
                                        )
                                    }
                                )
                            }
                        }
                    })
                }else{
                    return callback("amount paid does not match the amount to view the post");
                }
            } else {
                return callback("transaction was not successful due to any of the reasons: currency or amount paid");
            }
        });
    })
}

function payFromWallet( postId, userId, callback) {
    validAmount(postId, userId, function (err, info) {
        if (err) {
            console.log(err)
            return callback(err);
        }
        if(info && info === 'successful'){
            return callback(null, info)
        }
        let postedBy_comm = info.commission.user,
            admin_comm = info.commission.admin,
            questionBy = info.questionBy,
            view_cost = info.view_cost,
            postedBy = info.postedBy;
        console.log(view_cost);

        userVerify(userId, function (err, user) {
            if (err) {
                console.log(err);
                return callback(err);
            }
            if (view_cost > user.walletBalance.amount) {
                return callback('insufficient fund in wallet to perform this action')
            }
            createTransactionWallet(userId, postId, postedBy, view_cost, function (errorMessage, userInfo) {
                if (errorMessage) {
                    return callback(errorMessage);
                }
                console.log(userInfo);

                if (postedBy_comm.question && postedBy_comm.answer) {
                    let answercut = ((postedBy_comm.answer / 100) * view_cost);
                    let questioncut = ((postedBy_comm.question / 100) * view_cost);
                    let admincut = ((admin_comm / 100 * view_cost));
                    //credit user that asked the question
                    User.update(
                        {"_id": questionBy},
                        {
                            $inc: {'walletBalance.amount': questioncut}
                        }, function (err, f) {
                            if (err) {
                                console.log(err);
                                return callback('something happened')
                            }

                            console.log(f + '  this is 1');
                            //credit user that answered the question
                            User.update(
                                {"_id": postedBy},
                                {
                                    $inc: {'walletBalance.amount': answercut}
                                }, function (err, f) {
                                    if (err) {
                                        console.log(err);
                                        return callback('something happened')
                                    }

                                    console.log(f + '  this is 2');
                                    //credit admin wallet with commission
                                    Admin.update(
                                        {role: 'general'},
                                        {
                                            $inc: {'walletBalance.amount': admincut}
                                        }, function (err, f) {
                                            if (err) {
                                                console.log(err);
                                                return callback('something happened')
                                            }

                                            console.log(f + '  this is 3');

                                            return callback(null, 'successful')
                                        }
                                    )
                                }
                            )
                        })
                } else {
                    console.log('did not find post.com and what ever');

                    let usercut = ((postedBy_comm / 100) * view_cost);
                    let admincut = ((admin_comm / 100 * view_cost));
                    User.update(
                        {"_id": postedBy},
                        {
                            $inc: {'walletBalance.amount': usercut}
                        }, function (err, f) {
                            if (err) {
                                console.log(err);
                                return callback('something happened')
                            }

                            console.log(f + '  this is 1');

                            Admin.update(
                                {role: 'general'},
                                {
                                    $inc: {'walletBalance.amount': admincut}
                                }, function (err, f) {
                                    if (err) {
                                        console.log(err);
                                        return callback('something happened')
                                    }

                                    console.log(f + '  this is 2');

                                    return callback(null, 'successful')
                                }
                            )
                        }
                    )
                }
            })
        });
    })
}

function verifyPayment(userId, txref, postId, callback) {
    if(txref){
        toRave(config,txref, function (err, response) {
            if(err){
            console.log(err)
                return callback(err)
            }else {

                let receiptId = response.body.data[0].flwref;
                // let txId = response.body.data[0].txId;

                if (userId) {
                    Transaction.findOne({reason: postId, depositedBy: userId, receiptId: receiptId}, function (err, data) {
                        if (err) {
                            console.log(err)
                            return callback('something unexpected happened try again')
                        }
                        console.log('i didnt found a payment 1')

                        if (!data) {
                            return callback('unsuccessful')
                        }
                        console.log('i found a payment 1')

                        return callback(null, 'successful')
                    })
                }else {
                    Transaction.findOne({reason: postId, receiptId: receiptId}, function (err, data) {
                        if (err) {
                            console.log(err)
                            return callback('something unexpected happened try again')
                        }

                        if (!data) {
                            console.log('i didnt found a payment 2')
                            return callback('unsuccessful')
                        }
console.log('i found a payment 2')
                        return callback(null, 'successful')
                    })
                }
            }
        })
    }else {
        console.log('im at verify')
        Transaction.findOne({reason: postId, depositedBy: userId}, function (err, info) {
            if(err){
                console.log(err)
                return callback(err)
            }
            console.log('i didnt found a payment 3')

            if(!info){
                return callback(null, 'unsuccessful')
            }
            console.log('i found a payment 3')

            return callback(null, 'successful')
        })
    }
}

function allow(message) {
    return function (req, res, next) {

        let postId = req.params.postId,
            txref = req.query.reference,
            token = req.body.token || req.query.token || req.headers.token;

        if (token) {
            protector.protect(req, res, function () {
                console.log(req.user.id);
                let userId = req.user.id;
                getPostInfo(postId, userId, function (err, post) {
                    if (err) {
                        console.log('errror at point 1', err);
                        return res.badRequest(err);
                    }
                    console.log(post)
                    if (post && post === 'successful') {
                        return next();
                    }
                    verifyPayment(userId, txref, postId, function (err, resp) {
                        if (err) {
                            console.log(err);
                            return res.badRequest(err)
                        }
                        console.log('this is were im');
                        console.log(resp);

                        if (message === resp) {
                            return next();
                        } else {
                            if (!txref) {
                                payFromWallet(postId, userId, function (err, result) {
                                    if (err) {
                                        console.log(err);
                                        return res.badRequest(err)
                                    }
                                    console.log(result);
                                    if (message !== result) {
                                        return res.notAllowed('your transaction was not successful please try again ')
                                    }

                                    return next();
                                })
                            } else {
                                console.log('reference was provided');
                                payWithCard(config, txref, postId, userId, function (err, response) {
                                    if (err) {
                                        console.log(err)
                                        return res.badRequest(err)
                                    }
                                    console.log(response);

                                    if (message !== response) {
                                        return res.notAllowed('your transaction was not successful please try again')
                                    }

                                    return next();
                                })
                            }
                        }
                    })
                })
            })
        } else {
            console.log('im here because no token was provided');

            let userId;
            verifyPayment(userId, txref, postId, function (err, resp) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err)
                }
                console.log('this is were im');
                console.log(resp);

                if (message === resp) {
                    return next();
                }
                payWithCard(config, txref, postId, userId, function (err, response) {
                    if (err) {
                        console.log(err)
                        return res.badRequest(err)
                    }
                    console.log(response);

                    if (message !== response) {
                        return res.notAllowed('your transaction was not successful please try again')
                    }

                    return next();
                })
            })
        }
    }
}

module.exports = router;