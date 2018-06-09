let express = require('express');
let router = express.Router();

let User = require('../../models/user');
let validator = require('../../utils/validator');


/*** ENDPOINTS FOR FOLLOWING A REGISTERED USER BY ANOTHER USER**/
router.post('/:userId', function (req,res) {

    let followingId = req.params.userId,
        followerId = req.user.id;

    if (!followingId) {
        return res.badRequest("Please select a user to follow");
    }
    if (followingId === followerId) {
        return res.badRequest("you cannot follow yourself");
    }

    User.update({
        "_id": followingId,
        "followers": {
            "$not": {
                "$elemMatch": {
                    "userId": followerId
                }
            }
        }
    }, {
        $addToSet: {
            followers: {
                "userId": followerId
            }
        }
    },function (err, f) {
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        if (f.nModified === 0){
            return res.success("you are already following this user");
        }
        res.success({following: true});
    });

    User.update({
        "_id": followerId,
        "following": {
            "$not": {
                "$elemMatch": {
                    "userId": followingId
                }
            }
        }
    }, {
        $addToSet: {
            following: {
                "userId": followingId
            }
        }
    }, function (err, f) {
        console.log(f);
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        if (f.nModified === 0){
            return res.success("you are already following this user");
        }
        res.success({following: true});
    });
});

/*** ENDPOINTS FOR UN-FOLLOWING A REGISTERED USER BY ANOTHER USER**/
router.delete('/:userId', function (req,res) {

    let followingId = req.params.userId,
        followerId = req.user.id;

    if (!followingId) {
        return res.badRequest("Please select a user to follow");
    }
    if (followingId === followerId) {
        return res.badRequest("you cannot follow yourself");
    }

    let updateOperation = {
        '$pull': {
            'followers': {
                'userId': followerId
            }
        }
    };

    let updateOperation2 = {
        '$pull': {
            'following': {
                'userId': followingId
            }
        }
    };

    User.update({_id: followingId}, updateOperation, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        res.success({following: false});
    });

    User.update({_id: followerId}, updateOperation2, function (err) {
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        res.success({following: false});
    });
});

module.exports = router;