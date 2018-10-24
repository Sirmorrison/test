const express = require('express');
let router = express.Router();

const config = require('../../config');
const FirebaseAuth = require('firebaseauth');
const firebase = new FirebaseAuth(config.FIREBASE_API_KEY);

const validate = require('../../utils/validator');
const User = require('../../models/user');

/*** END POINT FOR LOGIN WITH EMAIL */
router.post('/', function(req, res) {

    let email = req.body.email;
    let password = req.body.password;

    let validated = validate.isValidPassword(res, password) &&
        validate.isValidEmail(res, email);

    if (!validated)
        return;

    firebase.signInWithEmail(email, password, function (err, resp) {
        if (err) {
            console.log(err);
            return res.badRequest(err.message)
        }

        User.findById(resp.user.id, function (err, user) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            if (!user) {
                return res.badRequest("no user found with this with this login information");
            }

            let userInfo = {
                name: user.name,
                token: resp.token,
                refreshToken: resp.refreshToken,
                expiryMilliseconds: resp.expiryMilliseconds
            };

            res.success(userInfo);
        });
    });
});

/*** END POINT FOR LOGIN WITH FACEBOOK */
router.post('/facebook', function(req, res){

    let access_token = req.body.access_token;
    let referrer = req.body.referrer;

    firebase.loginWithFacebook(access_token, function(err, firebaseResponse){
        if (err){
            return res.badRequest(err.message);
        }

        processFirebaseSocialLogin(firebaseResponse, referrer, function(err, userInfo){
            if (err){
                res.badRequest(err);
            }
            else {
                res.success(userInfo);
            }
        });
    });
});

/*** END POINT FOR LOGIN WITH INSTAGRAM */
router.post('/google', function(req, res) {

    let access_token = req.body.access_token;
    let referrer = req.body.referrer;

    firebase.loginWithGoogle(access_token, function(err, firebaseResponse){
        if (err){
            return res.badRequest(err.message);
        }

        processFirebaseSocialLogin(firebaseResponse, referrer, function(err, userInfo){
            if (err){
                res.badRequest(err);
            }
            else {
                res.success(userInfo);
            }
        });
    });
});

function processFirebaseSocialLogin(firebaseResponse, referrer, callback) {
    User.findOne({_id: firebaseResponse.user.id}, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }
        if (!user) {
            console.log('no user found')
            if (referrer) {
                User.findOne({referrer: referrer}, function (err, ref) {
                    if (err) {
                        console.log(err);
                        return callback("Something unexpected happened");
                    }
                    if (!ref) {
                        return callback("no user found with the ref");
                    }

                    let info = {
                        _id: firebaseResponse.user.id,
                        referrer: ref._id,
                        name: firebaseResponse.user.displayName,
                        photoUrl: firebaseResponse.user.photoUrl,
                    };

                    createAccount(info, function (err, user) {
                        if (err) {
                            console.log(err);
                            return callback("Something unexpected happened");
                        }
                        let info = {
                            name: user.name,
                            token: firebaseResponse.token,
                            refreshToken: firebaseResponse.refreshToken,
                            expiryMilliseconds: firebaseResponse.expiryMilliseconds
                        };

                        return callback(null, info);
                    })
                })
            } else {
                console.log('no ref found')
                let info = {
                    _id: firebaseResponse.user.id,
                    name: firebaseResponse.user.displayName,
                    photoUrl: firebaseResponse.user.photoUrl,
                };

                createAccount(info, function (err, user) {
                    if (err) {
                        console.log(err);
                        return callback("Something unexpected happened");
                    }
                    let info = {
                        name: user.name,
                        token: firebaseResponse.token,
                        refreshToken: firebaseResponse.refreshToken,
                        expiryMilliseconds: firebaseResponse.expiryMilliseconds
                    };

                    return callback(null, info);
                })
            }
        } else {
            console.log('user found')
            let userInfo = {
                name: user.name,
                photoUrl: user.photoUrl,
                token: firebaseResponse.token,
                refreshToken: firebaseResponse.refreshToken,
                expiryMilliseconds: firebaseResponse.expiryMilliseconds
            };

            return callback(null, userInfo);
        }
    })
}

function createAccount(info, callback) {
    User.create(info, function (err, user) {
        if (err) {
            console.log(err);
            return callback("Something unexpected happened");
        }

        return callback(null, user)
    });
}

module.exports = router;