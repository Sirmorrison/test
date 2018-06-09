let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

let Story = require('../../models/story');
let validator = require('../../utils/validator');

/*** END POINT FOR GETTING THE COMMENTS ON A STORY OF A USER BY LOGGED IN USERS*/
router.get('/:storyId', function (req, res) {
    let storyId = req.params.storyId,
        id = mongoose.Types.ObjectId(storyId);

    Story.aggregate([
        {$match: {"_id" : id}},
        {$project: {comments: {
            $map: {
                input: '$comments',
                    as: "element",
            in: {
                commentId: "$$element._id",
                comment: "$$element.comment",
                commentedOn: '$$element.createdAt',
                commentedBy: '$$element.commentedBy',
                likes: { $size: "$$element.likes" },
                dislikes: { $size: "$$element.dislikes" }
                }
            }
        }, story:1}},
        {$sort: {createdAt: -1}},
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data,{
                'path': 'comments.commentedBy',
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
router.post('/:storyId', function (req, res) {
    let comment = req.body.comment,
        storyId = req.params.storyId;

    let validated = validator.isSentence(res, comment);
    if (!validated) return;

    let values ={
        comment: comment,
        commentedBy: req.user.id
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

            let data = {
                commentId: result.comments[result.comments.length - 1]._id,
                comment: result.comments[result.comments.length - 1].comment
            };
            res.success(data);
        });
    });
});

/*** END POINT FOR EDITING COMMENT ON A POST*/
router.put('/:storyId/:commentId', function (req,res) {

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
router.delete('/:storyId/:commentId', function (req, res) {

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

module.exports = router;