const express = require('express');
const router = express.Router();

const Package = require('../../models/packages');
let Story = require('../../models/story');
let Question = require('../../models/question');

/*** END POINT FOR GETTING STORY OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/story/:catId', function (req, res) {

    let id = req.params.catId;
    Story.aggregate([
        {$match: {"category.categoryId": id}},
        {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
        {$project: {comments:{$size :"$comments"}, dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, category:1, story:1, createdAt:1, postedBy:1, title:1}},
        {$sort:{comments: -1}}
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data,{
                'path': 'likes.userId dislikes.userId comments.commentedBy category.categoryId',
                'select': 'name photoUrl email bio title'
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

/*** END POINT FOR GETTING QUESTION OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/question/:catId', function (req, res) {

    let id = req.params.catId;
    Question.aggregate([
        {$match: {"category.categoryId": id}},
        {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
        {$project: {comments:{$size :"$comments"},dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, category:1, story:1, postedOn:1,postedBy:1, title:1}},
        {$sort:{date: -1}}

    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Question.populate(data,{
                'path': 'likes.userId dislikes.userId comments.commentedBy category.categoryId',
                'select': 'name photoUrl email bio title'
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

/*** END POINT FOR GETTING PLAN PACKAGES BY ALL USER */
router.get('/packages', function (req, res) {

    Package.find({}, {package_name:1, amount:1, currency:1},function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        console.log(result);
        res.success(result);
    })
});

/*** END POINT FOR GETTING POST OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/trending/story', function (req, res) {

    Story.aggregate([
        {$project: {comments:{$size :"$comments"}, question:1, postedOn:1,postedBy:1}},
        {$sort: {comments: -1}},
        {$limit: 5}

    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data,{
                'path': 'postedBy',
                'select': 'name photoUrl public_id email bio'
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

/*** END POINT FOR GETTING POST OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/trending/question', function (req, res) {
    Question.aggregate([
        {$project: {comments:{$size :"$comments"}, question:1, postedOn:1,postedBy:1}},
        {$sort: {comments: -1}},
        {$limit: 5}

    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data,{
                'path': 'likes.userId dislikes.userId comments.commentedBy',
                'select': 'name photoUrl email bio'
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

module.exports = router;