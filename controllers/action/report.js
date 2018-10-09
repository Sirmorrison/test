let express = require('express');
let router = express.Router();

const Report = require('../../models/reports');
const validator = require('../../utils/validator');
let User = require('../../models/user');
let Story = require('../../models/story');
let Question = require('../../models/question');

/*** END POINT FOR GETTING PROFILE POST OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.post('/', function (req, res) {
    let query = req.body.query,
        id = req.user.id,
        reportedId = req.body.reportedId;

    let validated = validator.isSentence(res, query)&&
                    validator.isWord(res, reportedId);
    if (!validated) return;

    User.findById(reportedId, function(err, user) {
        if (err) {
            console.log(err);
            return res.serverError("Something unexpected happened");
        }
        if (user) {
            let report =
                {
                    userId: user._id,
                    name: user.name,
                    photoUrl: user.photoUrl,
                    bio: user.bio
                };

            let data = {
                query : query,
                report: report,
                reportedBy: id
            };

            createReport(data, function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err.message);
                }

                return res.success("report sent successfully and will be responded to by an admin")
            });
        }else {
            Story.findById(reportedId, function (err, story) {
                if (err) {
                    console.log(err);
                    return res.serverError("Something unexpected happened");
                }
                if (story) {

                    let report =
                        {
                            storyId: story._id,
                            postedBy: story.postedBy,
                            createdAt: story.createdAt,
                            story: story.story,
                            title: story.title
                        };

                    let data = {
                        query: query,
                        report: report,
                        reportedBy: id
                    };

                    createReport(data, function (err, data) {
                        if (err) {
                            console.log(err);
                            return res.badRequest(err.message);
                        }

                        return res.success("report sent successfully and will be responded to by an admin")
                    });
                }else {
                    Question.findOne({"answers._id": reportedId}, function (err, answer) {
                        if (err) {
                            return res.serverError("Something unexpected happened");
                        }
                        if (answer) {
                            let report =
                            {
                                questionId: answer._id,
                                question: answer.question,
                                postedBy: answer.postedBy,
                                answerId: answer.answers(reportedId)._id,
                                answer: answer.answers(reportedId).answer,
                                answer_createdAt: answer.answers(reportedId).createdAt,
                                answeredBy: answer.answers(reportedId).answeredBy,
                            };

                            let data = {
                                query: query,
                                report: report,
                                reportedBy: id
                            };
                            createReport(data, function (err, data) {
                                if (err) {
                                    console.log(err);
                                    return res.badRequest(err.message);
                                }

                                return res.success("report sent successfully and will be responded to by an admin")
                            });
                        }else {

                            return res.badRequest("data with id could not be found")
                        }
                    })
                }
            })
        }
    });
});

function createReport(data, callback) {
    Report.create(data, function (err, story) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        return callback(null, story)
    })
}

module.exports = router;