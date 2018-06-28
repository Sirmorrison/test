let express = require('express');
let router = express.Router();
let fs = require('fs');
let mongoose = require("mongoose");

const config = require('../../config');
let cloudinary = require('cloudinary');
cloudinary.config(config.cloudinary);

let Question = require('../../models/question');
let arrayUtils = require('../../utils/array');
let validator = require('../../utils/validator');
let User = require('../../models/user');


/*** END POINT FOR GETTING THE QUESTION AND ANSWERS INFORMATION USER BY LOGGED IN USERS*/
router.get('/:questionId', function (req, res) {
    let questionId = req.params.questionId,
        id = mongoose.Types.ObjectId(questionId);

    // Question.update({
    //     "_id": questionId,
    //     "views": {
    //         "$not": {
    //             "$elemMatch": {
    //                 "userId": userId
    //             }
    //         }
    //     }
    // }, {
    //     $addToSet: {
    //         views: {
    //             "userId": userId
    //         }
    //     }
    // }
    Question.update(
        {"_id": questionId},
        {$inc: {views: 1}}, function (err) {
            if (err) {
                console.log(err);
                return callback("Something unexpected happened");
            }

            Question.aggregate([
                {$match: {"_id": id}},
                {
                    $project: {
                        answers: {
                            $map: {
                                input: '$answers',
                                as: "element",
                                in: {
                                    answerId: "$$element._id",
                                    answeredOn: '$$element.createdAt',
                                    answeredBy: '$$element.answeredBy',
                                    answers: '$$element.answer',
                                    views: "$$element.views",
                                    upVotes: {$size: "$$element.likes"},
                                    rating: {$avg: "$$element.rating"},
                                    downVotes: {$size: "$$element.dislikes"}
                                }
                            }
                        },
                        question: 1,
                        postedBy: 1
                    }
                },
            ], function (err, data) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                if (!data) {
                    return res.success([]);
                }

                Question.populate(data, {
                        'path': 'postedBy answers.answeredBy',
                        'select': 'name email photoUrl ranking'
                    },

                    function (err, post) {

                        if (err) {
                            console.log(err);
                            return res.badRequest("Something unexpected happened");
                        }

                        res.success(post);
                    }
                );
            });
        });
});

/*** END POINT FOR POST CREATION CONTAINING FILE TO BE UPLOADED BY A CURRENTLY LOGGED IN USER */
router.post('/', function (req, res) {

    let userId = req.user.id,
        question = req.body.question,
        cate_tags = req.body.category;

    let validated = validator.isSentence(res, question )&&
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
        question: question,
        postedBy: userId,
        category: categoryTags
    };

    Question.create(data, function (err, post) {
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
        let data = {
            postId : post._id,
            question: post.question,
            postedOn: post.createdAt,
        };
        res.success(data);
    });
});

/*** END POINT FOR EDITING POST BY A CURRENTLY LOGGED IN USER */
router.put('/:questionId', function (req, res) {

    let question = req.body.question,
        cate_tags = req.body.category;

    if (!(question || cate_tags)) {
        return res.badRequest("please enter values to fields you will love to be updated");
    }
    if (cate_tags && !Array.isArray(cate_tags)){
        return res.badRequest('Tagged should be a json array of user Ids (string)')
    }

    let values = {};
    values.postedBy = req.user.id;

    if (question) {
        let vmess = validator.isSentence(res, question);
        if (!vmess)
            return;
        values.question = question;
    }
    console.log(values)

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

    Question.findOneAndUpdate({_id: req.params.questionId, postedBy: req.user.id},
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
                console.log(err)
                return res.serverError("Something unexpected happened");
            }
            if (post === null) {
                return res.notAllowed("you re not allowed to perform this action");
            }
            let data = {
                questionId: post._id,
                createdAt:post.createdAt,
                updatedAt:post.updatedAt,
                question: post.question,
                postedBy: post.postedBy,
                category: post.category
            };
        res.success(data);
    });

});

/*** END POINT FOR DELETING A POST BY A CURRENTLY LOGGED IN USER */
router.delete('/:questionId', function (req, res) {

    let id = req.params.questionId;
    Question.remove({_id: id, postedBy: req.user.id}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }
        if(!result){
            return res.badRequest("no post found with that id")
        }

        res.success('question successfully deleted')
    })
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