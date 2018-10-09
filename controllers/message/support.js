let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

const User = require('../../models/user');
const Broadcast = require('../../models/broadcast');
const Support = require('../../models/support');
const validator = require('../../utils/validator');
//YOU RE TO TEST ADMIN AND USER SIDE OF SUPPORT THEN GO TO ADMIN AND USER SIDE
//OF BROADCAST TODAY WHEN YOU TURN ON LAPTOP

/*** END POINT FOR GETTING ALL SUPPORT MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/support', function (req, res) {

    let id = req.user.id;
    Support.aggregate([
        {$match: {postedBy: id}},
        {
            $project: {
                'total response': {$size: "$response"},
                title: 1,
                postedBy: 1,
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

/*** END POINT FOR GETTING ALL SUPPORT MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/broadcast', function (req, res) {

    let id = req.user.id;
    User.aggregate([
        {$match: {_id: id}},
        {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
        {
            $project: {
                name: 1,
                'categoryTags.categoryId': 1,
            },
        }], function (err, user) {
        if (err) {
            console.log(err)
            return res.badRequest('something happened')
        }
        if (!user) {
            return res.badRequest('no user found with details provided')
        }
        let id = user.categoryTags.categoryId;
        Support.aggregate([
            {$match: {'sentTo.categoryId': id}},
            {
                $project: {
                    'total response': {$size: "$response"},
                    title: 1,
                    postedBy: 1,
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
});

/*** END POINT FOR GETTING ALL SUPPORT MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/:supportId', function (req, res) {

    let supportId = req.params.supportId;
        // id = mongoose.Types.ObjectId(supportId);

    Support.findById(supportId)
        .populate({
            path: 'postedBy ',
            model: 'User',
            select: 'name photoUrl'
        })
        .populate({
            path: 'response.sentBy',
            model: 'Admin_user',
            select:'name photoUrl'
        })
        .exec(function(err, data) {
            if (err){
                return res.badRequest("Something unexpected happened");
            }
            if (!data) {
                return res.badRequest("could not find user with id: "+ req.params.userId);
            }

            let info = {
                message: data.message,
                photo: data.title,
                response: data.response,
                postedBy: data.postedBy,
                createdAt: data.createdAt
            };

            res.success(info);
        });
    // Support.aggregate([
    //     {$match: {"_id": id, postedBy: req.user.id}},
    //     {
    //         $project: {
    //             response: {
    //                 $map: {
    //                     input: '$response',
    //                     as: "element",
    //                     in: {
    //                         commentId: "$$element._id",
    //                         message: "$$element.message",
    //                         respondedOn: '$$element.createdAt',
    //                         respondedBy: '$$element.sentBy'
    //                     }
    //                 }
    //             },
    //             title: 1,
    //             message: 1,
    //             postedBy: 1,
    //             createdAt: 1,
    //         },
    //     },
    // ], function (err, data) {
    //     if (err) {
    //         console.log(err);
    //         return res.badRequest("Something unexpected happened");
    //     }
    //
    //     Support.populate(data, {
    //             'path': 'postedBy response.sentBy',
    //             'select': 'name photoUrl'
    //         },
    //         function (err, post) {
    //             if (err) {
    //                 console.log(err);
    //                 return res.badRequest("Something unexpected happened");
    //             }
    //
    //             res.success(post);
    //         }
    //     );
    // })
});

/*** END POINT FOR CREATING A SUPPORT MESSAGE BY CURRENTLY LOGGED IN USER */
router.post('/', function (req, res) {
    let message = req.body.message,
        title = req.body.title,
        id = req.user.id;

    let validated = validator.isSentence(res, message)&&
                    validator.isSentence(res, title);
    if (!validated) return;

    let data = {
        message : message,
        title: title,
        postedBy: id
    };

    Support.create(data, function (err, story) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        console.log(story);
        return res.success('your message has been sent and will be responded to ASAP')
    })

});

// /*** END POINT FOR CREATING A SUPPORT MESSAGE BY CURRENTLY LOGGED IN USER */
// router.post('/response', function (req, res) {
//     let message = req.body.message,
//         title = req.body.title,
//         id = req.user.id;
//
//     let validated = validator.isSentence(res, message)&&
//         validator.isSentence(res, title);
//     if (!validated) return;
//
//     let data = {
//         message : message,
//         title: title,
//         sentBy: id
//     };
//
//     Support.create(data, function (err, story) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//
//         console.log(story);
//         return res.success('your message has been sent and will be responded to ASAP')
//     })
//
// });

// /*** END POINT FOR DELETING ADDRESS BY ID OF CURRENTLY LOGGED IN USER */
// router.delete('/:questionId/:answerId', function (req, res) {
//
//     let questionId = req.params.questionId,
//         answerId = req.params.answerId,
//         id = req.user.id;
//
//     let updateOperation = {
//         $pull: {
//             'answers.$.rating': {
//                 ratedBy: id,
//             }
//         }
//     };
//
//     Question.updateOne({_id: questionId, 'answers._id': answerId,
//     }, updateOperation, function (err) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Some error occurred");
//         }
//
//         res.success({deleted: true});
//     });
// });

module.exports = router;