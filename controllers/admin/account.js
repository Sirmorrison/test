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
let arrayUtils = require('../../utils/array');
let Admin = require('../../models/admin_user');


/*** END POINT FOR GETTING PERSONAL PROFILE BY CURRENTLY LOGGED IN ADMIN USER */
router.get('/profile', function(req, res) {

    let id = req.user.id;
    Admin.findOne({_id: id},{public_id:0, updatedAt:0, __v:0}, function (err, user) {
       if (err){
           console.log(err)
           return res.badRequest("something unexpected happened")
       }
       if (!user){
           res.badRequest('no user found the user id provided')
       }

       res.success(user)
    })
});

/*** END POINT FOR GETTING PERSONAL PROFILE OF ANOTHER ADMIN BY CURRENTLY LOGGED IN ADMIN USER */
router.get('/profile/:userId', allow('account'), function(req, res) {

    let id = req.params.userId;
    Admin.findOne({_id: id},{public_id:0, updatedAt:0, createdBy:0, __v:0 }, function (err, user) {
        if (err){
            console.log(err);
            return res.badRequest("something unexpected happened")
        }
        if (!user){
            res.badRequest('no user found the user id provided')
        }

        res.success(user)
    })
});

/*** END POINT FOR REGISTERING AN ADMIN USER BY ANOTHER ADMIN */
router.post('/register', function(req, res){

    let email = req.body.email,
        password = req.body.password,
        name = req.body.name,
        passcode = req.user.passcode,
        userId = req.user.id,
        phone_number = req.body.phone_number,
        role = req.body.role,
        admin_function = req.body.admin_function;

    //chain validation checks, first one to fail will cause the code to break instantly
    let validated = validator.isValidEmail(res, email) &&
        validator.isValidPassword(res, password) &&
        validator.isValidPassword(res, passcode) &&
        validator.isValidPhoneNumber(res, phone_number) &&
        validator.isWord(res, role) &&
        validator.isFullname(res, name);
    if (!validated) return;

    arrayUtils.removeDuplicates(admin_function);
    console.log(validated);

    let allowedAdmin_function = ['users', 'queries', 'blog', 'stories', 'pricing', 'question',
        'wallet','messages', 'categories', 'admin', 'account', 'all'];

    let funct = [];
    for (let i = 0; i < admin_function.length; i++) {
        let cateId = admin_function[i];

        if (cateId && allowedAdmin_function.indexOf(cateId.toLowerCase()) < 0){
            return res.badRequest("error: one or more admin functions do not apply please verify and try again");
        }

        funct.push(cateId);
    }
    console.log(funct);

    let extras = {
        name: name,
        requestVerification: true
    };

    toFirebase(email, password, extras, function (err, firebaseResponse) {
        if (err) {
            return res.badRequest(err)
        }

        let info = {
            _id: firebaseResponse.user.id,
            name: firebaseResponse.user.displayName,
            email: firebaseResponse.user.email,
            phone_number: phone_number,
            role: role,
            passcode: passcode,
            admin_function: funct,
            createdBy: userId
        };

        createReport(info, function (err, data) {
            if (err) {
                console.log(err);
                return res.badRequest(err.message);
            }

            console.log(data);
            return res.success('Admin user successfully registered. login with email: ' + info.email +
                '  password: ' + req.body.password + " and experience was not included");
        });
    })
});

/*** END POINT FOR REGISTERING AN ADMIN USER BY ANOTHER ADMIN */
router.post('/create', allow('all'),  function(req, res){

    let email = req.body.email,
        password = req.body.password,
        name = req.body.name,
        userId = req.user.id,
        phone_number = req.body.phone_number,
        role = req.body.role,
        admin_function = req.body.admin_function,
        organization = req.body.organization,
        category = req.body.category,
        from = req.body.from,
        to = req.body.to,
        role_description = req.body.role_description;

    //chain validation checks, first one to fail will cause the code to break instantly
    let validated = validator.isValidEmail(res, email) &&
        validator.isValidPassword(res, password) &&
        validator.isValidPhoneNumber(res, phone_number) &&
        validator.isWord(res, role) &&
        validator.isFullname(res, name);
    if (!validated) return;

    arrayUtils.removeDuplicates(admin_function);
    let allowedAdmin_function = ['users', 'queries', 'blog', 'stories', 'pricing', 'question',
                                    'wallet','messages', 'categories', 'admin', 'account'];

    let funct = [];
    for (let i = 0; i < admin_function.length; i++) {
        let cateId = admin_function[i];

        if (cateId && allowedAdmin_function.indexOf(cateId.toLowerCase()) < 0){
            return res.badRequest("error: one or more admin functions do not apply please verify and try again");
        }

         funct.push(cateId);
    }
    console.log(funct);

    let extras = {
        name: name,
        requestVerification: true
    };

    if (organization || category || from || to || role_description) {
        let validated = validator.isSentence(res, category) &&
            validator.isSentence(res, role_description) &&
            validator.isWord(res, from) &&
            validator.isWord(res, to) &&
            validator.isWord(res, organization);
        if (!validated) return;

        toFirebase(email, password, extras, function (err, firebaseResponse) {
            if (err){
                return res.badRequest(err)
            }

            let info = {
                _id: firebaseResponse.user.id,
                name: firebaseResponse.user.displayName,
                email: firebaseResponse.user.email,
                phone_number: phone_number,
                role: role,
                admin_function: funct,
                createdBy: userId,
                'experience.category' : category,
                'experience.role_description': role_description,
                'experience.from': from,
                'experience.to': to,
                'experience.organization': organization
            };

            createReport(info, function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err.message);
                }

                console.log(data);
                return res.success('Admin user successfully registered. login with email: ' + info.email + ' password: ' + req.body.password + " and experience was included");
            });
        })
    }else{
        toFirebase(email, password, extras, function (err, firebaseResponse) {
            if (err) {
                return res.badRequest(err)
            }

            let info = {
                _id: firebaseResponse.user.id,
                name: firebaseResponse.user.displayName,
                email: firebaseResponse.user.email,
                phone_number: phone_number,
                role: role,
                admin_function: funct,
                createdBy: userId
            };

            createReport(info, function (err, data) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err.message);
                }

                console.log(data);
                return res.success('Admin user successfully registered. login with email: ' + info.email +
                    '  password: ' + req.body.password + " and experience was not included");
            });
        })
    }
});

/*** END POINT FOR UPDATING PERSONAL PROFILE BY CURRENTLY LOGGED IN ADMIN USER */
router.put('/update_profile', function(req, res) {

    let name = req.body.name,
        passcode = req.body.passcode,
        id = req.user.id,
        phone_number = req.body.phone_number;

    if (!(name || passcode || phone_number)) {
        return res.badRequest('Please input the value to the field you would love to update');
    }

    let profile = {};

    if (name) {
        let fullName = validator.isFullname(res, name);
        if (!fullName) return;
        profile.name = name;
    }
    if (phone_number) {
        let valid = validator.isValidPhoneNumber(res, phone_number);
        if (!valid) return;
        profile.phone_number = phone_number;
    }
    if (passcode) {
        let valid = validator.isValidPassword(res, passcode);
        if (!valid) return;
        profile.passcode = passcode;
    }

    Admin.findByIdAndUpdate(id,
        {$set: profile},
        {new: true},
        function (err, user) {
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
                experience: user.experience,
                admin_position: user.admin_position,
            };

            if (name) {
                let token = req.body.token || req.query.token || req.headers['x-access-token'];
                firebase.updateProfile(token, name, function (err) {
                    if (err) {
                        console.log(err);
                    }

                    res.success(info);
                });
            }
            else {
                res.success(info);
            }
        });
});

/*** END POINT FOR UPDATING PROFILE PICTURE OF CURRENTLY LOGGED IN ADMIN USER */
router.put('/profile_photo', function(req, res) {
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

    Admin.findOne({_id: id}, function (err, user) {
        if (err) {
            return res.badRequest(err);
        }
        if (!user) {
            return res.badRequest('no user found with your login details provided');
        }
        console.log('first '+ user.public_id);
        if (user.public_id === null || user.public_id === 0 || user.public_id === undefined) {

            cloudUpload(path, function (err, result) {
                if (err) {
                    console.log('error here' +err);
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
                    console.log('saving user');
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

/*** END POINT FOR FOR REQUESTING PASSWORD CHANGE BY LOGGED IN ADMIN USER */
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

function createReport(data, callback) {
    Admin.create(data, function (err, story) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        return callback(null, story)
    })
}

function toFirebase(email, password, extras, callback) {
    firebase.registerWithEmail(email, password, extras, function (err, firebaseResponse) {
        if (err) {
            console.log(err);
            //firebase errors come as object {code, message}, return only message
            return callback(err.message);
        }

        return callback(null, firebaseResponse)
    })
}

function allow(admin_function) {
    return function (req, res, next) {
        let userId = req.user.id,
            passcode = req.body.passcode;
        if(!passcode){
            return res.badRequest('please enter your passcode')
        }
        Admin.findById(userId, function (err, user) {
            if(err){
                console.log(err);
                return res.badRequest('something happened')
            }
            if(!user){
                return res.badRequest('no user found with your login details')
            }
            if(user && user.passcode !== passcode){
                return res.badRequest('passcode error please check and try again')
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

module.exports = router;