let express = require('express');
let router = express.Router();

let User = require('../../models/user');
let Category = require('../../models/categories');
const validator = require('../../utils/validator');

/*** END POINT FOR GETTING BUSINESS CATEGORIES BY USER */
router.get('/', function (req, res) {

    Category.find({}, {title:1},function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        res.success(result);
    })
});

/*** END POINT FOR CREATING BUSINESS CATEGORIES BY ADMIN USER */
router.post('/', function (req, res) {
    let userId = req.user.id,
        title = req.body.title.toLowerCase();

    let validated = validator.isWord(res, title);
        if(!validated) return;

    let data = {
        title : title,
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
router.post('/biz/:catId', function (req, res) {
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
router.post('/biz/:catId', function (req, res) {
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

function userVerify(userId, callback) {
    User.findById(userId, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("no user found with this id");
        }
        if (user.admin !== true) {
            return callback("You are not Authorized Perform this Action");
        }

        return callback(null, user)
    })
}

module.exports = router;