let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

// let Story = require('../../models/story');
let Question = require('../../models/question');
let validator = require('../../utils/validator');
let Admin = require('../../models/admin_user');

//QUESTIONS
/*** END POINT FOR GETTING THE TOTAL NUMBER OF QUESTION IN DATABASE AND CATEGORIES BY ADMIN USERS*/
router.get('/dashboard', function (req, res) {

    let userId = req.user.id;
    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Question.aggregate([
            {$facet: {
                "total question": [
                    { $sortByCount: {$sum:1} }
                ],
                "category": [
                    {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
                    {
                        $group: {
                            _id: '$category.categoryId', categoryId:{ $addToSet : '$category.categoryId'},
                            count: {$sum: 1},
                        }
                    },
                    {$sort: {count: -1}}
                ]
            }},
        ], function (err, data) {

            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            Question.populate(data,{
                    'path': 'category.categoryId',
                    // 'model': 'Categories',
                    'select': 'title'
                },

                function (err, post) {

                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }

                    res.success(data);
                }
            );
        });
    });
});

/*** END POINT FOR GETTING QUESTION OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/byCategory/:catId', function (req, res) {

    let catId = req.params.catId,
        id = mongoose.Types.ObjectId(catId);
    let userId = req.user.id;
    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Question.aggregate([
            {$match: {"category.categoryId": id}},
            {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    answers: {$size: "$answers"},
                    views: 1,
                    createdAt: 1,
                    postedBy: 1,
                    question: 1
                }
            },
            {$sort: {createdAt: -1}}

        ], function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            Question.populate(data, {
                    'path': 'postedBy',
                    'select': 'name photoUrl title'
                },

                function (err, post) {

                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }

                    res.success(post);
                }
            );
        });
    });
});

/*** END POINT FOR GETTING THE QUESTION AND ANSWERS INFORMATION USER BY LOGGED IN USERS*/
router.get('/all', function (req, res) {

    let userId = req.user.id;
    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Question.aggregate([
            {
                $project: {
                    answers: {$size: '$comments'},
                    question: 1,
                    postedBy: 1,
                    views: 1,
                    createdAt: 1
                },
            },
            {$sort: {createdAt: -1}},
            {$limit: 10}
        ], function (err, data) {

            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            Question.populate(data, {
                    'path': 'postedBy',
                    // 'model': 'users',
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
        });
    });
});

/*** END POINT FOR GETTING AN ANSWERS TO A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('/:questionId', function (req, res) {

    let questionId = req.params.questionId;
    let id = mongoose.Types.ObjectId(questionId);

    Question.aggregate([
        {$match: {"_id" : id}},
        {$project:
            {answers: {
                $map: {
                    input: '$answers',
                    as: "element",
                    in: {
                        answerId: "$$element._id",
                        answeredOn: '$$element.createdAt',
                        answeredBy: '$$element.answeredBy',
                        answer: "$$element.answer",
                        views: "$$element.views" ,
                        upVotes: { $size: "$$element.likes" },
                        rating: { $avg: "$$element.rating" },
                        downVotes: { $size: "$$element.dislikes" }
                    }
                }
            },
            question:1,
            postedBy: 1
        }
    }], function (err, data) {

        if (err) {
            return res.serverError("Something unexpected happened");
        }
        Question.populate(data,{
                'path': 'postedBy answers.answeredBy',
                'select': 'name photoUrl'
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
});

/*** END POINT FOR DELETING A POST BY A CURRENTLY LOGGED IN USER */
router.delete('/:questionId', function (req, res) {

    let id = req.params.questionId;
    let userId = req.user.id;

    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Question.remove({_id: id}, function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Some error occurred");
            }
            if (!result) {
                return res.badRequest("you re not authorized to perform this action")
            }

            res.success('question successfully deleted')
        })
    })
});

function userVerify(userId, callback) {
    Admin.findById(userId, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("no user found with this id");
        }
        if (user.admin_category !== 'adminSuper') {
            return callback("You are not Authorized Perform this Action");
        }

        return callback(null, user)
    })
}

module.exports = router;