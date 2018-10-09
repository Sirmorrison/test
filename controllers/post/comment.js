let express = require('express');
let router = express.Router();
let async = require('async');
let nodemailer = require('nodemailer');

let config = require('../../config');
let Story = require('../../models/story');
let validator = require('../../utils/validator');
let User = require('../../models/user');
let Blog = require('../../models/blog');
let Question = require('../../models/question');
let Notification = require('../../models/notification');

//STORY COMMENT
/*** END POINT FOR GETTING A COMMENT TO A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('/story/:storyId/:commentId', function (req, res) {
    let storyId = req.params.storyId,
        commentId = req.params.commentId;

    Story.findOne({_id: storyId})
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

            res.success(post.comments.id(commentId));
        }
    );
});

/*** END POINT FOR COMMENTING ON A POST OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.post('/story/:storyId', function (req, res) {
    let comment = req.body.comment,
        storyId = req.params.storyId;
    let userId = req.user.id;

    let validated = validator.isSentence(res, comment);
    if (!validated) return;

    let values ={
        comment: comment,
        commentedBy: userId
    };

    Story.findOne({_id: storyId},function (err, story) {
        if (err) {
            console.log(err);
            return res.serverError("Something unexpected happened");
        }
        if(!story){
            return res.badRequest('post with details provided not found')
        }
        story.comments.push(values);
        story.save(function (err, result) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            let postId = result._id,
                ownerId = result.postedBy,
                userId = req.user.id;

            let data = {
                storyId: result._id,
                title: result.title,
                commentId: result.comments[result.comments.length - 1]._id,
                comment: result.comments[result.comments.length - 1].comment
            };

            User.update(
                {"_id": userId},
                {$inc: {rating: 10}}, function (err, f) {
                    if (err) {
                        console.log(err);
                    }
                }
            );
            notification(postId,ownerId,userId, function (err, note) {
                if (err){
                    console.log(err);
                    return res.badRequest(err)
                }

                console.log(note)
            });

            res.success(data);
        });
    });
});

/*** END POINT FOR EDITING COMMENT ON A POST*/
router.put('/story/:storyId/:commentId', function (req,res) {

    let storyId = req.params.storyId,
        commentId = req.params.commentId,
        id = req.user.id,
        comment = req.body.comment;

    let validated = validator.isSentence(res, comment);
    if (!validated) return;

    Story.updateOne({
            "_id": storyId,
            "comments._id": commentId,
            "comments.commentedBy": id,
        },
        {$set: {"comments.$.comment": comment}},
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
router.delete('/story/:storyId/:commentId', function (req, res) {

    let storyId = req.params.storyId,
        commentId = req.params.commentId,
        id = req.user.id;

    Story.findOne({_id: storyId}, function (err, story) {
        if (err) {
            return res.serverError("Something unexpected happened");
        }
        if(story.comments.id(commentId).commentedBy !== id){
            let err = new Error('you re not authorized');
            console.log(err);
            return res.notAllowed(err);
        }else {
            story.comments.id(commentId).remove();
            story.save(function (err, resp) {
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

//QUESTION COMMENT
/*** END POINT FOR GETTING A COMMENT TO A QUESTION OF A USER BY LOGGED IN USERS*/
router.get('/:storyId/:commentId', function (req, res) {
    let storyId = req.params.storyId,
        commentId = req.params.commentId;

    Story.findOne({_id: storyId})
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

                res.success(post.comments.id(commentId));
            }
        );
});

/*** END POINT FOR COMMENTING ON A POST OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.post('/question/:questionId', function (req, res) {
    let comment = req.body.comment,
        questionId = req.params.questionId;
    let userId = req.user.id;

    let validated = validator.isSentence(res, comment);
    if (!validated) return;

    let values ={
        comment: comment,
        commentedBy: userId
    };

    Question.findOne({_id: questionId},function (err, question) {
        if (err) {
            console.log(err);
            return res.serverError("Something unexpected happened");
        }
        if(!question){
            return res.badRequest('question with details provided not found')
        }
        question.comments.push(values);
        question.save(function (err, result) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            let postId = result._id,
                ownerId = result.postedBy,
                userId = req.user.id;

            let data = {
                storyId: result._id,
                title: result.title,
                commentId: result.comments[result.comments.length - 1]._id,
                comment: result.comments[result.comments.length - 1].comment
            };

            User.update(
                {"_id": userId},
                {$inc: {rating: 10}}, function (err, f) {
                    if (err) {
                        console.log(err);
                    }
                }
            );
            notification(postId,ownerId,userId, function (err, note) {
                if (err){
                    console.log(err);
                    return res.badRequest(err)
                }

                console.log(note)
            });

            res.success(data);
        });
    });
});

/*** END POINT FOR EDITING COMMENT ON A POST*/
router.put('/question/:questionId/:commentId', function (req,res) {

    let questionId = req.params.questionId,
        commentId = req.params.commentId,
        id = req.user.id,
        comment = req.body.comment;

    let validated = validator.isSentence(res, comment);
    if (!validated) return;

    Question.updateOne({
            "_id": questionId,
            "comments._id": commentId,
            "comments.commentedBy": id,
        },
        {$set: {"comments.$.comment": comment}},
        function (err, result) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            if(result.nModified === 0){
                return res.notAllowed('you can not make modification to this comment')
            }

            res.success('updated successfully');
        }
    )
});

/*** END POINT FOR DELETING COMMENT ON A POST*/
router.delete('/question/:questionId/:commentId', function (req, res) {

    let storyId = req.params.storyId,
        commentId = req.params.commentId,
        id = req.user.id;

    Question.findOne({_id: questionId}, function (err, question) {
        if (err) {
            return res.serverError("Something unexpected happened");
        }
        if(question.comments.id(commentId).commentedBy !== id){
            let err = new Error('you re not authorized');
            console.log(err);
            return res.notAllowed(err);
        }else {
            question.comments.id(commentId).remove();
            question.save(function (err, resp) {
                if (err) {
                    console.log(err);
                    return res.serverError("Something unexpected happened");
                }
                console.log(resp);
                res.success('deleted successfully');
            });
        }
    });
});

//BLOG COMMENT
/*** END POINT FOR COMMENTING ON A POST OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.post('/blog/:blogId', function (req, res) {
    let comment = req.body.comment,
        blogId = req.params.blogId;
    let userId = req.user.id;

    let validated = validator.isSentence(res, comment);
    if (!validated) return;

    let values ={
        comment: comment,
        commentedBy: userId
    };

    Blog.findOne({_id: blogId},function (err, blog) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        blog.comments.push(values);
        blog.save(function (err, result) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }

            User.update(
                {"_id": userId},
                {$inc: {rating: 10}}, function (err, f) {
                    if (err) {
                        console.log(err);
                    }
                }
            );
            let data = {
                blogId: result._id,
                'blog Post': result.message,
                commentId: result.comments[result.comments.length - 1]._id,
                comment: result.comments[result.comments.length - 1].comment
            };
            res.success(data);
        });
    });
});

/*** END POINT FOR EDITING COMMENT ON A POST*/
router.put('/blog/:blogId/:commentId', function (req,res) {

    let blogId = req.params.blogId,
        commentId = req.params.commentId,
        id = req.user.id,
        comment = req.body.comment;

    let validated = validator.isSentence(res, comment);
    if (!validated) return;

    Blog.updateOne({
            "_id": blogId,
            "comments._id": commentId,
            "comments.commentedBy": id,
        },
        {$set: {"comments.$.comment": comment}},
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
router.delete('/blog/:blogId/:commentId', function (req, res) {

    let blogId = req.params.blogId,
        commentId = req.params.commentId,
        id = req.user.id;

    Blog.findOne({_id: blogId}, function (err, blog) {
        if (err) {
            return res.serverError("Something unexpected happened");
        }
        if(blog.comments.id(commentId).commentedBy !== id){
            let err = new Error('you re not authorized');
            console.log(err);
            return res.notAllowed(err);
        }else {
            blog.comments.id(commentId).remove();
            blog.save(function (err, resp) {
                if (err) {
                    console.log(err);
                    return res.serverError("Something unexpected happened");
                }
                console.log(resp);
                res.success(resp, 'blog deleted successfully');
            });
        }
    });
});

//ASK OLEUM COMMENTS
/*** END POINT FOR COMMENTING ON A POST OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.post('/broadcast/:broadcastId', function (req, res) {
    let comment = req.body.comment,
        broadcastId = req.params.broadcastId;
    let userId = req.user.id;

    let validated = validator.isSentence(res, comment);
    if (!validated) return;

    let values ={
        comment: comment,
        commentedBy: userId
    };

    Admin_post.findOne({_id: broadcastId},function (err, broadcast) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        broadcast.comments.push(values);
        broadcast.save(function (err, result) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }

            User.update(
                {"_id": userId},
                {$inc: {rating: 10}}, function (err, f) {
                    if (err) {
                        console.log(err);
                    }
                }
            );
            let data = {
                commentId: result.comments[result.comments.length - 1]._id,
                comment: result.comments[result.comments.length - 1].comment
            };
            res.success(data);
        });
    });
});

/*** END POINT FOR EDITING COMMENT ON A POST*/
router.put('/broadcast/:broadcastId/:commentId', function (req,res) {

    let blogId = req.params.broadcastId,
        commentId = req.params.commentId,
        id = req.user.id,
        comment = req.body.comment;

    let validated = validator.isSentence(res, comment);
    if (!validated) return;

    Blog.updateOne({
            "_id": blogId,
            "comments._id": commentId,
            "comments.commentedBy": id,
        },
        {$set: {"comments.$.comment": comment}},
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
router.delete('/broadcast/:broadcastId/:commentId', function (req, res) {

    let blogId = req.params.broadcastId,
        commentId = req.params.commentId,
        id = req.user.id;

    Blog.findOne({_id: blogId}, function (err, blog) {
        if (err) {
            return res.serverError("Something unexpected happened");
        }
        if(blog.comments.id(commentId).commentedBy !== id){
            let err = new Error('you re not authorized');
            console.log(err);
            return res.notAllowed(err);
        }else {
            blog.comments.id(commentId).remove();
            blog.save(function (err, resp) {
                if (err) {
                    console.log(err);
                    return res.serverError("Something unexpected happened");
                }
                console.log(resp);
                res.success(resp, 'blog deleted successfully');
            });
        }
    });
});

function notification(postId,ownerId,userId, callback) {
    userPro(postId,ownerId,userId, function (err, result) {
        if (err){
            console.log(err);
            return callback('something unexpected happened');
        }

        console.log(result);
        console.log('im here');
        // if(result.notification === false) {
        //     return callback(null);
        // }

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
            message: user[0].name+' posted a comment on your story',
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