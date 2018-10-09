let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

let Story = require('../../models/story');
let validator = require('../../utils/validator');
let Admin = require('../../models/admin_user');
let arrayUtils = require('../../utils/array');
let Category = require('../../models/categories');


//STORIES
/*** END POINT FOR GETTING STORY DASHBOARD DATA BY LOGGED IN ADMIN USERS*/
router.get('/dashboard', function (req, res) {

    let userId = req.user.id;
    Admin.findById(userId, function (err, user) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!user) {
            return res.badRequest("no user found with this id");
        }
        Story.aggregate([
            {
                $facet: {
                    "total Stories": [
                        {$sortByCount: {$sum: 1}}
                    ],
                    "category": [
                        {$unwind: {path: "$category", preserveNullAndEmptyArrays: true}},
                        {
                            $group: {
                                _id: '$category.categoryId', categoryId: {$addToSet: '$category.categoryId'},
                                count: {$sum: 1},
                            }
                        },
                        {$sort: {count: -1}},
                        {$limit: 4}
                    ]
                }
            },
        ], function (err, data) {

            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            Story.populate(data, {
                    'path': 'category.categoryId',
                    'select': 'title'
                },

                function (err, post) {

                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }
                    if (!post) {
                        return res.success([]);
                    }

                    res.success(data);
                }
            );
        });
    });
});

//all stories admin and user
/*** END POINT FOR GETTING ALL THE STORY REGARDLESS OF CATEGORY BY LOGGED IN ADMIN USERS*/
router.get('/users', allow('stories'), function (req, res) {

    Story.aggregate([
        {$match: {$nor:[{for: 'ASK OLEUM'}]}},
        {
            $project: {
                comments: {$size: '$comments'},
                likes: {$size: '$likes'},
                dislikes: {$size: '$likes'},
                title: 1,
                postedBy: 1,
                views: 1,
                createdAt: 1
            },
        },
        {$sort: {createdAt: -1}},
        {$limit: 20}
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data, {
                'path': 'postedBy',
                'select': 'name photoUrl'
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

/*** END POINT FOR GETTING ALL THE STORY REGARDLESS OF CATEGORY BY LOGGED IN ADMIN USERS*/
router.get('/ask_oleum', allow('stories'), function (req, res) {

    Story.aggregate([
        {$match: {for: 'ASK OLEUM'}},
        {
            $project: {
                comments: {$size: '$comments'},
                likes: {$size: '$likes'},
                dislikes: {$size: '$likes'},
                title: 1,
                postedBy: 1,
                views: 1,
                createdAt: 1
            },
        },
        {$sort: {createdAt: -1}},
        {$limit: 20}
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Story.populate(data, {
                'path': 'postedBy',
                'model': 'Admin_user',
                'select': 'name photoUrl'
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

//single stories admin and user
/*** END POINT FOR GETTING A STORY BY ITS ID BY LOGGED IN ADMIN USERS*/
router.get('/user/:storyId', allow('stories'), function (req, res) {
    let storyId = req.params.storyId,
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
                        comments: {$size: '$comments'},
                        likes: {$size: '$likes'},
                        dislikes: {$size: '$likes'},
                        // $map: {
                        //     input: '$comments',
                        //     as: "element",
                        //     in: {
                        //         commentId: "$$element._id",
                        //         comment: "$$element.comment",
                        //         commentedOn: '$$element.createdAt',
                        //         commentedBy: '$$element.commentedBy',
                        //         likes: {$size: "$$element.likes"},
                        //         dislikes: {$size: "$$element.dislikes"}
                        //     }
                        // }
                        // },
                        story: 1,
                        postedBy: 1,
                        views: 1,
                        category: 1
                    }
                },
            ], function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                Story.populate(data, {
                        'path': 'postedBy',
                        'select': 'name photoUrl'
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

/*** END POINT FOR GETTING A STORY BY ITS ID BY LOGGED IN ADMIN USERS*/
router.get('/ask_oleum/:storyId', allow('stories'), function (req, res) {
    let storyId = req.params.storyId,
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
                        comments: {$size: '$comments'},
                        likes: {$size: '$likes'},
                        dislikes: {$size: '$likes'},
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
                        postedBy: 1,
                        views: 1,
                        title: 1
                    }
                },
            ], function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                Story.populate(data, {
                    'path': 'postedBy ',
                    'model': 'Admin_user',
                    'select': 'name photoUrl title'
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

//comments admin and user
/*** END POINT FOR GETTING A STORY BY ITS ID BY LOGGED IN ADMIN USERS*/
router.get('/user/comment/:storyId', allow('stories'), function (req, res) {
    let storyId = req.params.storyId,
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
                        comments: {$size: '$comments'},
                        likes: {$size: '$likes'},
                        dislikes: {$size: '$likes'},
                        // $map: {
                        //     input: '$comments',
                        //     as: "element",
                        //     in: {
                        //         commentId: "$$element._id",
                        //         comment: "$$element.comment",
                        //         commentedOn: '$$element.createdAt',
                        //         commentedBy: '$$element.commentedBy',
                        //         likes: {$size: "$$element.likes"},
                        //         dislikes: {$size: "$$element.dislikes"}
                        //     }
                        // }
                        // },
                        story: 1,
                        postedBy: 1,
                        views: 1,
                        category: 1
                    }
                },
            ], function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                Story.populate(data, {
                        'path': 'postedBy',
                        'select': 'name photoUrl'
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

/*** END POINT FOR GETTING A STORY BY ITS ID BY LOGGED IN ADMIN USERS*/
router.get('/ask_oleum/:storyId', allow('stories'), function (req, res) {
    let storyId = req.params.storyId,
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
                        comments: {$size: '$comments'},
                        likes: {$size: '$likes'},
                        dislikes: {$size: '$likes'},
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
                        postedBy: 1,
                        views: 1,
                        title: 1
                    }
                },
            ], function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                Story.populate(data, {
                        'path': 'postedBy ',
                        'model': 'Admin_user',
                        'select': 'name photoUrl title'
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

//likes admin and user
/*** END POINT FOR GETTING A STORY BY ITS ID BY LOGGED IN ADMIN USERS*/
router.get('/user/:storyId', allow('stories'), function (req, res) {
    let storyId = req.params.storyId,
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
                        comments: {$size: '$comments'},
                        likes: {$size: '$likes'},
                        dislikes: {$size: '$likes'},
                        // $map: {
                        //     input: '$comments',
                        //     as: "element",
                        //     in: {
                        //         commentId: "$$element._id",
                        //         comment: "$$element.comment",
                        //         commentedOn: '$$element.createdAt',
                        //         commentedBy: '$$element.commentedBy',
                        //         likes: {$size: "$$element.likes"},
                        //         dislikes: {$size: "$$element.dislikes"}
                        //     }
                        // }
                        // },
                        story: 1,
                        postedBy: 1,
                        views: 1,
                        category: 1
                    }
                },
            ], function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                Story.populate(data, {
                        'path': 'postedBy',
                        'select': 'name photoUrl'
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

/*** END POINT FOR GETTING A STORY BY ITS ID BY LOGGED IN ADMIN USERS*/
router.get('/ask_oleum/:storyId', allow('stories'), function (req, res) {
    let storyId = req.params.storyId,
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
                        comments: {$size: '$comments'},
                        likes: {$size: '$likes'},
                        dislikes: {$size: '$likes'},
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
                        postedBy: 1,
                        views: 1,
                        title: 1
                    }
                },
            ], function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                Story.populate(data, {
                        'path': 'postedBy ',
                        'model': 'Admin_user',
                        'select': 'name photoUrl title'
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

//create post
/*** END POINT FOR SENDING A POST BROADCAST BY A CURRENTLY LOGGED ADMIN IN USER */
router.post('/', allow('stories'), function (req, res) {

    let story = req.body.story,
        title = req.body.title,
        userId = req.user.id,
        file = req.files,
        view_cost = req.body.view_cost,
        cate_tags = req.body.category;

    //remove duplicates before proceeding
    arrayUtils.removeDuplicates(cate_tags);

    let validated = validator.isSentence(res, story) &&
        validator.isCategory(res, cate_tags) &&
        validator.isDetails(res, view_cost) &&
        validator.isSentence(res, title);
    if (!validated) return;


    let categoryTags = []; //new empty array
    for (let i = 0; i < cate_tags.length; i++) {
        let cateId = cate_tags[i];

        if (typeof(cateId) !== "string") {
            return res.badRequest("category IDs in tagged array must be string");
        }

        categoryTags.push({categoryId: cateId});
    }
    if (!file || file === null || file === undefined) {
        console.log('im here 1')
        let data = {
            title: title,
            story: story,
            postedBy: userId,
            category: categoryTags,
            view_cost: view_cost,
            for: 'ASK OLEUM'
        };

        createStory(data, function (err, post) {
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
                mediaType: post.mediaType,
                mediaUrl: post.mediaUrl,
                view_cost: post.view_cost
            };

            return res.success(data);
        });
    }
    else {
        console.log('im here 2')

        let validated = validator.isFile(res, file);
        if (!validated) return;
        console.log(validated);

        cloudUpload(file, function (err, result) {

            if (err) {
                console.log(err);
                res.badRequest(err.message);
            }

            let data = {
                title: title,
                story: story,
                postedBy: userId,
                category: categoryTags.categoryId,
                mediaUrl: result.secure_url,
                mediaType: file.type,
                view_cost: view_cost,
                public_id: result.public_id,
                for: 'ASK OLEUM'
            };

            createStory(data, function (err, post) {
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
                    mediaType: post.mediaType,
                    mediaUrl: post.mediaUrl,
                    view_cost: post.view_cost
                };

                return res.success(data);
            });
        })
    }
});

//delete post
/*** END POINT FOR DELETING A STORY BY A CURRENTLY LOGGED IN ADMIN USER */
router.delete('/:storyId', allow('stories'), function (req, res) {

    let id = req.params.storyId;
    Story.remove({_id: id}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }
        if (!result) {
            return res.badRequest("no post found with that id")
        }

        res.success('question successfully deleted')
    })
});

/*** END POINT FOR DELETING A POST B.C BY A CURRENTLY LOGGED IN ADMIN USER */
router.delete('/:broadcastId', allow('stories'), function (req, res) {

    let id = req.params.broadcastId;
    let userId = req.user.id;

    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Admin_post.remove({_id: id}, function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Some error occurred");
            }
            if (!result) {
                return res.badRequest("no post found with that id")
            }

            res.success('broadcast successfully deleted')
        })
    })
});

function allow(admin_function) {
    return function (req, res, next) {
        let userId = req.user.id;
        Admin.findById(userId, function (err, user) {
            if(err){
                console.log(err);
                return res.badRequest('something happened')
            }
            if (user) {
                let that = user.admin_function;
                for (let i = 0; i < that.length; i++) {
                    if (that[i].match(admin_function) || user.role === 'general') {
                        req.user = user;

                        return next();
                    }
                }
            }

            return res.unauthorized('you are not authorized to perform this action')
        })

    }
}

function categoryCheck(cate, res, next) {

    Category.find({_id: cate}, function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest('something happened')
        }
        if (!data) {
            return res.unauthorized('no category found with details provided')
        }

        return next();
    })
}

function cloudUpload(file, callback) {

    if (file.null['type'].split('/')[0] === 'image') {
        console.log("it worked");

        let stream = cloudinary.v2.uploader.upload_stream('/images/',function(err, result){
            if (err) {
                console.log(err);
                return callback(err.message);
            } else {
                console.log(result);
                return callback(null, result);
            }
        });

        fs.createReadStream(file.null.path).pipe(stream);
        fs.unlink(file.null.path, function (err, y) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            console.log(y);
        });
    }
    else if (file.null['type'].split('/')[0] === 'video') {
        console.log('im at videos');

        let stream = cloudinary.v2.uploader.upload_stream({resource_type: "video"}, function(err, result){
            if (err) {
                console.log(err);
                return callback(err.message);
            } else {
                console.log(result);
                return callback(null, result);
            }
        });

        fs.createReadStream(file.null.path).pipe(stream);
        fs.unlink(file.null.path, function (err, y) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            console.log(y);
        });
    }
    else {
        return callback('file type not supported and upload has failed')
    }
}

function createStory(data, callback) {
    Story.create(data, function (err, story) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        Story.populate(story, {
                'path': 'postedBy category.categoryId',
                 model: 'Admin_user',
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

module.exports = router;