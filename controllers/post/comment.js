let express = require('express');
let router = express.Router();

let Story = require('../../models/story');
let validator = require('../../utils/validator');
let User = require('../../models/user');
let Blog = require('../../models/blog');
let Admin_post = require('../../models/admin_post');

//STORY COMMENT
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
        story.comments.push(values);
        story.save(function (err, result) {
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

module.exports = router;