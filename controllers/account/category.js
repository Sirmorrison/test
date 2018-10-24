const express = require('express');
const router = express.Router();
let fs = require('fs');

const arrayUtils = require('../../utils/array');

const config = require('../../config'),
    FirebaseAuth = require('firebaseauth'),
    firebase = new FirebaseAuth(config.FIREBASE_API_KEY);

const cloudinary = require('cloudinary');
cloudinary.config(config.cloudinary);

let validator = require('../../utils/validator'),
    User = require('../../models/user'),
    Category = require('../../models/categories');


/*** END POINT FOR GETTING A LIST PROFILE CATEGORIES BY NEW USER */
router.get('/', function (req, res) {

    Category.find({}, {title:1, summary:1, description:1},function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        res.success(result);
    })
});

/*** END POINT FOR SEARCHING FOR A CATEGORY BY FULL TEXT*/
router.get('/search', function (req, res) {

    let search = req.query.search;
    let v = validator.isWord(res, search);
    if (!v) return;

    Category.aggregate(
        [
            {$match: {$text: {$search: search}}},
            {$project: {title:1, summary:1, description:1, score: {$meta: "textScore"}}},
            {$limit: 5}
        ], function (err, data) {
            console.log(data)

            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }

            res.success(data);
        });
});

/*** END POINT FOR UPDATING USER PROFILE OF CURRENTLY SIGNED UP USER */
router.post('/update', function(req, res) {

    let category = req.body.category;
    console.log(category)
    if (!category) {
        return res.badRequest('Please choose from the category list provided to continue');
    }


    let validated = validator.isCategory(res, category);
    if (!validated) return;
    console.log(validated)

    //remove duplicates before proceeding
    arrayUtils.removeDuplicates(category);

    let categoryTags = [];
    for (let i = 0; i < category.length; i++) {
        let cateId = category[i];

        if (typeof(cateId) !== "string") {
            return res.badRequest("category IDs in tagged array must be string");
        }

        categoryTags.push({categoryId: cateId});
    }

    User.findByIdAndUpdate(req.user.id, {$set: {categoryTags: categoryTags}}, {new: true}, function (err, user) {
        if (err) {
            console.log(err);
            return res.serverError("Something unexpected happened");
        }
        if (!user) {
            return res.badRequest("User profile not found please be sure you are still logged in");
        }

        User.populate(user, {
                'path': 'followers.userId following.userId categoryTags.categoryId',
                'select': 'name photoUrl bio title'
            }, function (err, user) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                let info = {
                    profession: user.profession,
                    photo: user.photoUrl,
                    name: user.name,
                    email: user.email,
                    phone_number: user.phone_number,
                    address: user.address,
                    bio: user.bio,
                    followers: user.followers,
                    following: user.following,
                    category: user.categoryTags
                };


                res.success('Updated successfully');
            }
        );
    })
});


function profile(id, callback){
    User.findById(id)
        .populate({
            path: 'followers.userId',
            select: 'name photo email bio'
        })
        .populate({
            path: 'following.userId',
            select: 'name photo email bio'
        })
        .sort({date: -1})
        .exec(function (err, user) {

                if (err) {
                    return callback("Something unexpected happened");
                }
                if (!user) {
                    return callback("could not find user with id: " + id);
                }
                let info = {
                    followers: user.followers,
                    following: user.following
                };

                return callback(null, info);
            }
        );
}

module.exports = router;