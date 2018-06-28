let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");
let async = require('async');

const Report = require('../../models/reports');
let User = require('../../models/user');
let Story = require('../../models/story');
let Question = require('../../models/question');


/*** END POINT FOR GETTING REPORT CURRENTLY LOGGED IN ADMIN */
router.get('/', function (req, res) {
    let userId = req.user.id;

    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Report.find({})
            .populate({
                path: 'reportedBy',
                select:'name photoUrl bio public_id ranking'
            })
            .sort({date: -1})
            .exec(function(err, report) {
                if (err) {
                    console.log(err);
                    return res.serverError("Something unexpected happened");
                }
                if (!report) {
                    return res.success([]);
                }

                let info = {
                    report: report.report,
                    reportedId: report.photoUrl,
                    reportedBy: report.name,
                };

            res.success(info);
        })
    });
});

/*** END POINT FOR GETTING A PARTICULAR  CURRENTLY LOGGED IN ADMIN */
router.get('/:reportedId', function (req, res) {
    let userId = req.user.id;
    let id = req.params.reportedId;
    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        User.findById( id, function(err, user) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            if (user) {
                let info = {
                    userId: user._id,
                    name: user.name,
                    createdAt: user.createdAt,
                    email: user.email,
                    photoUrl: user.photoUrl,
                    address: user.address,
                    bio: user.bio,
                    following: user.following.length,
                    followers: user.followers.length,
                    ranking: user.ranking,
                    profession: user.profession
                };

                return res.success(info);
            }
            Story.findOne({_id: id})
                .populate({
                    path: 'postedBy',
                    select: 'name bio photoUrl'
                })
                .exec(function (err, data) {
                    if (err) {
                        console.log(err);
                        return res.serverError("Something unexpected happened");
                    }
                    if (data) {
                        let info = {
                            storyId: data._id,
                            postedBy: data.postedBy,
                            createdAt: data.createdAt,
                            views: data.views.length,
                            comments: data.comments.length,
                            dislikes: data.dislikes.length,
                            likes: data.likes.length
                        };

                        return res.success(info);
                    }
                    Question.findOne({"answers._id": id})
                        .populate({
                            path: 'postedBy',
                            select: 'name photoUrl public_id'
                        })
                        .populate({
                            path: 'answers.answeredBy',
                            select: 'name photoUrl bio'
                        })
                        .exec(function (err, data) {
                            if (err) {
                                return res.serverError("Something unexpected happened");
                            }
                            if (!data) {
                                return res.badRequest("data with id could not be found")
                            }

                            let info = {
                                questionId: data._id,
                                postedBy: data.postedBy,
                                answerId: data.answers[0]._id,
                                answer_createdAt: data.answers[0].createdAt,
                                answeredBy: data.answers[0].answeredBy,
                                'answer views': data.answers[0].views.length,
                                'answer dislikes': data.answers[0].dislikes.length,
                                'answer likes': data.answers[0].likes.length,
                            };

                            res.success(info);
                        }
                    );

                }
            )
        });
    })
});


function userVerify(userId, callback) {
    User.findById(userId, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("no user found with this id");
        }
        if (user.admin !== true) {
            return callback("You are not Authorized Perform this Action");
        }

        return callback(null, user)
    })
}

module.exports = router;