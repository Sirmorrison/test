let express = require('express');
let router = express.Router();
let nodemailer = require('nodemailer');
let mongoose = require("mongoose");

const config = require('../../config');
let cloudinary = require('cloudinary');
cloudinary.config(config.cloudinary);

const protector = require('../../middlewares/protector');
const Transaction = require('../../models/transactions');
let Answer = require('../../models/answers');
let Question = require('../../models/question');
let validator = require('../../utils/validator');
let User = require('../../models/user');
let Packages = require('../../models/packages');
let Notification = require('../../models/notification');

/*** END POINT FOR GETTING AN ANSWERS TO A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('/:questionId/:answerId', allow('successful'), function (req, res) {
    let questionId = req.params.questionId,
        answerId = req.params.postId;
    let id = mongoose.Types.ObjectId(answerId);

    Answer.update({
            "_id": questionId,
            'answers._id': id
        },
        {$inc: {'answers.$.views': 1}}, function (err) {
            if (err) {
                console.log(err);
            }

            Answer.aggregate([
                {$match: {"answers._id": id}},
                {
                    $project: {
                        answers: {
                            $map: {
                                input: '$answers',
                                as: "element",
                                in: {
                                    answerId: "$$element._id",
                                    answer: "$$element.answer",
                                    attachment: '$$element.attachment',
                                    answeredOn: '$$element.createdAt',
                                    answeredBy: '$$element.answeredBy',
                                    views: "$$element.views",
                                    upVotes: {$size: "$$element.likes"},
                                    downVotes: {$size: "$$element.dislikes"}
                                }
                            }
                        }, question: 1, views: 1, postedBy: 1, 'category.categoryId':1
                    }
                }], function (err, data) {

                if (err) {
                    return res.serverError("Something unexpected happened");
                }
                Answer.populate(data, {
                        'path': 'postedBy answers.answeredBy category.categoryId',
                        'select': 'name photoUrl title'
                    },
                    function (err, data) {

                        if (err) {
                            console.log(err);
                            return res.badRequest("Something unexpected happened");
                        }

                        res.success(data);
                    }
                );
            })
        })
});

/*** END POINT FOR COMMENTING ON A POST OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.post('/:questionId', protector.protect, function (req, res) {
    let answer = req.body.answer,
        userId = req.user.id,
        file = req.files,
        view_cost = req.body.view_cost,
        postId = req.params.questionId;

    let validated = validator.isSentence(res, answer) &&
        validator.isDetails(res, view_cost);
    if (!validated) return;
console.log(validated)
    validViewCost(userId, function (err, info) {
        if (err) {
            console.log(err)
            return res.badRequest(err);
        }
        if (view_cost.amount < 0 || view_cost.amount > info.answers.max.amount) {
            return res.badRequest("view cost cannot be less than zero or greater than your package maximum allowed pricing of: USD " + info.answers.max.amount);
        }
        if(file){
            uploadMany(file, function (err, result) {
                if (err) {
                    console.log(err)
                    return res.badRequest(err);
                }
                let values = {
                    answer: answer,
                    answeredBy: userId,
                    view_cost: view_cost,
                    attachment: result,
                    postId: postId
                };

                createAnswer(values, postId, userId, function (err, data) {
                    if (err) {
                        console.log(err)
                        return res.badRequest(err);
                    }

                    res.success(data)
                })
            })
        }else {

            let values = {
                answer: answer,
                answeredBy: userId,
                view_cost: view_cost,
                postId: postId
            };

            createAnswer(values, postId, function (err, data) {
                if (err) {
                    console.log(err)
                    return res.badRequest(err);
                }

                res.success(data)
            })
        }
    });
});

/*** END POINT FOR EDITING ANSWER ON A QUESTION*/
router.put('/:answerId', protector.protect, function (req,res) {

    let answerId = req.params.answerId,
        id = req.user.id,
        answer = req.body.answer;

    let validated = validator.isSentence(res, answer);
    if (!validated) return;

    Answer.updateOne({
            "_id": answerId,
            "answeredBy": id,
        },
        {$set: {"answer": answer}},
        function (err, result) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }

            Answer.findOne({_id: questionId}, function (err, question) {
                if (err) {
                    console.log(err);
                    return res.serverError("Something unexpected happened");
                }

                let data = {
                    questionId: question._id,
                    question: question.question,
                    answerId: question.answers.id(answerId)._id,
                    answer: question.answers.id(answerId).answer
                };

                res.success(data)
            })
        })
});

/*** END POINT FOR DELETING ANSWER ON A QUESTION*/
router.delete('/:questionId/:answerId', protector.protect, function (req, res) {

    let questionId = req.params.questionId,
        answerId = req.params.answerId,
        id = req.user.id;

    Answer.findOne({_id: questionId}, function (err, question) {
        if (err) {
            return res.serverError("Something unexpected happened");
        }
        if(question.answers.id(answerId).answeredBy !== id){
            let err = new Error('you re not authorized');
            console.log(err)
            return res.notAllowed(err);
        }else {
            if (question.answers.id(answerId).attachment) {
                let list = question.answers.id(answerId).attachment;
                deleteMany(list, function (err, result) {
                    if (err) {
                        console.log(err);
                        return res.badRequest(err);
                    }
                    console.log(result);

                    question.answers.id(answerId).remove();
                    question.save(function (err, resp) {
                        if (err) {
                            console.log(err);
                            return res.serverError("Something unexpected happened");
                        }
                        console.log(resp);
                        res.success('answer deleted successfully')
                    });
                })
            } else {

                question.answers.id(answerId).remove();
                question.save(function (err, resp) {
                    if (err) {
                        console.log(err);
                        return res.serverError("Something unexpected happened");
                    }
                    console.log(resp);
                    res.success('answer deleted successfully')
                });
            }
        }
    });
});

function validViewCost(userId, callback) {
    User.findOne({_id: userId}, function (err, user) {
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
            console.log(pack)

            return callback(null, pack)
        });
    })
}

function notification(postId,ownerId,userId, callback) {
    userPro(postId,ownerId,userId, function (err, result) {
        if (err){
            console.log(err);
            return callback('something unexpected happened');
        }

        console.log('im here');
        if(result.notification === false) {
            return callback(null);
        }

        let smtpTransport = nodemailer.createTransport({
            service: 'gmail',
            auth:{user: config.gmail.username, pass: config.gmail.password}
        });
        console.log(smtpTransport);

        let  mailOptions = {
            to: result.email,
            // to: 'edonomorrison@gmail.com',
            from:'oneplacesuppport@gmail.com',
            subject: 'activity notification',
            text: result.username+' just commented on your post on askOleum .\n\n'+
            'Please click on the following link, or paste this into your browser to view: \n\n' +
            //'http://'+ req.headers.host + "/post/comments/:" + storyId + "/:" + commentId + '\n\n ' +
            'if you do not want to be getting these mails please go login into your profile and deactivate the option. \n'
        };

        smtpTransport.sendMail(mailOptions, function (err, f) {
            if (err){
                console.log(err)
                return callback(err);
            }

            console.log(f)
        });
    })
}

function userPro(postId,ownerId,userId, callback) {

    let ids = [ userId, ownerId];
    User.find({_id: ids}, function (err, user) {
        if (err){
            console.log(err);
            return callback('something unexpected happened');
        }
        if(!user){
            return callback('something unexpected happened');
        }

        let info = {
            message: user[0].name+' posted an answer to your question',
            postId: postId,
            ownerId: ownerId,
            userId: userId
        };

        Notification.create(info, function (err, note) {
            if (err){
                console.log(err);
                return callback('something unexpected happened');
            }

        });

        let data = {};
            data.username = user[0].name;
        if(user && user[1]){
            data.notification = user[1].notification;
            data.email = user[1].email;
        }else{
            data.notification = user[0].notification;
            data.email = user[0].email;
        }

        return callback(null, data)
    })
}

function uploadMany(file, callback) {
    console.log(file.length);

    if(file.length > 8){
        return res.badRequest('you can not upload more than 8 pictures at a time')
    }
    if(file.length > 1) {
        console.log('stuck here');
        let res_promise = file.map(file => new Promise((resolve, reject) => {
            cloudinary.v2.uploader.upload(file.path, {resource_type: 'auto'}, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err)
                }
                else {
                    let data = {
                        public_id: result.public_id,
                        mediaUrl: result.secure_url,
                        mediaType: result.resource_type
                    };

                    resolve(data)
                }
            })
        }));
        Promise.all(res_promise)
            .then(result => callback(null, result))
            .catch((err) => callback(err))
    }else {
        console.log('i have a file thytedeeddd');
        cloudinary.v2.uploader.upload(file.path, {resource_type: 'auto'}, function (err, result) {
            if (err) {
                console.log(err);
                return callback(err)
            }
            let data = {
                public_id: result.public_id,
                mediaUrl: result.secure_url,
                mediaType: result.resource_type
            };

            return callback(null, data)
        })
    }
}

function createAnswer(values, postId, userId, callback) {
    Question.findOne({_id: postId}, function (err, quest) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!quest) {
            return callback("no question found with detais provided");
        }

        let postId = quest._id,
            ownerId = quest.postedBy;

        Answer.create(values, function (err, resp) {
            if (err) {
                console.log(err);
                return callback("Something unexpected happened");
            }

            let data = {
                questionId: resp.postId,
                answerId: resp._id,
                answer: resp.answer
            };

            User.update(
                {"_id": userId},
                {$inc: {rating: 100}}, function (err, f) {
                    if (err) {
                        console.log(err);
                    }
                }
            );
            notification(postId, ownerId, userId, function (err, note) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err)
                }

                console.log(note)
            });

            return callback(null, data);
        });
    })
}

function deleteMany(data, callback) {

    let res_promise = data.map(file => new Promise((resolve, reject) => {
        cloudinary.v2.uploader.destroy(file.public_id, function (err, result) {
            if (err) {
                console.log(err);
                reject(err)
            }
            else {
                resolve(result)
            }
        })
    }));
    Promise.all(res_promise)
        .then(result => callback(null, result))
        .catch((err) => callback(err))
}

//payment(not done)
function getPostInfo(postId, userId, callback) {
    Answer.findOne({'answers._id': postId}, function (err, question) {
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
        if (question.answers.id(postId).view_cost.amount <= 0) {
            console.log('answer is free');
            return callback(null, 'successful');
        }

        let details = {
            view_cost: question.answers.id(postId).view_cost.amount,
            currency: question.answers.id(postId).view_cost.currency,
            postedBy: question.answers.id(postId).answeredBy,
            questionBy: question.postedBy
        };

        return callback(null, details)
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
        let view_cost = post.question.answers.id(postId).view_cost.amount,
            currency = post.question.answers.id(postId).view_cost.currency,
            answeredBy = post.question.answers.id(postId).answeredBy,
            postedBy = post.question.postedBy;

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
    if(!txref){
        return callback('no payment receipt ref found')
    }
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
                        if (!data) {
                            console.log('i didnt found a payment 1')
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
            if(!info){
                console.log('i didnt found a payment 3')
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