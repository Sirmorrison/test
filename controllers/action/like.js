let express = require('express');
let router = express.Router();

let Story = require('../../models/story');
let Question = require('../../models/question');
let User = require('../../models/user');
let Blog = require('../../models/blog');


//STORY LIKES
/*** END POINT FOR LIKING A STORY  BY CURRENTLY LOGGED IN USER */
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

        User.update(
            {"_id": userId},
            {$inc: {rating: 10}}, function (err, f) {
                if (err) {
                    console.log(err);
                }
            }
        );
        postedBy(postId, function (err) {});
        res.success({liked: true});
    });
});

router.post('/story/2/:postId', function (req, res) {

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
            likes: {
                "userId": userId
            }
        }
    },function (err, f) {
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        if(f.nModified === 0) {
            Story.update({
                "_id": postId,
                "likes": {
                    "$elemMatch": {
                        "userId": userId
                    }
                }
            }, {
                $pull: {
                    likes: {
                        "userId": userId
                    }
                }
            }, function (err, f) {
                if (err) {
                    return res.badRequest("Something unexpected happened");
                }
                if (f.nModified === 0) {
                    return res.success('you have disliked this post or post does not exist with id given')
                }
                User.update(
                    {"_id": userId},
                    {$inc: {rating: -10}}, function (err, f) {
                        if (err) {
                            console.log(err);
                        }
                    }
                );

                return res.success({liked: false});
            });

        }
        User.update(
            {"_id": userId},
            {$inc: {rating: -10}}, function (err, f) {
                if (err) {
                    console.log(err);
                }
            }
        );

        res.success({liked: true});
    });
});

/*** END POINT FOR DELETING STORY OF A POST BY CURRENTLY LOGGED IN USER */
router.delete('/story/:postId', function (req, res) {
    let userId = req.user.id;
    let updateOperation = {
        '$pull': {
            'likes': {
                "$elemMatch": {
                    "userId": userId
                }
            }
        }
    };

    Story.update({_id: req.params.postId}, updateOperation, function (err, g) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        User.update(
            {"_id": userId},
            {$inc: {rating: -100}}, function (err, f) {
                if (err) {
                    console.log(err);
                }

                console.log(f);
            }
        );
        console.log('hi', g);
        res.success({liked: false});
    });
});

//QUESTION LIKES
/*** END POINT FOR LIKING A QUESTION  BY CURRENTLY LOGGED IN USER */
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

/*** END POINT FOR DELETING QUESTION OF A POST BY CURRENTLY LOGGED IN USER */
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

//BLOG
/*** END POINT FOR LIKING/UN-LIKING A POST COMMENT BY CURRENTLY LOGGED IN USER */
router.post('/blog/:blogId/', function (req, res) {

    let userId = req.user.id,
        postId = req.params.blogId;

    Blog.updateOne({
        "_id": postId,
        "likes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        }
    }, {
        $addToSet: {
            "likes": {
                "userId": userId
            }
        }
    },function (err, f) {
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        if(f.nModified === 0) {
            Blog.update({
                "_id": postId,
                "likes": {
                    "$elemMatch": {
                        "userId": userId
                    }
                }
            }, {
                $pull: {
                    "likes": {
                        "userId": userId
                    }
                }
            }, function (err) {
                if (err) {
                    return res.badRequest("Something unexpected happened");
                }

                return res.success({liked: false});
            });
        }

        res.success({liked: true});
    });
});

//ADMIN BROADCAST
/*** END POINT FOR LIKING A STORY  BY CURRENTLY LOGGED IN USER */
router.post('/broadcast/:broadcastId', function (req, res) {

    let userId = req.user.id;
    let broadcastId = req.params.broadcastId;

    Admin_post.update({
        "_id": broadcastId,
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
            Admin_post.update({
                "_id": broadcastId,
                "likes": {
                    "$elemMatch": {
                        "userId": userId
                    }
                }
            }, {
                $pull: {
                    likes: {
                        "userId": userId
                    }
                }
            },function (err, f) {
                if (err) {
                    return res.badRequest("Something unexpected happened");
                }
                if (f.nModified === 0) {
                    return res.badRequest("no post found to like or dislike");
                }

                User.update(
                    {"_id": userId},
                    {$inc: {rating: -10}}, function (err, f) {
                        if (err) {
                            console.log(err);
                        }
                    }
                );
                return res.success({liked: false});
            });
        }

        User.update(
            {"_id": userId},
            {$inc: {rating: 10}}, function (err, f) {
                if (err) {
                    console.log(err);
                }
            }
        );

        res.success({liked: true});

    });
});


//STORY COMMENTS AND QUESTION ANSWERS
/*** END POINT FOR LIKING A COMMENT BY CURRENTLY LOGGED IN USER */
router.post('/story/:storyId/:commentId', function (req, res) {

    let userId = req.user.id;
    let storyId = req.params.storyId;
    let answerId = req.params.answerId;

    Story.update({
        "_id": storyId,
        'comments._id': answerId,
        "comments.dislikes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        },
        "comments.likes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        }
    }, {
        $addToSet: {
            'comments.$.likes': {
                "userId": userId
            }
        }
    },function (err, f) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if(f.nModified === 0){
            return res.success('you have either liked or disliked this post')
        }
        res.success({liked: true});
    });
});

/*** END POINT FOR LIKING AN ANSWER  BY CURRENTLY LOGGED IN USER */
router.post('/question/:storyId/:commentId', function (req, res) {

    let userId = req.user.id;
    let questionId = req.params.questionId;
    let answerId = req.params.answerId;

    Question.update({
        "_id": questionId,
        'answers._id': answerId,
        "answers.dislikes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        },
        "answers.likes": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        }
    }, {
        $addToSet: {
            'answers.$.likes': {
                "userId": userId
            }
        }
    },function (err, f) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if(f.nModified === 0){
            return res.success('you have either liked or disliked this post')
        }
        User.update(
            {"_id": userId},
            {$inc: {rating: 10}}, function (err, f) {
                if (err) {
                    console.log(err);
                }
            }
        );
        answeredBy(questionId, answerId);
        res.success({liked: true});
    });
});

/*** END POINT FOR DELETING COMMENT LIKE OF A POST BY CURRENTLY LOGGED IN USER */
router.delete('/story/:storyId/:commentId', function (req, res) {
    let userId = req.user.id;
    let storyId = req.params.storyId;
    let commentId = req.params.commentId;
    let updateOperation = {
        $pull: {
            'comments.$.likes': {
                    userId: userId
            }
        }
    };

    Story.update({'_id': storyId, 'comments._id': commentId}, updateOperation, function (err, g) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success({liked: false});
    });
});

/*** END POINT FOR DELETING ANSWER LIKE OF A POST BY CURRENTLY LOGGED IN USER */
router.delete('/question/:storyId/:commentId', function (req, res) {
    let userId = req.user.id;
    let questionId = req.params.questionId;
    let answerId = req.params.answerId;
    let updateOperation = {
        $pull: {
            'answers.$.likes': {
                userId: userId
            }
        }
    };

    Story.update({'_id': questionId, 'answers._id': answerId}, updateOperation, function (err, g) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success({liked: false});
    });
});

function postedBy(postId, callback) {
    Story.findById(postId, function (err, data) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!data) {
            return callback("not found");
        }

        let userId = data.postedBy;
        User.update(
            {"_id": userId},
            {$inc: {rating: 100}}, function (err, f) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
            }
        );
    });
}

function answeredBy(questionId, answerId, callback) {
    Question.findById(questionId, function (err, data) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        let userId = data.answers.id(answerId).answeredBy;
        console.log(userId);
        User.update(
            {"_id": userId},
            {$inc: {rating: 100}}, function (err, f) {
                if (err) {
                    console.log(err);
                    return callback("Something unexpected happened");
                }
            }
        );
    });
}

function notification(postId,ownerId,userId, callback) {
    userPro(postId,ownerId,userId, function (err, result) {
        if (err){
            console.log(err);
            return callback('something unexpected happened');
        }

        console.log('im here');
        if(result.notification === false) {
            return callback(null);
        }

        let smtpTransport = nodemailer.createTransport({
            service: 'gmail',
            auth:{user: config.gmail.username, pass: config.gmail.password}
        });
        console.log(smtpTransport);

        let  mailOptions = {
            to: result.email,
            // to: 'edonomorrison@gmail.com',
            from:'oneplacesuppport@gmail.com',
            subject: 'activity notification',
            text: result.username+' just commented on your post on askOleum .\n\n'+
            'Please click on the following link, or paste this into your browser to view: \n\n' +
            //'http://'+ req.headers.host + "/post/comments/:" + storyId + "/:" + commentId + '\n\n ' +
            'if you do not want to be getting these mails please go login into your profile and deactivate the option. \n'
        };

        smtpTransport.sendMail(mailOptions, function (err, f) {
            if (err){
                console.log(err)
                return callback(err);
            }

            console.log(f)
        });
    })
}

function userPro(postId,ownerId,userId, callback) {

    let ids = [ userId, ownerId];
    User.find({_id: ids}, function (err, user) {
        if (err){
            console.log(err);
            return callback('something unexpected happened');
        }
        if(!user){
            return callback('something unexpected happened');
        }

        let info = {
            message: user[0].name+' posted an answer to your question',
            postId: postId,
            ownerId: ownerId,
            userId: userId
        };

        Notification.create(info, function (err, note) {
            if (err){
                console.log(err);
                return callback('something unexpected happened');
            }

        });

        let data = {};
        data.username = user[0].name;
        if(user && user[1]){
            data.notification = user[1].notification;
            data.email = user[1].email;
        }else{
            data.notification = user[0].notification;
            data.email = user[0].email;
        }

        return callback(null, data)
    })
}

module.exports = router;