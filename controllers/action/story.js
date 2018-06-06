let express = require('express');
let router = express.Router();
let fs = require('fs');

const config = require('../../config');
let cloudinary = require('cloudinary');
cloudinary.config(config.cloudinary);

let Story = require('../../models/story');
let arrayUtils = require('../../utils/array');
let validator = require('../../utils/validator');

/*** END POINT FOR GETTING POST OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/:catId', function (req, res) {

    let id = req.params.catId;

    Story.aggregate([
        {$match: {"category.categoryId": id}},
        {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
        {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
        {$project: {comments:{$size :"$comments"},dislikes:{$size :"$dislikes"},likes:{$size :"$likes"}, category:1, story:1, postedOn:1,postedBy:1, title:1}},
        {$sort:{date: -1}}

    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data,{
                'path': 'likes.userId dislikes.userId comments.commentedBy',
                'select': 'name photoUrl email bio'
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

/*** END POINT A POST BY ITS ID BY CURRENTLY LOGGED IN USERS */
router.get('/s/:postId', function (req, res) {

    let postId = req.params.postId,
        userId = req.user.id;
    Story.findOne({_id: postId})
        .populate({
            path: 'postedBy',
            select: 'name photo'
        })
        .populate({
            path: 'comments.commentedBy',
            select: 'name photo'
        })
        .populate({
            path: 'likes.userId',
            select: 'name photo'
        })
        .populate({
            path: 'dislikes.userId',
            select: 'name photo'
        })
        .populate({
            path: 'views.userId',
            select: 'name photo'
        })
        .sort({date: -1})
        .exec(function (err, post) {
            console.log(post)

            if (err) {
                return res.serverError("Something unexpected happened");
            }
            let info = {
                story: post.story,
                title: post.title,
                postedOn: post.postedOn,
                postedBy: post.postedBy,
                likes: post.likes,
                nlikes: post.likes.length,
                views: post.views,
                nviews: post.views.length,
                dislikes: post.dislikes,
                ndislikes: post.dislikes.length,
                ncomments: post.comments.length,
                comments: post.comments
            };
            Story.update({
                "_id": postId,
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
                   res.badRequest('something unexpected happed')
               }
            res.success(info);
        });
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
    console.log(validated)
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
router.put('/:postId', function (req, res) {

    let title = req.body.title,
        story = req.body.story,
        cate_tags = req.body.cate_tags;

    if (!(title || tags || story || cate_tags)) {
        return res.badRequest("please enter values to fields you will love to be updated");
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
    if (cate_tags && !Array.isArray(cate_tags)) {
        return res.badRequest('Tagged should be a json array of user Ids (string)')
    } else {
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

    Story.findOneAndUpdate({
        query: {
            _id: req.params.postId,
            postedBy: req.user.id
        }
    }, {$set: values}, {new: true}, function (err, post) {

        if (err) {
            return res.serverError("Something unexpected happened");
        }

        res.success(post);
    });
});

/*** END POINT FOR DELETING A POST BY A CURRENTLY LOGGED IN USER */
router.delete('/:postId', function (req, res) {

    let id = req.params.postId;

    Story.findOne({_id: id, postedBy: req.user.id}, function (err, post) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }
        cloudinary.v2.uploader.destroy(post.public_id, function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Some error occurred");
            }
            console.log(result);

            Story.remove({_id: id, postedBy: req.user.id}, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Some error occurred");
                }
                console.log(result)
            })
        });
    });
});

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