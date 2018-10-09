let express = require('express');
let router = express.Router();

const config = require('../../config');
let FirebaseAuth = require('firebaseauth');
let firebase = new FirebaseAuth(config.FIREBASE_API_KEY);

const protector = require('../../middlewares/protector');
const validator = require('../../utils/validator');

let User = require('../../models/user');

/*** END POINT FOR SIGNUP WITH EMAIL */
router.post('/', function(req, res) {

    let email = req.body.email,
        password = req.body.password,
        name = req.body.name,
        admin = req.body.admin,
        referralCode = req.body.referralCode;

    if (admin === 0 || admin === '0' || admin === 'f' || admin === 'false' || admin === 'no' || admin === null || admin === undefined)
        admin = false;
    else if (admin === 1 || admin === '1' || admin === 't' || admin === 'true' || admin === 'yes')
        admin = true;

    let validated = validator.isValidEmail(res, email) &&
        validator.isValidPassword(res, password) &&
        validator.isFullname(res, name);
    if (!validated) return;

    let extras = {
        name: name,
        requestVerification: true
    };

    firebase.registerWithEmail(email, password, extras, function (err, firebaseResponse) {
        if (err) {
            return res.badRequest(err.message);
        }
        if (referralCode) {
            User.findOne({referralCode: referralCode}, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                if (!result) {
                    return res.badRequest("no user found with referrer code provided");
                }

                let info = {
                    _id: firebaseResponse.user.id,
                    name: firebaseResponse.user.displayName,
                    email: firebaseResponse.user.email,
                    admin: admin,
                    referrer: result._id
                };

                createAccount(info, function (err, user) {
                    if (err) {
                        console.log(err);
                        return res.badRequest("Something unexpected happened");
                    }
                    let info = {
                        name: user.name,
                        referrer: user.referrer,
                        token: firebaseResponse.token,
                        refreshToken: firebaseResponse.refreshToken,
                        expiryMilliseconds: firebaseResponse.expiryMilliseconds
                    };

                    return res.success(info);
                });
            })
        }else {
            console.log('no ref')
            let info = {
                _id: firebaseResponse.user.id,
                name: firebaseResponse.user.displayName,
                email: firebaseResponse.user.email,
            };

            createAccount(info, function (err, user) {
                if (err) {
                    console.log(err);
                    return res.badRequest("Something unexpected happened");
                }
                let info = {
                    name: user.name,
                    token: firebaseResponse.token,
                    refreshToken: firebaseResponse.refreshToken,
                    expiryMilliseconds: firebaseResponse.expiryMilliseconds
                };

                return res.success(info);
            });
        }
    })
});

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