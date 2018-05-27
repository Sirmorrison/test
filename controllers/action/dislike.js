let express = require('express');
let router = express.Router();

let Story = require('../../models/story');
let Question = require('../../models/question');

/*** END POINT FOR DISLIKING A POST  BY CURRENTLY LOGGED IN USER */
router.post('/story/:postId', function (req, res) {

    let userId = req.user.id;
    let postId = req.params.postId;

    Story.update({
        "_id": postId,
        "dislikes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        },
        "likes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        }
    }, {
        $addToSet: {
            dislikes: {
                "userId": userId
            }
        }
    },function (err, f) {
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        console.log(f);
        if(f.nModified === 0){
            return res.success('you have either liked or disliked this post')
        }

        res.success({disliked: true});
    });
});

/*** END POINT FOR DELETING DISLIKING OF A POST BY CURRENTLY LOGGED IN USER */
router.delete('/story/:postId', function (req, res) {
    let updateOperation = {
        '$pull': {
            'dislikes': {
                'userId': req.user.id
            }
        }
    };

    Story.update({_id: req.params.postId}, updateOperation, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success({disliked: false});
    });
});

/*** END POINT FOR DISLIKING OF A QUESTION  BY CURRENTLY LOGGED IN USER */
router.post('/question/:postId', function (req, res) {

    let userId = req.user.id;
    let postId = req.params.postId;

    Question.update({
        "_id": postId,
        "dislikes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        },
        "likes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        }
    }, {
        $addToSet: {
            likes: {
                "userId": userId
            }
        }
    },function (err, f) {
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        if(f.nModified === 0){
            return res.success('you have either liked or disliked this post')
        }
        res.success({liked: true});
    });
});

/*** END POINT FOR DELETING DISLIKING OF A QUESTION OF A POST BY CURRENTLY LOGGED IN USER */
router.delete('/question/:postId', function (req, res) {
    let updateOperation = {
        '$pull': {
            'likes': {
                'userId': req.user.id
            }
        }
    };

    Question.update({_id: req.params.postId}, updateOperation, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success({liked: false});
    });
});

module.exports = router;