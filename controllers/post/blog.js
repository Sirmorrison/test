let express = require('express');
let router = express.Router();
let fs = require('fs');
let mongoose = require("mongoose");

const config = require('../../config');
let cloudinary = require('cloudinary');
cloudinary.config(config.cloudinary);

let Blog = require('../../models/blog');
let validator = require('../../utils/validator');
let User = require('../../models/user');
let arrayUtils = require('../../utils/array');
const protector = require('../../middlewares/protector');


/*** END POINT FOR GETTING BLOG POST BY USERS */
router.get('/', function(req, res) {

    Blog.aggregate([
        {$match:  {"status": "approved"}},
        {
            $project: {
                comments: {$size: "$comments"},
                likes: {$size: "$likes"},
                title: 1,
                createdAt: 1,
                postedBy: 1,
                message: 1,
                mediaUrl: 1
            }
        },
        {$sort: {createdAt: -1}},
        {$limit: 50}
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        User.populate(data, {
                'path': 'postedBy',
                'select': 'name photoUrl email bio'
            },
            function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(data);
            }
        );
    })
});

/*** END POINT FOR GETTING POST OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/2/', function (req, res) {

    let token = req.body.token || req.query.token || req.headers.token;
    if (token) {
        protector.protect(req, res, function () {
            let userId = req.user.id;
            getUserCategory(userId, function (err, detail) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err);
                }

                let list = detail[0].categoryTags,
                    data = list.map(function (item) {
                        return item['categoryId']
                    });
                console.log(data);

                let category = [];
                for (let i = 0; i < data.length; i++) {
                    let id = mongoose.Types.ObjectId(data[i]);
                    category.push(id);
                }
                Blog.aggregate([
                    {$match: {"category.categoryId": {$in: category}}},
                    {
                        $project: {
                            comments: {$size: "$comments"},
                            likes: {$size: "$likes"},
                            views: 1,
                            "category.categoryId": 1,
                            createdAt: 1,
                            postedBy: 1,
                            message:1,
                            title: 1
                        }
                    },
                    {$sort: {createdAt: -1}},
                    {$limit: 50}

                ], function (err, data) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }
                    Blog.populate(data, {
                            'path': 'postedBy category.categoryId',
                            'select': 'name photoUrl ranking title'
                        },
                        function (err, post) {

                            if (err) {
                                console.log(err);
                                return res.badRequest("Something unexpected happened");
                            }
                            // let data = {
                            //     comments : post.comments,
                            //     dislikes: post.dislikes,
                            //     likes : post.likes,
                            //     views: post.views,
                            //     category: post.category.categoryId,
                            //     createdAt: post.createdAt,
                            //     postedBy: post.postedBy,
                            //     title: post.title,
                            // }
                            // let word = post.story,
                            //     nWord = word.split(' ');
                            // if (nWord.length > 100){
                            //     let vStory = nWord.slice(0, 20);
                            //     data.Blog = vStory.join(' ')+'...'
                            // }else{
                            //     let vStory = nWord.slice(0,3);
                            //     data.Blog = vStory.join(' ')+'...'
                            // }

                            res.success(post);
                        }
                    );
                })
            })
        })
    }else{
        Blog.aggregate([
            {
                $project: {
                    comments: {$size: "$comments"},
                    likes: {$size: "$likes"},
                    views: 1,
                    "category.categoryId": 1,
                    createdAt: 1,
                    message: 1,
                    postedBy: 1,
                    attachment: 1,
                    title: 1
                }
            },
            {$sort: {views: -1, comments: -1, answers: -1}},
            {$limit: 50}
        ], function (err, data) {

            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            Blog.populate(data, {
                    'path': 'postedBy category.categoryId',
                    'select': 'name photoUrl ranking title'
                },
                function (err, post) {

                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }
                    // let data = {
                    //     comments : post.comments,
                    //     dislikes: post.dislikes,
                    //     likes : post.likes,
                    //     views: post.views,
                    //     category: post.category,
                    //     createdAt: post.createdAt,
                    //     postedBy: post.postedBy,
                    //     title: post.title,
                    // }
                    // console.log(post.story)
                    //
                    // let word = post.story,
                    //     nWord = word.split(' ');
                    // if (nWord.length > 100){
                    //     let vStory = nWord.slice(0, 20);
                    //     data.Blog = vStory.join(' ')+'...'
                    // }else{
                    //     let vStory = nWord.slice(0,3);
                    //     data.Blog = vStory.join(' ')+'...'
                    // }

                    res.success(post);
                }
            );
        });
    }
});

/*** END POINT FOR GETTING BLOG POST BY THE ID BY USERS*/
router.get('/:blogId', function (req, res) {
    let blogId = req.params.blogId,
        id = mongoose.Types.ObjectId(blogId);

    Blog.aggregate([
        {$match: {"_id": id, status: "approved"}},
        {
            $project: {
                comments: {
                    $map: {
                        input: '$comments',
                        as: "element",
                        in: {
                            commentId: "$$element._id",
                            comment: "$$element.comment",
                            commentedOn: '$$element.createdAt',
                            commentedBy: '$$element.commentedBy'
                        }
                    }
                },
                title: 1,
                message: 1,
                postedBy: 1,
                createdAt: 1,
                views: 1,
                attachment: 1,
                'category.categoryId':1,
            }
        },
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Blog.populate(data, {
                'path': 'postedBy comments.commentedBy category.categoryId',
                'select': 'name ranking title'
            },
            function (err, post) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(post);
            }
        );
    })
});

/*** END POINT FOR GETTING BLOG POST BY THE ID BY USERS*/
router.get('/personal/:blogId', function (req, res) {
    let blogId = req.params.blogId,
        id = mongoose.Types.ObjectId(blogId);

    Blog.aggregate([
        {$match: {"_id": id, postedBy: req.user.id}},
        {
            $project: {
                comments: {
                    $map: {
                        input: '$comments',
                        as: "element",
                        in: {
                            commentId: "$$element._id",
                            comment: "$$element.comment",
                            commentedOn: '$$element.createdAt',
                            commentedBy: '$$element.commentedBy'
                        }
                    }
                },
                title: 1,
                status: 1,
                uploadUrl: 1,
                message: 1,
                postedBy: 1,
                createdAt: 1,
                'total comments': {$size: '$comments'}
            }
        },
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        // if(data.message === undefined){
        //     return res.unauthorized('not allowed to view this post')
        // }

        Blog.populate(data, {
                'path': 'comments.commentedBy',
                'select': 'name email photoUrl public_id'
            },
            function (err, post) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(post);
            }
        );
    })
});

/*** END POINT FOR POST CREATION CONTAINING FILE TO BE UPLOADED BY A CURRENTLY LOGGED IN USER */
router.post('/', protector.protect, function (req, res) {

    let message = req.body.message,
        title = req.body.title,
        userId = req.user.id,
        file = req.files.null,
        cate_tags = req.body.category;

    let validated = validator.isFile(res, file)&&
        validator.isSentence(res, title)&&
        validator.isCategory(res, cate_tags) &&
        validator.isSentence(res, message);
    if (!validated) return;

    arrayUtils.removeDuplicates(cate_tags);

    let categoryTags = []; //new empty array
    for (let i = 0; i < cate_tags.length; i++) {
        let cateId = cate_tags[i];

        categoryTags.push({categoryId: cateId});
    }

    uploadMany(file, function (err, result) {

        if (err) {
            console.log(err);
            res.badRequest(err.message);
        }

        let data = {
            attachment: result,
            postedBy: userId,
            message: message,
            title: title
        };

        createBlog(data, userId,  function (err, post) {
            if (err) {
                console.log(err)
                return res.badRequest(err.message);
            }

            Blog.populate(post, {
                    'path': 'postedBy',
                    'select': 'name ranking photoUrl'
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
                        approved: info.status,
                        blogId: info._id,
                        attachment: info.attachment
                    };

                    res.success(data);
                }
            );
        });
    })
});

/*** END POINT FOR EDITING POST BY A CURRENTLY LOGGED IN USER */
router.put('/:blogId', protector.protect, function (req, res) {

    let title = req.body.title,
        blogId = req.params.blogId,
        userId = req.user.id,
        message = req.body.message,
        cate_tags = req.body.category;

    if (!(title || message || cate_tags)) {
        return res.badRequest("please enter values to fields you will love to be updated");
    }

    let values = {};

    if (title) {
        let vmess = validator.isSentence(res, title);
        if (!vmess) return;
        values.title = title;
    }
    if (message) {
        let vmess = validator.isSentence(res, message);
        if (!vmess) return;
        values.message = message;
    }
    if (cate_tags) {
        //remove duplicates before proceeding
        arrayUtils.removeDuplicates(cate_tags);

        let validated = validator.isCategory(res, cate_tags);
        if (!validated) return;
        console.log(validated)

        values.category = [];
        for (let i = 0; i < cate_tags.length; i++) {
            let cateId = cate_tags[i];

            if (typeof(cateId) !== "string") {
                return res.badRequest("category IDs in tagged array must be string");
            }

            values.category.push({categoryId: cateId});
        }
    }

    Blog.findOneAndUpdate({_id: blogId, postedBy: userId}, {$set: values}, {new: true})
        .populate({
            path: 'postedBy',
            select: 'name photoUrl'
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
                blogId: post._id,
                createdAt:post.createdAt,
                updatedAt:post.updatedAt,
                title: post.title,
                message: post.message,
                postedBy: post.postedBy
            };

            res.success(data);
        }
    );
});

/*** END POINT FOR DELETING A POST BY A CURRENTLY LOGGED IN USER */
router.delete('/:blogId', protector.protect, function (req, res) {

    let id = req.params.blogId;
    Blog.findOne({_id: id, postedBy: req.user.id}, function (err, post) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }
        if(!post){
            return res.badRequest("no blog found with details provided");
        }
        console.log(post.attachment)
        if(post.attachment) {
            let list = post.attachment;
            deleteMany(list, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err);
                }
                console.log(result);

                Blog.remove({_id: id, postedBy: req.user.id}, function (err, result) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Some error occurred");
                    }
                    res.success('blog post successfully deleted')
                })
            })
        }else{
            Blog.remove({_id: id, postedBy: req.user.id}, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Some error occurred");
                }

                res.success('blog post successfully deleted')
            })
        }
    })
});

function deleteMany(data, callback) {

    let res_promise = data.map(file => new Promise((resolve, reject) => {
        cloudinary.v2.uploader.destroy(file.public_id, function (err, result) {
            if (err) {
                console.log(err);
                reject(err)
            }
            else {
                resolve(result)
            }
        })
    }));
    Promise.all(res_promise)
        .then(result => callback(null, result))
        .catch((err) => callback(err))
}

function uploadMany(file, callback) {
    console.log(file.length);

    if(file.length > 8){
        return res.badRequest('you can not upload more than 8 pictures at a time')
    }
    if(file.length > 1) {
        console.log('stuck here');
        let res_promise = file.map(file => new Promise((resolve, reject) => {
            cloudinary.v2.uploader.upload(file.path, {resource_type: 'auto'}, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err)
                }
                else {
                    let data = {
                        public_id: result.public_id,
                        mediaUrl: result.secure_url,
                        mediaType: result.resource_type
                    };

                    resolve(data)
                }
            })
        }));
        Promise.all(res_promise)
            .then(result => callback(null, result))
            .catch((err) => callback(err))
    }else {
        console.log('i have a file thytedeeddd');
        cloudinary.v2.uploader.upload(file.path, {resource_type: 'auto'}, function (err, result) {
            if (err) {
                console.log(err);
                return callback(err)
            }
            let data = {
                public_id: result.public_id,
                mediaUrl: result.secure_url,
                mediaType: result.resource_type
            };

            return callback(null, data)
        })
    }
}

function createBlog(data, userId, callback) {
    Blog.create(data, function (err, story) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        User.update(
            {"_id": userId},
            {$inc: {rating: 100}}, function (err) {
                if (err) {
                    console.log(err);
                }
            }
        );

        return callback(null, story)
    })
}

function getUserCategory(userId, callback) {
    User.aggregate([
        {$match: {'_id': userId}},
        {$project: {'categoryTags.categoryId': 1}}
    ], function (err, data) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!data) {
            return callback("YOU NEED TO BE A REGISTERED USER TO VIEW GET ACCESS");
        }

        return callback(null, data);
    });
}

module.exports = router;