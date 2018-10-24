let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

let validator = require('../../utils/validator');
let Category = require('../../models/categories');
let Blog = require('../../models/blog');
let Package = require('../../models/packages'),
    Story = require('../../models/story'),
    Broadcast = require('../../models/broadcast'),
    Question = require('../../models/question'),
    User = require('../../models/user');


/*** END POINT FOR SEARCHING FOR A USER BY TEXT*/
router.get('/search/user/:search', function (req, res) {

    let search = req.params.search;
    let v = validator.isWord(res, search);
    if (!v) return;

    User.aggregate(
        [
            {$match: {$text: {$search: search}}},
            {$project: {photoUrl:1, name:1, score: {$meta: "textScore"}}},
            {$match: {score: {$gt: 1.0}}},
            {$limit: 5}
        ], function (err, data) {
            console.log(data)

            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            res.success(data);
        });
});

/*** END POINT FOR SEARCHING FOR A QUESTION BY TEXT*/
router.get('/search/question/:search', function (req, res){

    let search = req.params.search;
    let v = validator.isWord(res, search);
    if (!v) return;

    Question.aggregate(
        [
            {$match: {$text: {$search: search}}},
            {$project: {question:1, score: {$meta: "textScore"}}},
            // {$match: {score: {$gt: 1.0}}},
            {$limit: 5}
        ], function (err, question) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            if (!question) {
                console.log(err);
                return res.badRequest("no question found with the query parameter ", search );
            }

            res.success(question);
        }
    )
});

/*** END POINT FOR SEARCHING FOR A STORY BY TEXT*/
router.get('/search/story/:search', function (req, res){

    let search = req.params.search;
    let v = validator.isWord(res, search);
    if (!v) return;

    Story.aggregate(
        [
            {$match: {$text: {$search: search}}},
            {$project: {title:1, score: {$meta: "textScore"}}},
            {$match: {score: {$gt: 1.0}}},
            {$limit: 5}
        ], function (err, story) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            if (!story) {
                console.log(err);
                return res.badRequest("no story found with the query parameter ", search );
            }

            res.success(story);
        }
    );
});

/*** END POINT FOR SEARCHING FOR A BLOG BY TEXT*/
router.get('/search/blog/:search', function (req, res){

    let search = req.params.search;
    let v = validator.isWord(res, search);
    if (!v) return;

    Blog.aggregate(
        [
            {$match: {$text: {$search: search}}},
            {$project: {title:1, score: {$meta: "textScore"}}},
            {$match: {score: {$gt: 1.0}}},
            {$limit: 5}
        ], function (err, story) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            if (!story) {
                console.log(err);
                return res.badRequest("no story found with the query parameter ", search );
            }

            res.success(story);
        }
    );
});

/*** END POINT FOR SEARCHING FOR A STORY BY TEXT*/
router.get('/search/all/:search', function (req, res) {

    let search = req.params.search;
    let v = validator.isWord(res, search);
    if (!v) return;

    Story.aggregate(
        [
            {$match: {$text: {$search: search}}},
            {$project: {title: 1, postedBy: 1, score: {$meta: "textScore"}}},
            {$match: {score: {$gt: 0.5}}},
            {$limit: 20},
        ], function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            Story.populate(data, {
                    'path': 'postedBy',
                    'select': 'name photoUrl'
                },
                function (err, story) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }
                    Question.aggregate(
                        [
                            {$match: {$text: {$search: search}}},
                            {$project: {question: 1, postedBy: 1, score: {$meta: "textScore"}}},
                            {$match: {score: {$gt: 0.5}}},
                            {$limit: 20}
                        ], function (err, data) {
                            if (err) {
                                console.log(err);
                                return res.badRequest("Something unexpected happened");
                            }
                            Question.populate(data, {
                                    'path': 'postedBy',
                                    'select': 'name photoUrl'
                                },
                                function (err, question) {

                                    if (err) {
                                        console.log(err);
                                        return res.badRequest("Something unexpected happened");
                                    }
                                    Blog.aggregate(
                                        [
                                            {$match: {$text: {$search: search}}},
                                            {$project: {title: 1, postedBy: 1, score: {$meta: "textScore"}}},
                                            {$match: {score: {$gt: 0.5}}},
                                            {$limit: 20}
                                        ], function (err, data) {
                                            if (err) {
                                                console.log(err);
                                                return res.badRequest("Something unexpected happened");
                                            }
                                            Blog.populate(data, {
                                                    'path': 'postedBy',
                                                    'select': 'name photoUrl'
                                                },
                                                function (err, blog) {

                                                    if (err) {
                                                        console.log(err);
                                                        return res.badRequest("Something unexpected happened");
                                                    }
                                                    User.aggregate(
                                                        [
                                                            {$match: {$text: {$search: search}}},
                                                            {
                                                                $project: {
                                                                    photoUrl: 1,
                                                                    name: 1,
                                                                    score: {$meta: "textScore"}
                                                                }
                                                            },
                                                            {$match: {score: {$gt: 0.5}}},
                                                            {$limit: 20}
                                                        ], function (err, users) {
                                                            if (err) {
                                                                console.log(err);
                                                                return res.badRequest("Something unexpected happened");
                                                            }
                                                            if(users.length === 0 && question.length === 0 && story.length === 0 && blog.length === 0){
                                                                return res.success('no result found: try key words and like christmas, a full name etc')
                                                            }

                                                            let result = Object.assign(users, question, story, blog);
                                                            res.success(result);
                                                        });
                                                });
                                        })
                                });
                        })
                });
        })
});

module.exports = router;
