let express = require('express');
let router = express.Router();

const Question = require('../../models/question');
const User = require('../../models/user');
const validator = require('../../utils/validator');

/*** END POINT FOR RATING AN ANSWER BY CURRENTLY LOGGED IN USER */
router.post('/:questionId/:answerId', function (req, res) {
    let questionId = req.params.questionId,
        answerId = req.params.answerId,
        id = req.user.id,
        rating = req.body.rating;

    let validated = validator.isRating(res, rating);
    if (!validated) return;

    Question.update({
        "_id": questionId,
        'answers._id': answerId,
        "answers.rating": {
            "$not": {
                "$elemMatch": {
                    "ratedBy": id
                }
            }
        }
    }, {
        $addToSet: {
            'answers.$.rating': {
                rating: rating,
                ratedBy: id
            }
        }
    },function (err, f) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if(f.nModified === 0){
            return res.success('you have already rated this answer')
        }
        Question.findOne({'answers._id': answerId}, function (err, question) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            console.log()
            User.update(
                {"_id": id},
                {$inc: {rating: 10}}, function (err, f) {
                    if (err) {
                        console.log(err);
                    }
                }
            );

            res.success(question.answers.id(answerId).rating[question.answers.id(answerId).rating.length - 1]._id)
        });
    });
});

/*** END POINT FOR DELETING ADDRESS BY ID OF CURRENTLY LOGGED IN USER */
router.delete('/:questionId/:answerId', function (req, res) {

    let questionId = req.params.questionId,
        answerId = req.params.answerId,
        id = req.user.id;

    let updateOperation = {
        $pull: {
            'answers.$.rating': {
                ratedBy: id,
            }
        }
    };

    Question.updateOne({_id: questionId, 'answers._id': answerId,
    }, updateOperation, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success({deleted: true});
    });
});

module.exports = router;