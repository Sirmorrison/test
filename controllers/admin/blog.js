let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

let Blog = require('../../models/blog');
let validator = require('../../utils/validator');
let Admin = require('../../models/admin_user');


/*** END POINT FOR GETTING THE TOTAL NUMBER OF BLOGS IN DATABASE AND APPROVED BY ADMIN USERS*/
router.get('/dashboard', allow('blog'), function (req, res) {

    Blog.aggregate([
        {
            $facet: {
                "total blogs": [
                    {$sortByCount: {$sum: 1}}
                ],
                // "approved": [
                //     {
                //         $match: {
                //             approved: true,
                //         },
                //         $project: {
                //             total: {$size: '$approved'}
                //         }
                //     }
                // ],
                //     unapproved: [
                //         {
                //             $match: {
                //                 approved: false,
                //                 count: {$sum: 1},
                //             }
                //         }
                //     ]
            }
        },
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }


        res.success(data);
    });
});

/*** END POINT FOR GETTING ALL BLOGS IN DATABASE BY LOGGED IN ADMIN USERS*/
router.get('/all', allow('blog'), function (req, res) {

    Blog.aggregate([
        {
            $project: {
                comments: {$size: '$comments'},
                uploadUrl: 1,
                postedBy: 1,
                status: 1,
                title: 1,
                createdAt: 1
            },
        },
        {$sort: {createdAt: -1}},
        {$limit: 30}
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Blog.populate(data, {
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

/*** END POINT FOR GETTING THE ALL SUSPENDED BLOGS BY LOGGED IN ADMIN USERS*/
router.get('/suspended', allow('blog'), function (req, res) {

    Blog.aggregate([
        {$match: {status: 'suspended'}},
        {
            $project: {
                comments: {$size: '$comments'},
                // message: 1,
                postedBy: 1,
                approved: 1,
                title: 1,
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

        Blog.populate(data, {
                'path': 'postedBy',
                'select': 'name photoUrl'
            },

            function (err, post) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(post);
            });
    });
});

/*** END POINT FOR GETTING THE ALL APPROVED BLOGS BY LOGGED IN ADMIN USERS*/
router.get('/approved', allow('blog'), function (req, res) {

    Blog.aggregate([
        {$match: {status: 'approved'}},
        {
            $project: {
                comments: {$size: '$comments'},
                // message: 1,
                postedBy: 1,
                approved: 1,
                title: 1,
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

        Blog.populate(data, {
                'path': 'postedBy',
                'select': 'name photoUrl'
            },

            function (err, post) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }

                res.success(post);
            });
    });
});

/*** END POINT FOR GETTING BLOG POST BY THE ID BY ADMIN USERS*/
router.get('/blog/:blogId', allow('blog'), function (req, res) {
    let blogId = req.params.blogId,
        id = mongoose.Types.ObjectId(blogId);

    Blog.aggregate([
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
                            commentedBy: '$$element.commentedBy'
                        }
                    }
                },
                title: 1,
                message: 1,
                postedBy: 1,
                createdAt: 1,
                approved:1,
                'total comments': {$size: '$comments'},
            }
        },
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        Blog.populate(data, {
                'path': 'postedBy comments.commentedBy',
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

/*** END POINT FOR APPROVING OR DEACTIVATING A BLOG POST BY LOGGED IN ADMIN USERS*/
router.post('/change_blog_status/:blogId', allow('blog'), function (req, res) {

    let id = req.params.blogId,
        status = req.body.status;

    let valid = validator.isAllowed(res, status);
    if (!valid) return;

    Blog.findByIdAndUpdate(id,
        {$set: {status: status}},
        {new: true},
        function (err, blog) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            let data = {
                postedBy: blog.postedBy,
                uploadUrl: blog.uploadUrl,
                title: blog.title,
                approved: blog.approved
            };
            res.success(data);
        }
    )
});

/*** END POINT FOR DELETING A BLOG BY A CURRENTLY LOGGED IN USER */
router.delete('/:blogId', allow('blog'), function (req, res) {

    let id = req.params.blogId;
    Blog.remove({_id: id}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }
        if (!result) {
            return res.badRequest("you re not authorized to perform this action")
        }

        res.success('Blog post successfully deleted')
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


            // if (user) {
            //     let that = user.admin_function;
            //     console.log(that)
            //
            //     for (let i = 0; i < that.length; i++) {
            //         console.log(that[i].indexOf(admin_function.split(',')))
            //
            //         if (that[i].indexOf(admin_function.split(',')) >= 0) {
            //             console.log(user)
            //
            //             req.user = user;
            //             return next();
            //         }
            //     }
            // }
            return res.unauthorized('you are not authorized to perform this action')
        })

    }
}

module.exports = router;