let express = require('express');
let router = express.Router();

let User = require('../../models/admin_user');
let Category = require('../../models/categories');
let Admin = require('../../models/admin_category');
const validator = require('../../utils/validator');

//USER CATEGORY
/*** END POINT FOR GETTING PERSONAL PROFILE BY CURRENTLY LOGGED IN USER */
router.get('/user/category', function(req, res) {

    Category.aggregate([
        {
            $lookup: {
                from: "stories",
                localField: "_id",
                foreignField:"category.categoryId",
                as: "Posts"
            }
        },
        {
            $lookup: {
                from: "questions",
                localField: "id",
                foreignField: "category.categoryId",
                as: "questions"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "id",
                foreignField: "category.categoryId",
                as: "users"
            }
        },
        {$project: {Posts:{$size :"$Posts"}, questions:{$size :"$questions"},users:{$size :"$users"}, title:1}},
        {$unwind: {path: "$user", preserveNullAndEmptyArrays: true}},
        {$unwind: {path: "$post", preserveNullAndEmptyArrays: true}},
        {$unwind: {path: "$comment", preserveNullAndEmptyArrays: true}}
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        res.success(data);
    });
});

/*** END POINT FOR CREATING BUSINESS CATEGORIES BY ADMIN USER */
router.post('/user/category', function (req, res) {
    let userId = req.user.id,
        summary = req.body.summary,
        description = req.body.description,
        title = req.body.title.toLowerCase();

    let validated = validator.isWord(res, title)&&
                    validator.isSentence(res, summary)&&
                    validator.isSentence(res, description);
    if(!validated) return;

    let data = {
        title : title,
        summary: summary,
        description: description,
        postedBy: userId
    };

    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }

        Category.findOne({title : title},function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            if (result) {
                return res.badRequest("A category already exist with this category Name: " + title);
            } else {
                Category.create(data, function (err, cate) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }

                    let info = {
                        categoryId: cate._id,
                        Category: cate.title,
                        success: true
                    };
                    res.success(info);
                })
            }
        });
    })
});

/*** END POINT FOR EDITING BUSINESS CATEGORIES BY ADMIN USER */
router.put('/user/category/:catId', function (req, res) {
    let userId = req.user.id,
        title = req.body.title,
        catId = req.params.catId;

    let validated = validator.isWord(res, title);
    if(!validated) return;

    let data = {
        title : title,
        postedBy: userId
    };

    userVerify(userId, function (err, user) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Category.findOneAndUpdate(
            {postedBy: req.user.id, _id: catId},
            {$set: data},
            {new: true}, function (err, cat) {
                if (err) {
                    console.log(err);
                    return res.serverError("Something unexpected happened");
                }
                if (cat === null) {
                    console.log(err);
                    return res.notAllowed("you are not allowed to make modifications to this profile");
                }
                let info = {
                    categoryId: cat._id,
                    Category: cat.title,
                    success: true
                };

            res.success(info);
        })
    })
});

/*** END POINT FOR EDITING BUSINESS CATEGORIES BY ADMIN USER */
router.delete('/user/category/:catId', function (req, res) {
    let userId = req.user.id,
        catId = req.params.catId;

    userVerify(userId, function (err, user) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Category.remove({_id: catId}, function (err, cat) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            if (!cat) {
                return res.badRequest("no category found");
            }

            console.log(cat);
            res.success(cat);
        })
    })
});

//ADMIN CATEGORY
/*** END POINT FOR GETTING PERSONAL PROFILE BY CURRENTLY LOGGED IN USER */
router.get('/admin/category', function(req, res) {

    Admin.find({},{title: 1, _id: 1}, function (err, cate) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!cate){
            return res.success({});
        }

        res.success(cate);
    })
});

/*** END POINT FOR CREATING BUSINESS CATEGORIES BY ADMIN USER */
router.post('/admin/category', function (req, res) {
    let userId = req.user.id,
        description = req.body.description,
        title = req.body.title.toLowerCase();

    let validated = validator.isWord(res, title)&&
        validator.isSentence(res, description);
    if(!validated) return;

    let data = {
        title : title,
        description: description,
        postedBy: userId
    };

    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }

        Category.findOne({title : title},function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            if (result) {
                return res.badRequest("A category already exist with this category Name: " + title);
            } else {
                Category.create(data, function (err, cate) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }

                    let info = {
                        categoryId: cate._id,
                        Category: cate.title,
                        success: true
                    };
                    res.success(info);
                })
            }
        });
    })
});

/*** END POINT FOR EDITING BUSINESS CATEGORIES BY ADMIN USER */
router.put('/admin/category/:catId', function (req, res) {
    let userId = req.user.id,
        title = req.body.title,
        description = req.body.description,
        catId = req.params.catId;

    if (!(title || description )){
        return res.badRequest('Please input the value to the field you would love to update');
    }

    let data = {
        postedBy: userId
    };

    if(title){
        let validated = validator.isWord(res, title);
        if(!validated) return;
        data.title = title;
    }
    if(description){
        let validated = validator.isWord(res, description);
        if(!validated) return;
        data.description = description;
    }
    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Admin.findOneAndUpdate(
            {postedBy: req.user.id, _id: catId},
            {$set: data},
            {new: true}, function (err, cat) {
                if (err) {
                    console.log(err);
                    return res.serverError("Something unexpected happened");
                }
                if (cat === null) {
                    console.log(err);
                    return res.notAllowed("you are not allowed to make modifications to this profile");
                }
                let info = {
                    categoryId: cat._id,
                    Category: cat.title,
                    success: true
                };

                res.success(info);
            })
    })
});

/*** END POINT FOR EDITING BUSINESS CATEGORIES BY ADMIN USER */
router.delete('/admin/category/:catId', function (req, res) {
    let userId = req.user.id,
        catId = req.params.catId;

    userVerify(userId, function (err, user) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        Admin.remove({_id: catId}, function (err, cat) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            if (!cat) {
                return res.badRequest("no category found");
            }

            res.success(cat);
        })
    })
});

function userVerify(userId, callback) {
    User.findById(userId, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("no user found with this id");
        }
        if (user.admin_category !== 'superAdmin') {
            return callback("You are not Authorized Perform this Action");
        }

        return callback(null, user)
    })
}

module.exports = router;