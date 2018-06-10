let express = require('express');
let router = express.Router();
let fs = require('fs');
let mongoose = require("mongoose");

const config = require('../../config');
let cloudinary = require('cloudinary');
cloudinary.config(config.cloudinary);

let Story = require('../../models/story');
let arrayUtils = require('../../utils/array');
let validator = require('../../utils/validator');


/*** END POINT FOR GETTING THE COMMENTS ON A STORY OF A USER BY LOGGED IN USERS*/
router.get('/:storyId', function (req, res) {
    let storyId = req.params.storyId,
        userId = req.user.id,
        id = mongoose.Types.ObjectId(storyId);

    Story.update({
        "_id": storyId,
        "views": {
            "$not": {
                "$elemMatch": {
                    "userId": userId
                }
            }
        }
    }, {
        $addToSet: {
            views: {
                "userId": userId
            }
        }
    }, function (err) {
        if(err){
            console.log(err)
        }

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
        }, story:1, postedBy:1, views: { $size: "$views" }}},
    ], function (err, data) {

            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            Story.populate(data, {
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
        })
    });
});

/*** END POINT FOR POST CREATION CONTAINING FILE TO BE UPLOADED BY A CURRENTLY LOGGED IN USER */
router.post('/', function (req, res) {

    let story = req.body.story,
        title = req.body.title,
        cate_tags = req.body.category;

    let validated = validator.isSentence(res, story )&&
                    validator.isCategory(res, cate_tags)&&
                    validator.isWord(res, title);

    if (!validated)
        return;

    //remove duplicates before proceeding
    arrayUtils.removeDuplicates(cate_tags);

    let categoryTags = []; //new empty array
    for (let i = 0; i < cate_tags.length ; i++){
        let cateId = cate_tags[i];

        if (typeof(cateId) !== "string"){
            return res.badRequest("category IDs in tagged array must be string");
        }
        categoryTags.push({categoryId: cateId});
    }

    let data = {
        title: title,
        story: story,
        postedBy: req.user.id,
        category: categoryTags
    };

    Story.create(data, function (err, post) {
        if (err) {
            console.log(err);
            return res.serverError("Something unexpected happened");
        }

        let data = {
            postId : post._id,
            title: post.title,
            story: post.story,
            postedOn: post.postedOn,
            category: post.category
        };
        res.success(data);
    });
});

/*** END POINT FOR EDITING POST BY A CURRENTLY LOGGED IN USER */
router.put('/:storyId', function (req, res) {

    let title = req.body.title,
        story = req.body.story,
        cate_tags = req.body.category;

    if (!(title || story || cate_tags)) {
        return res.badRequest("please enter values to fields you will love to be updated");
    }
    if (cate_tags && !Array.isArray(cate_tags)){
        return res.badRequest('Tagged should be a json array of user Ids (string)')
    }

    let values = {};
    values.postedBy = req.user.id;

    if (title) {
        let vmess = validator.isSentence(res, title);
        if (!vmess)
            return;
        values.title = title;
    }
    if (story) {
        let vmess = validator.isSentence(res, story);
        if (!vmess)
            return;
        values.story = story;
    }

    if (cate_tags) {

        //remove duplicates before proceeding
        arrayUtils.removeDuplicates(cate_tags);

        values.category = []; //new empty array
        for (let i = 0; i < cate_tags.length ; i++){
            let cateId = cate_tags[i];

            if (typeof(cateId) !== "string"){
                return res.badRequest("category IDs in tagged array must be string");
            }
            values.category.push({categoryId: cateId});
        }
    }

    Story.findOneAndUpdate({_id: req.params.storyId, postedBy: req.user.id},
        {$set: values}, {new: true})
        .populate({
            path: 'postedBy',
            select: 'name'
        })
        .populate({
            path: 'category.categoryId',
            select: 'title'
        })
        .exec(function (err, post) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            if (post === null) {
                return res.notAllowed("you re not allowed to perform this action");
            }
            let data = {
                storyId: post._id,
                createdAt:post.createdAt,
                updatedAt:post.updatedAt,
                title: post.title,
                story: post.story,
                postedBy: post.postedBy,
                category: post.category
            };
            res.success(data);
        }
    );
});

/*** END POINT FOR DELETING A POST BY A CURRENTLY LOGGED IN USER */
router.delete('/:postId', function (req, res) {

    let id = req.params.postId;

    // Story.findOne({_id: id, postedBy: req.user.id}, function (err, post) {
    //     if (err) {
    //         console.log(err);
    //         return res.badRequest("Some error occurred");
    //     }
    //     cloudinary.v2.uploader.destroy(post.public_id, function (err, result) {
    //         if (err) {
    //             console.log(err);
    //             return res.badRequest("Some error occurred");
    //         }
    //         console.log(result);
            Story.remove({_id: id, postedBy: req.user.id}, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Some error occurred");
                }
                res.success('question successfully deleted')
            })
        });
//     });
// });

function cloudUpload(file,stream, callback) {

    if (file['type'].split('/')[0] === 'image') {
        console.log("it worked");
        cloudinary.v2.uploader.upload(stream, (err, result) => {
            if (err) {
                console.log(err);
                return callback(err.message);
            } else {
                console.log(result);
                return callback(null, result);
            }
            // fs.unlink(file.path, function (err) {
            //     if (err) {
            //         console.error(err);
            //         return res.badRequest(err);
            //     }
            //     console.error('delete success: ', file.path);
            //
            // });
        })
    }
    else if (file['type'].split('/')[0] === 'video') {
        cloudinary.v2.uploader.upload(file.path, {resource_type: "video"}, function (err, result) {
            if (err) {
                console.log(err);
                return callback(err.message);
            } else {
                console.log(result);
                return callback(null, result);
            }
        })
    }
    else {
        return callback('file type not supported and upload has failed')
    }
}

module.exports = router;