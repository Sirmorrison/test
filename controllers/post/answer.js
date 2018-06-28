let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

let Question = require('../../models/question');
let validator = require('../../utils/validator');
let User = require('../../models/user');


/*** END POINT FOR GETTING AN ANSWERS TO A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('/:questionId/:answerId', function (req, res) {
    let questionId = req.params.questionId,
        answerId = req.params.answerId;
    let id = mongoose.Types.ObjectId(answerId);

    Question.update({
            "_id": questionId,
            'answers._id': id},
        {$inc: {'answers.$.views': 1}}, function (err) {
            if (err) {
                console.log(err);
            }

            Question.aggregate([
                {$match: {"answers._id" : id}},
                {$project:
                    {answers: {
                    $map: {
                        input: '$answers',
                        as: "element",
                        in: {
                            answerId: "$$element._id",
                            answer: "$$element.answer",
                            answeredOn: '$$element.createdAt',
                            answeredBy: '$$element.answeredBy',
                            views: "$$element.views" ,
                            upVotes: { $size: "$$element.likes" },
                            rating: { $avg: "$$element.rating" },
                            downVotes: { $size: "$$element.dislikes" }
                        }
                    }
                }
            , question:1, views: 1, postedBy: 1}} ], function (err, data) {

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
    })
});

/*** END POINT FOR COMMENTING ON A POST OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.post('/:questionId', function (req, res) {
    let answer = req.body.answer,
        userId = req.user.id,
        questionId = req.params.questionId;

    let validated = validator.isSentence(res, answer);
    if (!validated) return;

    let values ={
        answer: answer,
        answeredBy: userId
    };

    Question.findOne({_id: questionId},function (err, question) {
        if (err) {
            console.log(err);
            return res.serverError("Something unexpected happened");
        }

        question.answers.push(values);
        question.save(function (err, result) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }

            let data = {
                answerId: result.answers[result.answers.length - 1]._id,
                answers: result.answers[result.answers.length - 1].answers
            };
            User.update(
                {"_id": userId},
                {$inc: {rating: 100}}, function (err, f) {
                    if (err) {
                        console.log(err);
                    }
                }
            );
            res.success(data);
        });
    });
});

/*** END POINT FOR EDITING ANSWER ON A QUESTION*/
router.put('/:questionId/:answerId', function (req,res) {

    let questionId = req.params.questionId,
        answerId = req.params.answerId,
        id = req.user.id,
        answer = req.body.answer;

    let validated = validator.isSentence(res, answer);
    if (!validated) return;

    Question.updateOne({
            "_id": questionId,
            "answers._id": answerId,
            "answers.answeredBy": id,
        },
        {$set: {"answers.$.answer": answer}},
        function (err, result) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            if(result.nModified === 0){
                return res.notAllowed('you can not make modification to this comment')
            }
            res.success(result, {success: true});
        }
    )
});

/*** END POINT FOR DELETING ANSWER ON A QUESTION*/
router.delete('/:questionId/:answerId', function (req, res) {

    let questionId = req.params.questionId,
        answerId = req.params.answerId,
        id = req.user.id;

    Question.findOne({_id: questionId}, function (err, question) {
        if (err) {
            return res.serverError("Something unexpected happened");
        }
        if(question.answers.id(answerId).answeredBy !== id){
            let err = new Error('you re not authorized');
            console.log(err)
            return res.notAllowed(err);
        }else {
            question.answers.id(answerId).remove();
            question.save(function (err, resp) {
                if (err) {
                    console.log(err);
                    return res.serverError("Something unexpected happened");
                }
                console.log(resp);
                res.success(resp);
            });
        }
    });
});

module.exports = router;