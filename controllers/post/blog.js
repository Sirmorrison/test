let express = require('express');
let router = express.Router();
let fs = require('fs');
let mongoose = require("mongoose");

const config = require('../../config');
let cloudinary = require('cloudinary');
cloudinary.config(config.cloudinary);

let Blog = require('../../models/blog');
let arrayUtils = require('../../utils/array');
let validator = require('../../utils/validator');
let User = require('../../models/user');


/*** END POINT FOR POST CREATION CONTAINING FILE TO BE UPLOADED BY A CURRENTLY LOGGED IN USER */
router.post('/', function (req, res) {

    let message = req.body.message,
        title = req.body.title,
        userId = req.user.id,
        file = req.files.null;

    let validated = validator.isFile(res, file)&&
                    validator.isSentence(res, title)&&
                    validator.isSentence(res, message);

    if (!validated) return;

    let stream = fs.createReadStream(file.path);

    cloudUpload(file, function (err, result) {

        if (err) {
            console.log(err);
            res.badRequest(err.message);
        }

        let data = {
            uploadUrl: result.secure_url,
            mediaType: file.type,
            public_id: result.public_id,
            postedBy: userId,
            message: message,
            title: title
        };

        Blog.create(data, function (err, post) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }

            User.update(
                {"_id": userId},
                {$inc: {rating: 100}}, function (err) {
                    if (err) {
                        console.log(err);
                    }
                }
            );

            Blog.populate(post, {
                    'path': 'postedBy',
                    'select': 'name email photoUrl public_id'
                },
                function (err, info) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }
                    let data = {
                        created_at: info.createdAt,
                        message: info.message,
                        title: info.title,
                        public_id: info.public_id,
                        mediaUrl: info.uploadUrl,
                        postedBy: info.postedBy,
                        blogId: info._id
                    };
                    res.success(data);
                });
        });
        fs.unlink(file.path, function (err, y) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            console.log(y);
        });
    })
});

/*** END POINT FOR EDITING POST BY A CURRENTLY LOGGED IN USER */
router.put('/:blogId', function (req, res) {

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

    Blog.findOne({_id: id, postedBy: req.user.id}, function (err, post) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }
        cloudinary.v2.uploader.destroy(post.public_id, function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Some error occurred");
            }
            Blog.remove({_id: id, postedBy: req.user.id}, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Some error occurred");
                }
                res.success('blog post successfully deleted')
            })
        });
    })
});

function cloudUpload(file, callback) {

    if (file['type'].split('/')[0] === 'image') {
        console.log("it worked");
        cloudinary.v2.uploader.upload(file.path, (err, result) => {
            if (err) {
                console.log(err);
                return callback(err.message);
            } else {
                console.log(result);
                return callback(null, result);
            }
         })
    }
    else if (file['type'].split('/')[0] === 'video') {
        console.log("it worked too");

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