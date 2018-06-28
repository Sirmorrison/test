let express = require('express');
let router = express.Router();
let fs = require('fs');

const config = require('../../config');
let FirebaseAuth = require('firebaseauth');
let firebase = new FirebaseAuth(config.FIREBASE_API_KEY);

const cloudinary = require('cloudinary');
cloudinary.config(config.cloudinary);

const protector = require('../../middlewares/protector');
const validator = require('../../utils/validator');

let Admin = require('../../models/admin_user');
let Category = require('../../models/admin_category');


/*** END POINT FOR GETTING PERSONAL PROFILE BY CURRENTLY LOGGED IN ADMIN USER */
router.get('/profile', function(req, res) {

    let id = req.user.id;
    Admin.aggregate([
        {$match: {'_id': id}},
        {$project: {email:1, admin_position:1, phone_number:1, photoUrl:1, profession:1, name:1, createdAt: 1, address:1, updatedAt:1,
            organization:1, from:1, to:1, roles_description:1, category:1}},
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        res.success(data);
    });
});

/*** END POINT FOR GETTING PERSONAL PROFILE BY CURRENTLY LOGGED IN ADMIN USER */
router.get('/profile/:userId', function(req, res) {

    let id = req.params.userId;
    Admin.aggregate([
        {$match: {'_id': id}},
        {$project: {email:1, admin_position:1, phone_number:1, photoUrl:1, profession:1, name:1, createdAt: 1, address:1
            , updatedAt:1, organization:1, from:1, to:1, roles_description:1, category:1}},
    ], function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        res.success(data);
    });
});

/*** END POINT FOR CREATING AND ADMIN USER BY SUPER ADMIN */
router.post('/create', function(req, res){

    let userId = req.user.id;
    userVerify(userId, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest(err);
        }
        let email = req.body.email,
            password = req.body.password,
            name = req.body.name,
            cateId = req.body.category,
            phone_number = req.body.phone_number,
            organization = req.body.organization,
            category = req.body.category,
            from = req.body.from,
            to = req.body.to,
            roles_description = req.body.roles_description;

        //chain validation checks, first one to fail will cause the code to break instantly
        let validated = validator.isValidEmail(res, email) &&
            validator.isValidPassword(res, password) &&
            validator.isValidPhoneNumber(res, phone_number) &&
            validator.isWord(res, cateId) &&
            validator.isFullname(res, name);

        if (!validated)
            return;

        let extras = {
            name: name,
            requestVerification: true
        };

        cateVerify(cateId, function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest(err);
            }

            firebase.registerWithEmail(email, password, extras, function (err, firebaseResponse) {
                if (err) {
                    //firebase errors come as object {code, message}, return only message
                    return res.badRequest(err.message);
                }

                let info = {
                    _id: firebaseResponse.user.id,
                    name: firebaseResponse.user.displayName,
                    email: firebaseResponse.user.email,
                    phone_number: phone_number,
                    admin_category: admin_category
                };

                if (organization) {
                    let valid = validator.isWord(res, organization);
                    if (!valid) return;
                    info.organization = organization;
                }
                if (category) {
                    let valid = validator.isWord(res, category);
                    if (!valid) return;
                    info.category = category;
                }
                if (from) {
                    let valid = validator.isWord(res, from);
                    if (!valid) return;
                    info.from = from;
                }
                if (to) {
                    let valid = validator.isWord(res, to);
                    if (!valid) return;
                    info.to = to;
                }
                if (roles_description) {
                    let valid = validator.isSentence(res, roles_description);
                    if (!valid) return;
                    info.roles_description = roles_description;
                }

                Admin.create(info, function (err, user) {
                    if (err) {
                        console.log(err);

                        return res.badRequest("Something unexpected happened");
                    }

                    res.success('Admin user successfully registered. login with email: ', email, 'password: ', password);
                });
            });
        })
    })
});

/*** END POINT FOR UPDATING USER CATEGORIES OF CURRENTLY SIGNED UP USER */
router.post('/update', function(req, res){

    let name = req.body.name,
        address = req.body.address,
        phone_number = req.body.phone_number;

    if (!(name || address || phone_number)){
        return res.badRequest('Please input the value to the field you would love to update');
    }

    let profile = {};

    if (name){
        let fullName = validator.isFullname(res, name);
        if(!fullName)
            return;
        profile.name = name;
    }
    if (phone_number){
        let valid = validator.isValidPhoneNumber(res, phone_number);
        if(!valid) return;

        Admin.findOne({phone_number: phone_number}, function (err, user) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            if (user && user._id !== req.user.id) {
                return res.badRequest('A user already Exist with Phone Number: ' + phone_number);
            }
            if (user && user._id === req.user.id) {
                return res.badRequest('Phone number already used by You. select a new Phone number you will love to change to');
            }

            profile.phone_number = phone_number;
        })
    }
    if (address){
        let address1 = validator.isSentence(res, address);
        if(!address1)
            return;
        profile.address = address;
    }

    Admin.findByIdAndUpdate(req.user.id,
        {$set: profile},
        {new: true},
        function(err, user) {
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
                organization: user.organization,
                from: user.from,
                to: user.to,
                admin_position: user.admin_position,
                category: user.category,
                roles_description: user.roles_description
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
        console.log('first '+ user.public_id);
        if (user.public_id === null || user.public_id === 0 || user.public_id === undefined) {
            console.log('im starting it fail here');

            cloudUpload(path, function (err, result) {
                if (err) {
                    console.log('it fail here' +err);
                    res.badRequest(err.message);
                }
                console.log(result);
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
                    fs.unlink(file.path, function (err , g) {
                        if (err) {
                            console.log(err);
                            return res.badRequest(err);
                        }
                    });
                    res.success(user);
                })
            })
        } else {
            console.log('im here and this is the iss');
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
                                fs.unlink(file.path, function (err , g) {
                                    if (err) {
                                        console.log(err);
                                        return res.badRequest(err);
                                    }
                                    console.log(g);
                                });

                                res.success(user);
                            })
                        }
                    })
                }
            })
        }
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

function userVerify(userId, callback) {
    Admin.findById(userId, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            return callback("no user found with this id");
        }
        if (user.admin_category !== 'adminSuper') {
            return callback("You are not Authorized Perform this Action");
        }

        return callback(null, user)
    })
}

function cateVerify(cateId, callback) {
    Category.findOne({_id: cateId}, function (err, category) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!category) {
            return callback("no category found with the id provided");
        }

        return callback(null, category)
    })
}

function cloudUpload(path, callback) {

    cloudinary.v2.uploader.upload(path, function (err, result){
        if (err) {
            console.log('it failed here' + err);
            return callback(err.message);
        } else {
            console.log(result);
            return callback(null, result);
        }
    })
}

module.exports = router;