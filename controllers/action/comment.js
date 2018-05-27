let express = require('express');
let router = express.Router();

let Story = require('../../models/story');
let validator = require('../../utils/validator');

/*** END POINT FOR COMMENTING ON A POST OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.post('/:postId', function (req, res) {
    let comment = req.body.comment,
        postId = req.params.postId;

    let validated = validator.isSentence(res, comment);
    if (!validated) return;

    let values ={
        comment: comment,
        commentedBy: req.user.id
    };

    Story.findOne({_id: postId},function (err, post) {
        if (err) {
            console.log(err);
            return res.serverError("Something unexpected happened");
        }
        post.comments.push(values);
        post.save(function (err, result) {
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
router.put('/:postId/:commentId', function (req,res) {

    let postId = req.params.postId,
        commentId = req.params.commentId,
        id = req.user.id,
        comment = req.body.comment;

    let validated = validator.isSentence(res, comment);
    if (!validated) return;

    Story.updateOne({
            "_id": postId,
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
router.delete('/:postId/:commentId', function (req, res) {

    let postId = req.params.postId,
        commentId = req.params.commentId,
        id = req.user.id;

    Story.findOne({_id: postId}, function (err, post, next) {
        if (err) {
            return res.serverError("Something unexpected happened");
        }
        if(post.comments.id(commentId).commentedBy !== id ){
            let err = new Error('you re not authorized');
            console.log(err)
            return res.notAllowed(err);
        }else {
            post.comments.id(commentId).remove();
            post.save(function (err, resp) {
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