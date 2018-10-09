let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

const Broadcast = require('../../models/broadcast');
const validator = require('../../utils/validator');
let Admin = require('../../models/admin_user');
let arrayUtils = require("../../utils/array.js");
let Category = require('../../models/categories');


/*** END POINT FOR GETTING ALL BROADCAST MESSAGES BY CURRENTLY LOGGED IN USER */
router.get('/',  function (req, res) {

    Broadcast.aggregate([
        {
            $project: {
                response: {$size: "$response"},
                subject: 1,
                sentBy: 1,
                'sentTo.categoryId': 1,
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
                'path': 'sentBy response.sentBy sentTo.categoryId',
                'select': 'name photoUrl role title'
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

/*** END POINT FOR GETTING ALL BROADCAST MESSAGES BY CURRENTLY LOGGED IN USER */
router.get('/:broadcastId',  function (req, res) {
    let chatId = req.params.broadcastId,
        id = mongoose.Types.ObjectId(chatId);

    Broadcast.aggregate([
        {$match: {_id: id}},
        {
            $project: {
                response: 1,
                subject: 1,
                message: 1,
                sentBy: 1,
                'sentTo.categoryId': 1,
                createdAt: 1,
            },
        },
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Broadcast.populate(data, {
                'path': 'sentBy response.sentBy sentTo.categoryId',
                'select': 'name photoUrl role title'
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
router.post('/', allow('messages'),function (req, res) {
    let message = req.body.message,
        cate_tags = req.body.categoryId,
        subject = req.body.subject,
        id = req.user.id;

    let validated = validator.isSentence(res, message) &&
        validator.isCategory(res, cate_tags) &&
        validator.isSentence(res, subject);
    if (!validated) return;

    //remove duplicates before proceeding
    arrayUtils.removeDuplicates(cate_tags);
    Category.find({_id: cate_tags}, function (err) {
        if (err && err.name === "CastError") {
            return res.badRequest("category error please pick from the available categories");
        }
        if (err) {
            return res.badRequest("something unexpected happened");
        }

        let categoryTags = []; //new empty array
        for (let i = 0; i < cate_tags.length; i++) {
            let cateId = cate_tags[i];

            if (typeof(cateId) !== "string") {
                return res.badRequest("category IDs in tagged array must be string");
            }

            categoryTags.push({categoryId: cateId});
        }

        let data = {
            message: message,
            subject: subject,
            sentBy: id,
            sentTo: categoryTags
        };

        Broadcast.create(data, function (err, cast) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            return res.success('broadcast message sent successfully')
        })
    });
});

/*** END POINT FOR SENDING A CHAT MESSAGE BY CURRENTLY LOGGED IN USER */
router.put('/:messageId', function (req, res) {
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

    Messages.findOne({_id: messageId, sentTo: id}, function (err, chat) {
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
router.delete('/:broadcastId', allow('messages'), function (req, res) {

    let broadcastId = req.params.broadcastId;

    Broadcast.remove({_id: broadcastId}, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success('SUCCESS: Broadcast deleted successfully');
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

module.exports = router;