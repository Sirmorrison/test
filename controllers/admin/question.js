let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

let Question = require('../../models/question');
let validator = require('../../utils/validator');
let Admin = require('../../models/admin_user');

//QUESTIONS
/*** END POINT FOR GETTING THE TOTAL NUMBER OF QUESTION IN DATABASE AND CATEGORIES BY ADMIN USERS*/
router.get('/dashboard', function (req, res) {

    let userId = req.user.id;
    Admin.findById(userId, function (err, user) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!user) {
            return res.badRequest("no user found with this id");
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
                            _id: '$category.categoryId'/*, categoryId:{ $addToSet : '$category.categoryId'}*/,
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
                    'path': 'category._id ',
                    'model': 'Categories',
                    'select': 'title'
                },

                function (err) {
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
router.get('/byCategory/:catId', allow('questions'), function (req, res) {

    let catId = req.params.catId,
        id = mongoose.Types.ObjectId(catId);

    Question.aggregate([
        {$match: {"category.categoryId": id}},
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

/*** END POINT FOR GETTING THE QUESTION AND ANSWERS INFORMATION USER BY LOGGED IN USERS*/
router.get('/all', allow('questions'), function (req, res) {

    Question.aggregate([
        {
            $project: {
                answers: {$size: '$answers'},
                question: 1,
                postedBy: 1,
                views: 1,
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

/*** END POINT FOR GETTING THE QUESTION AND ANSWERS INFORMATION USER BY LOGGED IN USERS*/
router.get('/unanswered', allow('questions'), function (req, res) {

    Question.aggregate([
        {$match: {answers:{$size: 0}}},
        {
            $project: {
                answers: {$size: '$answers'},
                question: 1,
                postedBy: 1,
                views: 1,
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

/*** END POINT FOR GETTING THE QUESTION AND ANSWERS INFORMATION USER BY LOGGED IN USERS*/
router.get('/answered', allow('questions'), function (req, res) {

    Question.aggregate([
        {$match: {$nor: [{answers: {$size: 0}}]}},
        {
            $project: {
                answers: {$size: '$answers'},
                question: 1,
                postedBy: 1,
                views: 1,
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

/*** END POINT FOR GETTING AN A QUESTION AND ANSWERS BY LOGGED IN ADMIN USERS*/
router.get('/:questionId', allow('questions'), function (req, res) {

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

/*** END POINT FOR DELETING A QUESTION BY A CURRENTLY LOGGED IN USER */
router.delete('/:questionId', allow('questions'), function (req, res) {

    let id = req.params.questionId;
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