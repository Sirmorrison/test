let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

const Broadcast = require('../../models/broadcast');
const validator = require('../../utils/validator');
let User = require('../../models/user');

/*** END POINT FOR GETTING ALL Broadcast MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/', function (req, res) {

    let id = req.user.id;
    userVerify(id, function (err, user) {
        if (err) {
            console.log(err)
            return res.badRequest(err)
        }
        let category = user.categoryTags.categoryId;

        Broadcast.aggregate([
            {$match: {'sentTo.categoryId': category}},
            {
                $project: {
                    subject: 1,
                    message: 1,
                    sentBy: 1,
                    createdAt: 1,
                },
            },
            {$sort: {createdAt: -1}},
            {$limit: 30}
        ], function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            Broadcast.populate(data, {
                    'path': 'sentBy response.sentBy',
                    model: 'Admin_user',
                    'select': 'name photoUrl role'
                },
                function (err, post) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }

                    res.success(post);
                }
            );
        })
    });
});

/*** END POINT FOR GETTING ALL Broadcast MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/received', function (req, res) {

    let id = req.user.id;
    userVerify(id, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Broadcast.aggregate([
            {$match: {sentTo: id}},
            {
                $project: {
                    response: {$size: "$response"},
                    subject: 1,
                    sentBy: 1,
                    createdAt: 1,
                },
            },
            {$sort: {createdAt: -1}},
            {$limit: 10}
        ], function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            Broadcast.populate(data, {
                    'path': 'sentBy response.sentBy',
                    model: 'Admin_user',
                    'select': 'name photoUrl role'
                },
                function (err, post) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }

                    res.success(post);
                }
            );
        })
    });
});

/*** END POINT FOR GETTING ALL Broadcast MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/sent', function (req, res) {

    let id = req.user.id;
    userVerify(id, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Broadcast.aggregate([
            {$match: {sentBy: id}},
            {
                $project: {
                    response: {$size: "$response"},
                    subject: 1,
                    sentTo: 1,
                    createdAt: 1,
                },
            },
            {$sort: {createdAt: -1}},
            {$limit: 10}
        ], function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            Broadcast.populate(data, {
                    'path': 'response.sentBy sentTo',
                    model: 'Admin_user',
                    'select': 'name photoUrl role'
                },
                function (err, post) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }

                    res.success(post);
                }
            );
        })
    });
});

/*** END POINT FOR GETTING ALL Broadcast MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/received/:chatId', function (req, res) {

    let chatId = req.params.chatId,
        id = mongoose.Types.ObjectId(chatId);

    Broadcast.aggregate([
        {$match: {"_id": id, sentTo: req.user.id}},
        {
            $project: {
                response: {
                    $map: {
                        input: '$response',
                        as: "element",
                        in: {
                            commentId: "$$element._id",
                            message: "$$element.message",
                            respondedOn: '$$element.createdAt',
                            respondedBy: '$$element.sentBy'
                        }
                    }
                },
                title: 1,
                message: 1,
                sentBy: 1,
                createdAt: 1,
            },
        },
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Broadcast.populate(data, {
                'path': 'postedBy response.sentBy',
                model: 'Admin_user',
                'select': 'name photoUrl role'
            },
            function (err, post) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(post);
            }
        );
    })
});

/*** END POINT FOR GETTING ALL Broadcast MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/sent/:chatId', function (req, res) {

    let chatId = req.params.chatId,
        id = mongoose.Types.ObjectId(chatId);

    Broadcast.aggregate([
        {$match: {"_id": id, sentBy: req.user.id}},
        {
            $project: {
                response: {
                    $map: {
                        input: '$response',
                        as: "element",
                        in: {
                            commentId: "$$element._id",
                            message: "$$element.message",
                            respondedOn: '$$element.createdAt',
                            respondedBy: '$$element.sentBy'
                        }
                    }
                },
                title: 1,
                message: 1,
                sentTo: 1,
                createdAt: 1,
            },
        },
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Broadcast.populate(data, {
                'path': 'sentTo response.sentBy',
                model: 'Admin_user',
                'select': 'name role photoUrl'
            },
            function (err, post) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(post);
            }
        );
    })
});

/*** END POINT FOR SENDING A CHAT MESSAGE BY CURRENTLY LOGGED IN USER */
router.post('/', function (req, res) {
    let message = req.body.message,
        userId = req.body.userId,
        subject = req.body.subject,
        id = req.user.id;

    let validated = validator.isSentence(res, message)&&
        validator.isSentence(res, subject);
    if (!validated) return;

    let data = {
        message : message,
        subject: subject,
        sentBy: id,
        sentTo: userId
    };

    Broadcast.create(data, function (err, story) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        console.log(story);
        return res.success('your message has been sent and will be responded to ASAP')
    })
});

/*** END POINT FOR SENDING A CHAT MESSAGE BY CURRENTLY LOGGED IN USER */
router.post('/:messageId', function (req, res) {
    let message = req.body.message,
        messageId = req.params.messageId,
        id = req.user.id;

    let validated = validator.isSentence(res, message);
    if (!validated) return;

    let data = {
        message : message,
        subject: subject,
        sentBy: id,
    };

    Broadcast.findOne({_id: messageId, sentTo: id}, function (err, chat) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if(!chat){
            return res.badRequest("no chat message found with id provided");
        }
        chat.response.push(data)
        chat.save(function (err, resp) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            res.success(resp)

        })
    })
});

/*** END POINT FOR DELETING ADDRESS BY ID OF CURRENTLY LOGGED IN USER */
router.delete('/:questionId/:answerId', function (req, res) {

    let questionId = req.params.questionId,
        answerId = req.params.answerId,
        id = req.user.id;

    let updateOperation = {
        $pull: {
            'answers.$.rating': {
                ratedBy: id,
            }
        }
    };

    Question.updateOne({_id: questionId, 'answers._id': answerId,
    }, updateOperation, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success({deleted: true});
    });
});

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

function userVerify(id, callback) {
    User.findById(id, function (err, user) {
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

module.exports = router;