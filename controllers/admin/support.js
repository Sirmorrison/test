let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

const Support = require('../../models/support');
const validator = require('../../utils/validator');
let Admin = require('../../models/admin_user');

/*** END POINT FOR GETTING ALL SUPPORT MESSAGE BY CURRENTLY LOGGED IN ADMIN USER */
router.get('/', allow('messages'), function (req, res) {

    Support.aggregate([
        {
            $project: {
                'total response': {$size: "$response"},
                    // response: {
                //     $map: {
                //         input: '$response',
                //         as: "element",
                //         in: {
                //             commentId: "$$element._id",
                //             message: "$$element.message",
                //             respondedOn: '$$element.createdAt',
                //             respondedBy: '$$element.sentBy'
                //         }
                //     }
                // },
                title: 1,
                // message: 1,
                postedBy: 1,
                createdAt: 1,
            }
        },
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Support.populate(data, {
                'path': 'postedBy',
                'select': 'name photoUrl'
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

/*** END POINT FOR GETTING ALL SUPPORT MESSAGE BY CURRENTLY LOGGED IN ADMIN USER */
router.get('/:supportId', allow('messages'), function (req, res) {

    let supportId = req.params.supportId,
        id = mongoose.Types.ObjectId(supportId);
    
    Support.aggregate([
        {$match: {"_id": id}},
        {
            $project: {
                response: {
                    $map: {
                        input: '$response',
                        as: "element",
                        in: {
                            responseId: "$$element._id",
                            message: "$$element.message",
                            respondedOn: '$$element.createdAt',
                            respondedBy: '$$element.sentBy'
                        }
                    }
                },
                title: 1,
                message: 1,
                postedBy: 1,
                createdAt: 1,
            }
        },
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Support.populate(data, {
                'path': 'postedBy response.sentBy',
                'select': 'name photoUrl'
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

/*** END POINT FOR RESPONDING TO A SUPPORT MESSAGE BY CURRENTLY LOGGED IN ADMIN USER */
router.post('/:supportId', allow('messages'), function (req, res) {
    let message = req.body.message,
        supportId = req.params.supportId,
        id = req.user.id;

    let validated = validator.isSentence(res, message);
    if (!validated) return;

    let data = {
        message : message,
        sentBy: id
    };

    Support.findOne({_id: supportId}, function (err, support) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!support){
            return res.badRequest("no message post found with the id provided")
        }
        support.response.push(data);
        support.save(function (err, detail) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            let info = {
                message: detail.message,
                title: detail.title,
                response: detail.response,
                supportId: detail._id,
            };

            res.success(info)
        });
    })
});

/*** END POINT FOR DELETING ADDRESS BY ID OF CURRENTLY LOGGED IN USER */
router.delete('/:supportId/:responseId', allow('messages'), function (req, res) {

    let supportId = req.params.supportId,
        responseId = req.params.responseId;

    let updateOperation = {
        $pull: {
            'response': {
                _id: responseId,
            }
        }
    };

    Support.updateOne({_id: supportId,
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

module.exports = router;