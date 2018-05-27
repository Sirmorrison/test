let express = require('express');
let router = express.Router();

const User = require('../../models/user');
const validator = require('../../utils/validator');

/*** END POINT FOR GETTING PROFILE POST OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.post('/:userId', function (req, res) {
    let userId = req.params.userId,
        id = req.user.id,
        rating = req.body.rating;

    if (userId === id)(
        res.badRequest("you can not rate yourself")
    );
    let validated = validator.isRating(res, rating);
    if (!validated) return;

    let info = {
        rating: rating,
        ratedBy: id
    };

    User.update({
        "_id": userId,
        "rating": {
            "$not": {
                "$elemMatch": {
                    "ratedBy": id
                }
            }
        }
    }, {
        $addToSet: {
            rating: info
        }
    },function (err) {
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        User.findOne({_id: userId}, function (err, biz) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }

            res.success(biz.rating[biz.rating.length - 1]._id);
        })
    });
});

/*** END POINT FOR UPDATING ADDRESS BY THE ADDRESS ID OF CURRENTLY LOGGED IN USER */
router.put('/:userId', function (req, res) {

    let userId = req.params.userId,
        id = req.user.id,
        rating = req.body.rating;

    let validated = validator.isRating(res, rating);
    if (!validated) return;

    // let info = {
    //     rating: rating,
    //     ratedBy: id,
    //     _id: ratingId
    // };

    User.updateOne({
            "_id": userId,
            "rating.ratedBy": id
        }
        ,{$set: {"rating.$.rating": rating}},
        function (err, result) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            res.success(result, {success: true});
        }
    )
});

/*** END POINT FOR DELETING ADDRESS BY ID OF CURRENTLY LOGGED IN USER */
router.delete('/:userId', function (req, res) {

    let userId = req.params.userId,
        id = req.user.id;

    let updateOperation = {
        $pull: {
            rating: {
                ratedBy: id,
            }
        }
    };

    User.updateOne({_id: userId}, updateOperation, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success({deleted: true});
    });
});

module.exports = router;