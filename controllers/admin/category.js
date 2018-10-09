let express = require('express');
let router = express.Router();

let Admin = require('../../models/admin_user');
let Category = require('../../models/categories');
const validator = require('../../utils/validator');

//USER CATEGORY
/*** END POINT FOR GETTING USER CATEGORIES AND NUMBER OF POST, USERS, AND QUESTION IN CATEGORIES BY CURRENTLY LOGGED IN ADMIN USER */
router.get('/overview', allow('categories'), function(req, res) {

    Category.aggregate([
        {
            $lookup: {
                from: "stories",
                localField: "_id",
                foreignField:"category.categoryId",
                as: "stories"
            }
        },
        {
            $lookup: {
                from: "questions",
                localField: "_id",
                foreignField: "category.categoryId",
                as: "questions"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "categoryTags.categoryId",
                as: "users"
            }
        },
        {$project: {stories:{$size :"$stories"}, questions:{$size :"$questions"},users:{$size :"$users"}, title:1}},
        {$sort: {title: 1}}
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        res.success(data);
    });
});

/*** END POINT FOR CREATING USER CATEGORIES BY ADMIN USER */
router.post('/category', allow('categories'), function (req, res) {

    let userId = req.user.id,
        summary = req.body.summary,
        description = req.body.description,
        title = req.body.title.toLowerCase();

    let validated = validator.isWord(res, title) &&
        validator.isSentence(res, summary) &&
        validator.isSentence(res, description);
    if (!validated) return;

    let data = {
        title: title,
        summary: summary,
        description: description,
        postedBy: userId
    };

    Category.findOne({title: title}, function (err, result) {
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
});

/*** END POINT FOR EDITING CATEGORIES BY ADMIN USER */
router.put('/:catId', allow('categories'), function (req, res) {

    let summary = req.body.summary,
        description = req.body.description,
        title = req.body.title.toLowerCase(),
        catId = req.params.catId;

    let data = {};

    if (title) {
        let validated = validator.isWord(res, title);
        if (!validated) return;
        data.title = title;
    }
    if (summary) {
        let validated = validator.isWord(res, summary);
        if (!validated) return;
        data.summary = summary;
    }
    if (description) {
        let validated = validator.isWord(res, description);
        if (!validated) return;
        data.description = description;
    }

    Category.findOneAndUpdate(
        {_id: catId},
        {$set: data},
        {new: true}, function (err, cat) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            let info = {
                categoryId: cat._id,
                Category: cat.title,
                success: true
            };

            res.success(info);
        })
});

/*** END POINT FOR DELETING A USER CATEGORY BY ADMIN USER */
router.delete('/:catId', allow('categories'), function (req, res) {
    let catId = req.params.catId;

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
});

// //ADMIN ROLES CATEGORY
// /*** END POINT FOR GETTING ADMIN POSITION OVERVIEW AND NUMBER OF POST, USERS, AND QUESTION IN CATEGORIES BY CURRENTLY LOGGED IN USER */
// router.get('/admin_user/overview', allow('categories'), function(req, res) {
//
//     Admin_positions.aggregate([
//         {
//             $lookup: {
//                 from: "admin_users",
//                 localField: "admin_position",
//                 foreignField:"admin_position",
//                 as: "users"
//             }
//         },
//         {$project: {users:{$size :"$users"}, admin_position:1}},
//         {$sort: {admin_position: 1}}
//     ], function (err, data) {
//         if (err) {
//             console.log(err);
//             return res.badRequest("Something unexpected happened");
//         }
//         res.success(data);
//     });
// });
//
// /*** END POINT FOR CREATING ADMIN POSITION BY ADMIN USER */
// router.post('/admin_user/category', allow('categories'), function (req, res) {
//
//     let userId = req.user.id,
//         role_description = req.body.role_description,
//         admin_position = req.body.admin_position.toLowerCase();
//
//     userVerify(userId, function (err) {
//         if (err) {
//             console.log(err);
//             return res.badRequest(err);
//         }
//         let validated = validator.isWord(res, admin_position) &&
//             validator.isSentence(res, role_description);
//         if (!validated) return;
//
//         let data = {
//             admin_position: admin_position,
//             role_description: role_description,
//             postedBy: userId
//         };
//
//         Admin_positions.findOne({admin_position: admin_position}, function (err, result) {
//             if (err) {
//                 console.log(err);
//                 return res.badRequest("Something unexpected happened");
//             }
//             if (result) {
//                 return res.badRequest("A position already exist with this category Name: " + title);
//             } else {
//                 Admin_positions.create(data, function (err, cate) {
//                     if (err) {
//                         console.log(err);
//                         return res.badRequest("Something unexpected happened");
//                     }
//
//                     let info = {
//                         positionId: cate._id,
//                         admin_position: cate.admin_position,
//                         success: true
//                     };
//
//                     res.success(info);
//                 })
//             }
//         });
//     })
// });
//
// /*** END POINT FOR EDITING ADMIN POSITION BY ADMIN USER */
// router.put('/admin_user/:positionId', allow('categories'), function (req, res) {
//     let userId = req.user.id,
//         admin_position = req.body.admin_position,
//         role_description = req.body.role_description,
//         positionId = req.params.positionId;
//
//     userVerify(userId, function (err) {
//         if (err) {
//             console.log(err);
//             return res.badRequest(err);
//         }
//         if (!(admin_position || role_description )){
//             return res.badRequest('Please input the value to the field you would love to update');
//         }
//
//         let data = {
//             postedBy: userId
//         };
//
//         if(admin_position){
//             let validated = validator.isWord(res, admin_position);
//             if(!validated) return;
//             data.admin_position = admin_position;
//         }
//         if(role_description){
//             let validated = validator.isWord(res, role_description);
//             if(!validated) return;
//             data.role_description = role_description;
//         }
//
//         Admin_positions.findOneAndUpdate(
//             {postedBy: userId, _id: positionId},
//             {$set: data},
//             {new: true}, function (err, cat) {
//                 if (err) {
//                     console.log(err);
//                     return res.serverError("Something unexpected happened");
//                 }
//                 if (cat === null) {
//                     console.log(err);
//                     return res.notAllowed("you are not allowed to make modifications to this profile");
//                 }
//                 let info = {
//                     positionId: cat._id,
//                     admin_position: cat.admin_position,
//                     role_description: cat.role_description,
//                     success: true
//                 };
//
//                 res.success(info);
//             })
//     })
// });
//
// /*** END POINT FOR DELETING ADMIN POSITION BY ADMIN USER */
// router.delete('/admin_user/:catId', allow('categories'), function (req, res) {
//     let userId = req.user.id,
//         catId = req.params.catId;
//
//     userVerify(userId, function (err, user) {
//         if (err) {
//             console.log(err);
//             return res.badRequest(err);
//         }
//         Admin_positions.remove({_id: catId}, function (err, cat) {
//             if (err) {
//                 console.log(err);
//                 return res.serverError("Something unexpected happened");
//             }
//             if (!cat) {
//                 return res.badRequest("no category found");
//             }
//
//             res.success("position delketed successfully");
//         })
//     })
// });

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