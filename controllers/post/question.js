let express = require('express');
let router = express.Router();
let fs = require('fs');

const config = require('../../config');
let cloudinary = require('cloudinary');
cloudinary.config(config.cloudinary);

let Question = require('../../models/question');
let arrayUtils = require('../../utils/array');
let validator = require('../../utils/validator');


/*** END POINT A POST BY ITS ID BY CURRENTLY LOGGED IN USERS */
router.get('/q/:questionId', function (req, res) {

    let questionId = req.params.questionId,
        userId = req.user.id;

    Question.findOne({_id: questionId})
        .populate({
            path: 'postedBy',
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
                postedOn: post.createdAt,
                postedBy: post.postedBy,
                nlikes: post.likes.length,
                nviews: post.views.length,
                ndislikes: post.dislikes.length,
                comments: post.comments.length
            };
            Question.update({
                "_id": questionId,
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
                res.success(info);
            });
        });
});

/*** END POINT FOR POST CREATION CONTAINING FILE TO BE UPLOADED BY A CURRENTLY LOGGED IN USER */
router.post('/', function (req, res) {

    let story = req.body.story,
        cate_tags = req.body.category;

    let validated = validator.isSentence(res, story )&&
        validator.isCategory(res, cate_tags);

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
        story: story,
        postedBy: req.user.id,
        category: categoryTags
    };

    Question.create(data, function (err, post) {
        if (err) {
            console.log(err);
            return res.serverError("Something unexpected happened");
        }

        let data = {
            postId : post._id,
            story: post.story,
            postedOn: post.postedOn,
            category: post.category
        };
        res.success(data);
    });
});

/*** END POINT FOR EDITING POST BY A CURRENTLY LOGGED IN USER */
router.put('/:questionId', function (req, res) {

    let story = req.body.story,
        cate_tags = req.body.cate_tags;

    if (!(story || cate_tags)) {
        return res.badRequest("please enter values to fields you will love to be updated");
    }

    let values = {};
    values.postedBy = req.user.id;

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

    Question.findOneAndUpdate({
        query: {
            _id: req.params.questionId,
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
router.delete('/:questionId', function (req, res) {

    let id = req.params.questionId;

    // Question.findOne({_id: id, postedBy: req.user.id}, function (err, post) {
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

            Question.remove({_id: id, postedBy: req.user.id}, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Some error occurred");
                }

                console.log(result);
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