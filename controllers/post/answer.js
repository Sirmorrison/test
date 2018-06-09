let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

let Question = require('../../models/question');
let validator = require('../../utils/validator');

/*** END POINT FOR GETTING THE ANSWERS ON A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('/:questionId', function (req, res) {
    let questionId = req.params.questionId,
        id = mongoose.Types.ObjectId(questionId);

    Question.aggregate([
        {$match: {"_id" : id}},
        {$project: {answers: {
            $map: {
                input: '$answers',
                as: "element",
                in: {
                    answerId: "$$element._id",
                    answer: "$$element.answer",
                    answeredOn: '$$element.createdAt',
                    answeredBy: '$$element.answeredBy',
                    likes: { $size: "$$element.likes" },
                    dislikes: { $size: "$$element.dislikes" }
                }
            }
        }, question:1}},
        {$sort: {createdAt: -1}},
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Question.populate(data,{
                'path': 'answers.answeredBy',
                'select': 'name email photoUrl public_id'
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

/*** END POINT FOR GETTING AN ANSWERS TO A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('/:questionId/:answerId', function (req, res) {
    let questionId = req.params.questionId,
        answerId = req.params.answerId;

        Question.findOne({_id: questionId})
        .populate({
            path: 'views.userId',
            select: 'name photoUrl public_id'
        })
        .sort({date: -1})
        .exec(function (err, post) {
                if (err) {
                    return res.serverError("Something unexpected happened");
                }
                if (!post){
                    return res.success('no post found with the id provided')
                }

            res.success(post.answers.id(answerId));
            }
        );
});

/*** END POINT FOR COMMENTING ON A POST OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.post('/:questionId', function (req, res) {
    let answer = req.body.answer,
        questionId = req.params.questionId;

    let validated = validator.isSentence(res, answer);
    if (!validated) return;

    let values ={
        answer: answer,
        commentedBy: req.user.id
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
            res.success(data);
        });
    });
});

/*** END POINT FOR EDITING COMMENT ON A POST*/
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

/*** END POINT FOR DELETING COMMENT ON A POST*/
router.delete('/:questionId/:answerId', function (req, res) {

    let questionId = req.params.questionId,
        answerId = req.params.answerId,
        id = req.user.id;

    Question.findOne({_id: questionId}, function (err, question) {
        if (err) {
            return res.serverError("Something unexpected happened");
        }
        if(question.answers.id(answerId).answeredBy !== id ){
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