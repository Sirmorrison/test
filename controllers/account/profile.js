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
    User = require('../../models/user');

/*** END POINT FOR GETTING PERSONAL PROFILE BY CURRENTLY LOGGED IN USER */
router.get('/', function(req, res) {
    let id = req.user.id;

    User.aggregate([
        {$match: {'_id': id}},
        {$unwind: {path: "$rating", preserveNullAndEmptyArrays: true}},
        {$project: {totalFollowing:{$size :"$following"},totalFollowers:{$size :"$followers"},email:1,
            phone_number:1, rating:1, bio:1,photoUrl:1, profession:1, name:1, Rating:{$avg :"$rating.rating"}}},
        {
            $lookup: {
                from: "posts",
                localField: "id",
                foreignField:"postedBy.userId",
                as: "Posts",
            }
        },
        {
            $lookup: {
                from: "questions",
                localField: "id",
                foreignField: "postedBy.userId",
                as: "Questions"
            }
        },

        {$unwind: {path: "$post", preserveNullAndEmptyArrays: true}},
        {$unwind: {path: "$comment", preserveNullAndEmptyArrays: true}}
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        User.populate(data,{
                'path': 'followers.userId following.userId rating.ratedBy',
                'select': 'name photoUrl email bio'
            },

            function (err, user) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                if (!user) {
                    return res.badRequest("YOU NEED TO BE A REGISTERED USER TO VIEW GET ACCESS");
                }

                res.success(user);
            });
    });
});

/*** END POINT FOR GETTING PERSONAL PROFILE BY  OTHER CURRENTLY LOGGED IN USER */
router.get('/:userId', function(req, res) {
    let id = req.params.userId;

    User.aggregate([
        {$match: {'_id': id}},
        {$unwind: {path: "$rating", preserveNullAndEmptyArrays: true}},
        {$project: {totalFollowing:{$size :"$following"},totalFollowers:{$size :"$followers"},email:1,
            phone_number:1, rating:1, bio:1,photoUrl:1, profession:1, name:1, Rating:{$avg :"$rating.rating"}}},
        {
            $lookup: {
                from: "posts",
                localField: "id",
                foreignField:"postedBy.userId",
                as: "Question"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "id",
                foreignField: "commentedBy.userId",
                as: "Comment"
            }
        },

        {$unwind: {path: "$post", preserveNullAndEmptyArrays: true}},
        {$unwind: {path: "$comment", preserveNullAndEmptyArrays: true}}
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        User.populate(data,{
                'path': 'followers.userId following.userId rating.ratedBy',
                'select': 'name photoUrl email bio'
            },

            function (err, user) {

                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                if (!user) {
                    return res.badRequest("YOU NEED TO BE A REGISTERED USER TO VIEW GET ACCESS");
                }

                res.success(user);
            });
    });
});

/*** END POINT FOR GETTING FOLLOWERS OF A CURRENTLY LOGGED IN USER */
router.get('/user/follower', function(req, res){
    console.log(req)

    let id = req.user.id;
    console.log(id)

    profile(id, function (err, result) {

        if (err){
            return res.badRequest(err.message);
        }
        res.success({followers: result.followers});
    });
});

/*** END POINT FOR GETTING FOLLOWERS OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.get('/follower/:userId', function(req, res){
    let id = req.params.userId;

    profile(id, function (err, result) {

        if (err){
            return res.badRequest(err.message);
        }
        res.success({followers: result.followers});
    });
});

/*** END POINT FOR GETTING FOLLOWING OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.get('/following/:userId', function(req, res){
    let id = req.params.userId;

    profile(id, function (err, result) {
        if (err){
            return res.badRequest(err.message);
        }
        res.success(result.following);
    });
});

/*** END POINT FOR GETTING FOLLOWING OF A CURRENTLY LOGGED IN USER */
router.get('/user/following', function(req, res){
    let id = req.user.id;

    profile(id, function (err, result) {
        if (err){
            return res.badRequest(err.message);
        }
        res.success(result.following);
    });
});

/*** END POINT FOR UPDATING USER CATEGORIES OF CURRENTLY SIGNED UP USER */
router.post('/update', function(req, res){

    let name = req.body.name,
        address = req.body.address,
        bio = req.body.bio,
        profession = req.body.profession,
        category = req.body.category;

    if (!(name || address || bio || profession || category)){
        return res.badRequest('Please input the value to the field you would love to update');
    }

    let profile = {};

    if (bio){
        let vBio = validator.isSentence(res, bio);
        if(!vBio)
            return;
        profile.bio = bio;
    }
    if (name){
        let fullName = validator.isFullname(res, name);
        if(!fullName)
            return;
        profile.name = name;
    }
    if (address){
        let address1 = validator.isSentence(res, address);
        if(!address1)
            return;
        profile.address = address;
    }
    if (category && !Array.isArray(category)) {
        return res.badRequest('Tagged should be a json array of user Ids (string)')
    } else {
        //remove duplicates before proceeding
        arrayUtils.removeDuplicates(category);

        profile.categoryTags = []; //new empty array
        for (let i = 0; i < category.length; i++) {
            let categoryId = category[i];

            if (typeof(categoryId) !== "string") {
                return res.badRequest("User IDs in tagged array must be string");
            }

            profile.categoryTags.push({categoryId: categoryId});
        }
    }
    User.findByIdAndUpdate(req.user.id, {$set: profile}, {new: true})
        .populate({
            path: 'followers.userId',
            select:'name photo bio'
        })
        .populate({
            path: 'following.userId',
            select:'name photo bio'
        })
        .exec(function(err, user) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            if (!user) {
                return res.badRequest("User profile not found please be sure you are still logged in");
            }

            let info = {
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

            if (name){
                let token = req.body.token || req.query.token || req.headers['x-access-token'];
                firebase.updateProfile(token, name, function (err) {
                    if (err) {
                        console.log(err);
                    }

                    res.success(info);
                });
            }
            else{
                res.success(info);
            }
        }
    );
});

/*** END POINT FOR UPDATING PROFILE PICTURE OF CURRENTLY LOGGED IN USER */
router.post('/photo', function(req, res){

    let file = req.files.null;
    console.log(file.path);

    let validated = validator.isFile(res, file);
    if(!validated)
        return;

    if (file.type === 'image/jpeg') {
        cloudinary.v2.uploader.upload(file.path, function (err, result) {
            if (err) {
                return res.badRequest(err);
            } else {
                let photoUrl = result.secure_url;

                User.findByIdAndUpdate(req.user.id, {$set: {photoUrl: photoUrl}}, {new: true})
                    .populate({
                        path: 'followers.userId',
                        select: 'name photo email coverImageUrl'
                    })
                    .populate({
                        path: 'following.userId',
                        select: 'name photo email coverImageUrl'
                    })
                    .exec(function (err, user) {
                            if (err) {
                                console.log(err);
                                return res.serverError("Something unexpected happened");
                            }
                            if (!user) {
                                return res.badRequest("User profile not found please be sure you are still logged in");
                            }

                            let info = {
                                coverImageUrl: user.coverImageUrl,
                                photo: user.photoUrl,
                                name: user.name,
                                email: user.email,
                                username: user.username,
                                phone_number: user.phone_number,
                                address: user.address,
                                bio: user.bio,
                                status: user.status,
                                d_o_b: user.d_o_b,
                                followers: user.followers,
                                following: user.following
                            };
                            res.success(info);
                        }
                    )
            }
        });
    }else{
        return res.badRequest('file to be uploaded must be an image and must be jpg or jpeg format. upload has failed!')
    }
});

/*** END POINT FOR UPDATING PROFILE PICTURE OF CURRENTLY LOGGED IN USER */
router.put('/photo', function(req, res) {
    let file = req.files.null,
        path = file.path,
        id = req.user.id;

    console.log(file.path);

    let validated = validator.isFile(res, file);
    if(!validated)
        return;
    if (file.type !== 'image/jpeg') {
        return res.badRequest("file to be uploaded must be an image and a jpeg/jpg format");
    }

    User.findOne({_id: id}, function (err, user) {
        if (err) {
            return res.badRequest(err);
        }
        if (!user) {
            return res.badRequest('no user found with your id: ' + id);
        }
        if (user.public_id === null) {
            cloudUpload(path, function (err, result) {
                if (err) {
                    console.log(err);
                    res.badRequest(err.message);
                }
                let data = {
                    photoUrl: result.secure_url,
                    public_id: result.public_id
                };
                user.set(data);
                user.save(function (err, user) {
                    if (err) {
                        console.log(err);
                    }
                    console.log('saving user', user);
                    res.success(null, user);
                })
            })
        } else {
            let public_id = user.public_id;
            cloudinary.v2.uploader.destroy(public_id, {invalidate: true}, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err);
                } else {
                    console.log('deleted :', result);

                    cloudUpload(path, function (err, result) {
                        if (err) {
                            console.log(err);
                            return res.badRequest(err.message);
                        } else {
                            console.log('uploaded successfully :', result);
                            let data = {
                                photoUrl: result.secure_url,
                                public_id: result.public_id
                            };
                            user.set(data);
                            user.save(function (err, user) {
                                if (err) {
                                    console.log(err);
                                }
                                console.log('saving user', user);
                                res.success(null, user);
                            })
                        }
                    })
                }
            })
        }
        fs.unlink(file.path, function (err, info) {
            if (err) {
                console.error(err);
                return res.badRequest(err);
            }
            console.log(info)
        });
    })
});

/*** END POINT FOR UPDATING PROFILE PHONE NUMBER OF CURRENTLY LOGGED IN USER */
router.post('/phoneNumber', function(req, res){

    let phone_number = req.body.phone_number,
        validatedPhoneNumber = validator.isValidPhoneNumber(res, phone_number);

    if (!validatedPhoneNumber)
        return;

    User.findOne({phone_number: phone_number}, function (err, user) {
        if (err) {
            console.log(err);
            return res.serverError("Something unexpected happened");
        }
        if (user && user._id !== req.user.id){
            return res.badRequest('A user already Exist with Phone Number: '+ phone_number);
        }
        if (user && user._id === req.user.id){
            return res.badRequest('Phone number already used by You. select a new Phone number you will love to change to');
        }

        User.findByIdAndUpdate(req.user.id, {$set: {phone_number: phone_number}}, {new: true})
            .populate({
                path: 'followers.userId',
                select:'name photo email coverImageUrl'
            })
            .populate({
                path: 'following.userId',
                select:'name photo email coverImageUrl'
            })
            .exec(function(err, user) {
                if (err) {
                    console.log(err);
                    return res.serverError("Something unexpected happened");
                }
                if (!user) {
                    return res.badRequest("User profile not found please be sure you are still logged in");
                }

                let info = {
                    coverImageUrl: user.coverImageUrl,
                    photo: user.photoUrl,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    phone_number: user.phone_number,
                    address: user.address,
                    bio: user.bio,
                    status: user.status,
                    d_o_b: user.d_o_b,
                    followers: user.followers,
                    following: user.following
                };
                res.success(info);
            }
        )
    })
});

/*** END POINT FOR FOR REQUESTING PASSWORD CHANGE BY LOGGED IN USER */
router.post('/edit_password', function(req, res){

    let password = req.body.password;

    let validatedPassword = validator.isValidPassword(res, password);

    if (!validatedPassword)
        return;

    let token = req.body.token || req.query.token || req.headers['x-access-token'];
    firebase.changePassword(token, password, function(err, authData){
        if (err){
            return res.serverError(err.message);
        }

        let info = {
            token: authData.token,
            refreshToken: authData.refreshToken
        };

        res.success(info);
    });
});

function profile(id, callback){
    User.findById(id)
        .populate({
            path: 'followers.userId',
            select: 'name photo email coverImageUrl'
        })
        .populate({
            path: 'following.userId',
            select: 'name photo email coverImageUrl'
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

function cloudUpload(path, callback) {

    cloudinary.v2.uploader.upload(path, (err, result) => {
        if (err) {
            console.log(err);
            return callback(err.message);
        } else {
            console.log(result);
            return callback(null, result);
        }
    })
}

module.exports = router;