let express = require('express');
let router = express.Router();
let fs = require('fs');
let mongoose = require("mongoose");

const config = require('../../config');
let cloudinary = require('cloudinary');
cloudinary.config(config.cloudinary);

const protector = require('../../middlewares/protector');
let Story = require('../../models/story');
let arrayUtils = require('../../utils/array');
let validator = require('../../utils/validator');
let User = require('../../models/user');
let Packages = require('../../models/packages');


/*** END POINT FOR GETTING POST OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/', function (req, res) {

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
                Story.aggregate([
                    {$match: {"category.categoryId": {$in: category}}},
                    {
                        $project: {
                            comments: {$size: "$comments"},
                            dislikes: {$size: "$dislikes"},
                            likes: {$size: "$likes"},
                            views: 1,
                            "category.categoryId": 1,
                            createdAt: 1,
                            postedBy: 1,
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
                    Story.populate(data, {
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
                            //     data.Story = vStory.join(' ')+'...'
                            // }else{
                            //     let vStory = nWord.slice(0,3);
                            //     data.Story = vStory.join(' ')+'...'
                            // }

                            res.success(post);
                        }
                    );
                })
            })
        })
    }else{
        Story.aggregate([
            {
                $project: {
                    comments: {$size: "$comments"},
                    dislikes: {$size: "$dislikes"},
                    likes: {$size: "$likes"},
                    views: 1,
                    "category.categoryId": 1,
                    createdAt: 1,
                    postedBy: 1,
                    // story: 1,
                    // attachment: 1,
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

            Story.populate(data, {
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
                    //     data.Story = vStory.join(' ')+'...'
                    // }else{
                    //     let vStory = nWord.slice(0,3);
                    //     data.Story = vStory.join(' ')+'...'
                    // }

                    res.success(post);
                }
            );
        });
    }
});

/*** END POINT FOR GETTING QUESTION OF BY CATEGORIES BY CURRENTLY LOGGED IN USER */
router.get('/category', function (req, res) {

    let catId = req.body.categoryId,
        v = validator.isCategory(res, catId);
    if(!v) return;

    let category = [];
    for (let i = 0; i < data.length; i++) {
        let id = mongoose.Types.ObjectId(data[i]);
        category.push(id);
    }

    Story.aggregate([
        {$match: {"category.categoryId": {$in: category}}},
        {
            $project: {
                comments: {$size: "$comments"},
                dislikes: {$size: "$dislikes"},
                likes: {$size: "$likes"},
                views: 1,
                "category.categoryId": 1,
                createdAt: 1,
                postedBy: 1,
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

        Story.populate(data, {
                'path': 'postedBy category.categoryId',
                'select': 'name photoUrl ranking title'
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

/*** END POINT FOR GETTING A STORY OF A USER BY LOGGED IN USERS /GUEST USERS */
router.get('/:postId', function (req, res) {
    let storyId = req.params.postId,
        id = mongoose.Types.ObjectId(storyId);

    Story.update(
        {"_id": storyId},
        {$inc: {views: 1}}, function (err) {
            if (err) {
                console.log(err)
            }

            Story.aggregate([
                {$match: {"_id": id}},
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
                                    commentedBy: '$$element.commentedBy',
                                    likes: {$size: "$$element.likes"},
                                    dislikes: {$size: "$$element.dislikes"}
                                }
                            }
                        },
                        story: 1,
                        title:1,
                        "category.categoryId": 1,
                        postedBy: 1,
                        views: 1,
                        dislikes: {$size: "$dislikes"},
                        likes: {$size: "$likes"},
                        total_comments: {$size: '$comments'}
                    }
                },
            ], function (err, data) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                Story.populate(data, {
                        'path': 'postedBy category.categoryId comments.commentedBy',
                        'select': 'name photoUrl ranking title'
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
});

/*** END POINT FOR GETTING A STORY OF A USER BY LOGGED IN USERS /GUEST USERS */
router.get('/ask_oleum/:postId', function (req, res) {
    let storyId = req.params.postId,
        id = mongoose.Types.ObjectId(storyId);

    Story.update(
        {"_id": storyId},
        {$inc: {views: 1}}, function (err) {
            if (err) {
                console.log(err)
            }

            Story.aggregate([
                {$match: {"_id": id}},
                {
                    $project: {
                        // comments: {
                        //     $map: {
                        //         input: '$comments',
                        //         as: "element",
                        //         in: {
                        //             commentId: "$$element._id",
                        //             comment: "$$element.comment",
                        //             commentedOn: '$$element.createdAt',
                        //             commentedBy: '$$element.commentedBy',
                        //             likes: {$size: "$$element.likes"},
                        //             dislikes: {$size: "$$element.dislikes"}
                        //         }
                        //     }
                        // },
                        story: 1,
                        title:1,
                        postedBy: 1,
                        views: 1,
                        "category.categoryId": 1,
                        dislikes: {$size: "$dislikes"},
                        likes: {$size: "$likes"},
                        comments: {$size: '$comments'}
                    }
                },
            ], function (err, data) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                Story.populate(data, {
                        'path': 'postedBy category.categoryId',
                        'select': 'name photoUrl title'
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
});

/*** END POINT FOR POST CREATION CONTAINING FILE TO BE UPLOADED BY A CURRENTLY LOGGED IN USER */
router.post('/', protector.protect, function (req, res) {

    let story = req.body.story,
        title = req.body.title,
        userId = req.user.id,
        file = req.files.null,
        view_cost = req.body.view_cost,
        cate_tags = req.body.category;

    let validated = validator.isSentence(res, story) &&
        validator.isCategory(res, cate_tags) &&
        validator.isDetails(res, view_cost) &&
        validator.isWord(res, title);
    if (!validated) return;

    arrayUtils.removeDuplicates(cate_tags);

    validViewCost(userId, function (err, info) {
        if (err) {
            return res.badRequest(err);
        }
        if (view_cost.amount < 0 || view_cost.amount > info.stories.max.amount) {
            return res.badRequest("view cost cannot be zero or greater than your package maximum allowed pricing of " + info.stories.max.amount);
        }

        let categoryTags = []; //new empty array
        for (let i = 0; i < cate_tags.length; i++) {
            let cateId = cate_tags[i];

            if (typeof(cateId) !== "string") {
                return res.badRequest("category IDs in tagged array must be string");
            }

            categoryTags.push({categoryId: cateId});
        }
        if (!file || file === null || file === undefined) {

            let data = {
                title: title,
                story: story,
                postedBy: userId,
                category: categoryTags,
                view_cost: view_cost
            };

            createStory(data, userId, function (err, post) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err.message);
                }

                let data = {
                    postId: post._id,
                    title: post.title,
                    story: post.story,
                    postedBy: post.postedBy,
                    postedOn: post.postedOn,
                    category: post.category.categoryId,
                    media: post.attachment,
                    view_cost: post.view_cost
                };

                res.success(data);
            });
        }else {
            uploadMany(file, function (err, result) {
                if (err) {
                    console.log(err);
                    res.badRequest(err.message);
                }

                let data = {
                    title: title,
                    story: story,
                    postedBy: userId,
                    category: categoryTags,
                    attachment: result,
                    view_cost: view_cost,
                };

                createStory(data, userId, function (err, post) {
                    if (err) {
                        console.log(err);
                        return res.badRequest(err.message);
                    }

                    let data = {
                        postId: post._id,
                        title: post.title,
                        story: post.story,
                        postedBy: post.postedBy,
                        postedOn: post.postedOn,
                        category: post.category,
                        media: post.attachment,
                        view_cost: post.view_cost
                    };

                    return res.success(data);
                });
            })
        }
    });
});

/*** END POINT FOR EDITING POST BY A CURRENTLY LOGGED IN USER */
router.put('/:storyId', protector.protect, function (req, res) {

    let title = req.body.title,
        story = req.body.story,
        file = req.files,
        id = req.params.storyId,
        cate_tags = req.body.category;

    if (!(title || story || cate_tags || file)) {
        return res.badRequest("please enter values to fields you will love to be updated");
    }
    if (cate_tags && !Array.isArray(cate_tags)){
        return res.badRequest('Tagged should be a json array of user Ids (string)')
    }

    let values = {};

    if (title) {
        let vmess = validator.isSentence(res, title);
        if (!vmess) return;
        values.title = title;
    }
    if (story) {
        let vmess = validator.isSentence(res, story);
        if (!vmess) return;
        values.story = story;
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
    console.log(values)

    Story.findOneAndUpdate({_id: id, postedBy: req.user.id},
        {$set: values}, {new: true})
        .populate({
            path: 'postedBy',
            select: 'name photoUrl'
        })
        .populate({
            path: 'category.categoryId',
            select: 'title'
        })
        .exec(function (err, post) {
            console.log(err, 'im hre');

            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            if(!post){
                return res.badRequest("no story found with details provided");
            }
            if (post === null) {
                return res.success("no field value was changed by you");
            }

            let data = {
                storyId: post._id,
                createdAt:post.createdAt,
                updatedAt:post.updatedAt,
                title: post.title,
                story: post.story,
                postedBy: post.postedBy,
            };

            res.success(data);
        });
});

/*** END POINT FOR DELETING A POST BY A CURRENTLY LOGGED IN USER */
router.delete('/:storyId', protector.protect, function (req, res) {

    let id = req.params.storyId;
    Story.findOne({_id: id, postedBy: req.user.id}, function (err, post) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }
        if(!post){
            return res.badRequest("no story found with the data provided given");
        }
        if(post.attachment) {
            let list = post.attachment;
            deleteMany(list, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err);
                }
                console.log(result);

                Story.remove({_id: id, postedBy: req.user.id}, function (err, result) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Some error occurred");
                    }
                    console.log(result)
                    res.success('story deleted successfully')
                })
            })
        }else {
            Story.remove({_id: id, postedBy: req.user.id}, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err);
                }
                console.log(result)
                res.success('story deleted successfully')
            })
        }
    });
});

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

function createStory(data, userId, callback) {
    Story.create(data, function (err, story) {
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

        Story.populate(story, {
            'path': 'postedBy category.categoryId',
            'select': 'name photoUrl title'
        },

        function (err, post) {

            if (err) {
                console.log(err);
                return callback("Something unexpected happened");
            }

            return callback(null, post)
        })
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

function validViewCost(userId, callback) {
    User.findOne({_id: userId}, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user || user === null || user === undefined) {
            return callback("no user found with id provided");
        }
        Packages.findOne({plan: user.packageType}, function (err, pack) {
            if (err) {
                console.log(err);
                return callback("Something unexpected happened");
            }
            if (!pack || pack === undefined || pack === null) {
                return callback("no package found with that name");
            }
            console.log(pack)

            return callback(null, pack)
        });
    })
}

module.exports = router;