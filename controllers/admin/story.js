let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

let Story = require('../../models/story');
let Admin_post = require('../../models/admin_post');
let validator = require('../../utils/validator');
let Admin = require('../../models/admin_user');
let arrayUtils = require('../../utils/array');
let Category = require('../../models/categories');


//STORIES
/*** END POINT FOR GETTING THE QUESTION AND ANSWERS INFORMATION USER BY LOGGED IN USERS*/
router.get('/', function (req, res) {

    let userId = req.user.id;
    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Story.aggregate([
            {
                $facet: {
                    "total Stories": [
                        {$sortByCount: {$sum: 1}}
                    ],
                    "category": [
                        {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
                        {
                            $group: {
                                _id: '$category.categoryId', categoryId: {$addToSet: '$category.categoryId'},
                                count: {$sum: 1},
                            }
                        },
                        {$sort: {count: -1}}
                    ]
                }
            },
        ], function (err, data) {

            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            Story.populate(data, {
                    'path': 'category.categoryId',
                    // 'model': 'Categories',
                    'select': 'title'
                },

                function (err, post) {

                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }
                    if (!post) {
                        return res.success([]);
                    }

                    res.success(data);
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
        Story.aggregate([
            {
                $project: {
                    comments: {$size: '$comments'},
                    likes: {$size: '$likes'},
                    dislikes: {$size: '$likes'},
                    story: 1,
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

            Story.populate(data, {
                    'path': 'postedBy',
                    // 'model': 'users',
                    'select': 'name photoUrl'
                },

                function (err, post) {

                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }
                    if (!post) {
                        return res.success([]);
                    }

                    res.success(post);
                }
            );
        });
    });
});

/*** END POINT FOR GETTING THE COMMENTS ON A STORY OF A USER BY LOGGED IN USERS*/
router.get('/:storyId', function (req, res) {
    let storyId = req.params.storyId,
        id = mongoose.Types.ObjectId(storyId);

    Story.update(
        {"_id": storyId},
        {$inc: {views: 1}}, function (err) {
            if (err) {
                console.log(err)
            }

            Story.aggregate([
                {$match: {"_id": id}},
                {
                    $project: {
                        comments: {
                            $map: {
                                input: '$comments',
                                as: "element",
                                in: {
                                    commentId: "$$element._id",
                                    comment: "$$element.comment",
                                    commentedOn: '$$element.createdAt',
                                    commentedBy: '$$element.commentedBy',
                                    likes: {$size: "$$element.likes"},
                                    dislikes: {$size: "$$element.dislikes"}
                                }
                            }
                        }, story: 1, postedBy: 1, views: 1, category: 1
                    }
                },
            ], function (err, data) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                Story.populate(data, {
                        'path': 'postedBy comments.commentedBy',
                        'select': 'name email photoUrl '
                    },

                    function (err, post) {

                        if (err) {
                            console.log(err);
                            return res.badRequest("Something unexpected happened");
                        }
                        if (!post) {
                            return res.success([]);
                        }

                        res.success(post);
                    }
                );
            })
        });
});

/*** END POINT FOR POST CREATION CONTAINING FILE TO BE UPLOADED BY A CURRENTLY LOGGED IN USER */
router.post('/', function (req, res) {

    let message = req.body.message,
        userId = req.user.id,
        cate_tags = req.body.category;

    let validated = validator.isSentence(res, message) &&
        validator.isCategory(res, cate_tags);

    if (!validated)
        return;

    //remove duplicates before proceeding
    arrayUtils.removeDuplicates(cate_tags);

    Category.find({_id: cate_tags}, function (err, cate) {
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
            posterId: userId,
            category: categoryTags
        };

        Admin_post.create(data, function (err, post) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }

            let data = {
                postId: post._id,
                message: post.message,
                postedOn: post.postedOn,
                posterId: post.posterId
            };

            res.success(data);
        });
    });
});

/*** END POINT FOR DELETING A POST BY A CURRENTLY LOGGED IN USER */
router.delete('/:storyId', function (req, res) {

    let id = req.params.storyId;
    let userId = req.user.id;

    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Story.remove({_id: id}, function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Some error occurred");
            }
            if (!result) {
                return res.badRequest("no post found with that id")
            }

            res.success('question successfully deleted')
        })
    })
});

/*** END POINT FOR DELETING A POST BY A CURRENTLY LOGGED IN USER */
router.delete('/:broadcastId', function (req, res) {

    let id = req.params.broadcastId;
    let userId = req.user.id;

    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Admin_post.remove({_id: id}, function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Some error occurred");
            }
            if (!result) {
                return res.badRequest("no post found with that id")
            }

            res.success('broadcast successfully deleted')
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