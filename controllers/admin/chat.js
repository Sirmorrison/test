let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

const Chat = require('../../models/chats');
const validator = require('../../utils/validator');
let Admin = require('../../models/admin_user');

/*** END POINT FOR GETTING ALL CHAT MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/', allow('messages'), function (req, res) {

    Chat.aggregate([
        {
            $project: {
                response: {$size: "$response"},
                subject: 1,
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

        Chat.populate(data, {
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

/*** END POINT FOR GETTING ALL Chat MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/received', function (req, res) {

    let id = req.user.id;
    userVerify(id, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Chat.aggregate([
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

            Chat.populate(data, {
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

/*** END POINT FOR GETTING ALL Chat MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/sent', function (req, res) {

    let id = req.user.id;
    userVerify(id, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Chat.aggregate([
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

            Chat.populate(data, {
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

/*** END POINT FOR GETTING ALL Chat MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/received/:chatId', function (req, res) {

    let chatId = req.params.chatId,
        chat = mongoose.Types.ObjectId(chatId);
    let id = req.user.id;
    userVerify(id, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Chat.aggregate([
            {$match: {"_id": chat, sentTo: req.user.id}},
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

            Chat.populate(data, {
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
});

/*** END POINT FOR GETTING ALL Chat MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/sent/:chatId', function (req, res) {

    let chatId = req.params.chatId,
        chat = mongoose.Types.ObjectId(chatId);
    let id = req.user.id;
    userVerify(id, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }

        Chat.aggregate([
            {$match: {"_id": chat, sentBy: id}},
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

            Chat.populate(data, {
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
});

/*** END POINT FOR SENDING A CHAT MESSAGE BY CURRENTLY LOGGED IN USER */
router.post('/', function (req, res) {
    let message = req.body.message,
        userId = req.body.userId,
        subject = req.body.subject,
        id = req.user.id;

    userVerify(id, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        if (userId === id) {
            return res.badRequest('you cannot send private chat messages to yourself')
        }
        let validated = validator.isSentence(res, message) &&
            validator.isSentence(res, subject);
        if (!validated) return;

        let data = {
            message: message,
            subject: subject,
            sentBy: id,
            sentTo: userId
        };

        Chat.create(data, function (err, story) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            Chat.populate(story, {
                    'path': 'sentBy sentTo',
                    model: 'Admin_user',
                    'select': 'name photoUrl role'
                },
                function (err, post) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }
                    let data = {
                        chatId: post._id,
                        createdAt: post.createdAt,
                        message: post.message,
                        subject: post.subject,
                        sentTo: post.sentTo,
                    };

                    console.log(data);
                    return res.success(data)
                })
        });
    });
});

/*** END POINT FOR SENDING A CHAT MESSAGE BY CURRENTLY LOGGED IN USER */
router.post('/:chatId', function (req, res) {
    let message = req.body.message,
        chatId = req.params.chatId,
        id = req.user.id;

    let validated = validator.isSentence(res, message);
    if (!validated) return;

    let data = {
        message: message,
        sentBy: id,
    };

    Chat.findOne({_id: chatId, sentTo: id}, function (err, chat) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!chat) {
            return res.badRequest("you are not authorized to view the message with id provided");
        }
        chat.response.push(data);
        chat.save(function (err, resp) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            Chat.populate(resp, {
                    'path': 'sentBy sentTo response.sentBy',
                    model: 'Admin_user',
                    'select': 'name photoUrl role'
                },
                function (err, post) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }
                    let data = {
                        chatId: post._id,
                        createdAt: post.createdAt,
                        message: post.message,
                        subject: post.subject,
                        sentTo: post.sentTo,
                        sentBy: post.sentBy,
                        response: post.response
                    };

                    console.log(data);
                    return res.success(data)

                })
        })
    });
});

/*** END POINT FOR DELETING ADDRESS BY ID OF CURRENTLY LOGGED IN USER */
router.delete('/:chatId', function (req, res) {

    let chatId = req.params.chatId,
        id = req.user.id;
    userVerify(id, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Chat.remove({_id: chatId}, function (err) {
            if (err) {
                console.log(err);
                return res.badRequest("Some error occurred");
            }

            res.success({deleted: true});
        });
    });
});

/*** END POINT FOR DELETING ADDRESS BY ID OF CURRENTLY LOGGED IN USER */
router.delete('/:chatId/:responseId', function (req, res) {

    let chatId = req.params.chatId,
        responseId = req.params.responseId,
        id = req.user.id;
    userVerify(id, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        let updateOperation = {
            $pull: {
                'response': {
                    _id: responseId,
                }
            }
        };

        Chat.updateOne({_id: chatId,}, updateOperation, function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Some error occurred");
            }
            if(result.nModified === 0){
                return res.success('response has either been deleted or does not exist')
            }
            Chat.findOne({_id: chatId}, function (err, chat) {
                if (err) {
                    return res.badRequest("Something unexpected happened");
                }
                Chat.populate(chat, {
                        'path': 'sentBy sentTo response.sentBy',
                        model: 'Admin_user',
                        'select': 'name photoUrl role'
                    },
                    function (err, post) {
                        if (err) {
                            console.log(err);
                            return res.badRequest("Something unexpected happened");
                        }
                        let data = {
                            chatId: post._id,
                            createdAt: post.createdAt,
                            message: post.message,
                            subject: post.subject,
                            sentTo: post.sentTo,
                            sentBy: post.sentBy,
                            response: post.response
                        };

                        console.log(data);
                        return res.success(data)
                    })
            });
        });
    });
})

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
    Admin.findById(id, function (err, user) {
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