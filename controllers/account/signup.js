let express = require('express');
let router = express.Router();
let moment = require('moment');

const config = require('../../config');
let FirebaseAuth = require('firebaseauth');
let firebase = new FirebaseAuth(config.FIREBASE_API_KEY);

const protector = require('../../middlewares/protector');
const validator = require('../../utils/validator');

let User = require('../../models/user');

/*** END POINT FOR SIGNUP WITH EMAIL */
router.post('/', function(req, res){

    let email = req.body.email,
        password = req.body.password,
        name = req.body.name,
        admin = req.body.admin,
        phone_number = req.body.phone_number;

    if (admin === 0 || admin === '0' || admin === 'f' || admin === 'false' || admin === 'no')
        admin = false;
    else if (admin === 1 || admin === '1' || admin === 't' || admin === 'true' || admin === 'yes')
        admin = true;

    if (admin && typeof(admin) !== 'boolean'){
        return res.badRequest('Admin flag is required');
    }

    //chain validation checks, first one to fail will cause the code to break instantly
    let validated = validator.isValidEmail(res, email) &&
                    validator.isValidPassword(res, password) &&
                    validator.isValidPhoneNumber(res, phone_number) &&
                    validator.isFullname(res, name);

    if (!validated)
        return;

    let extras = {
        name: name,
        requestVerification: true
    };
    User.findOne({phone_number: phone_number}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (result) {
            return res.badRequest("A user already exist with this phone number: "+ phone_number);
        }
        if (!result) {
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
                    admin: admin
                };
                User.create(info, function (err, user) {
                    if (err) {
                        console.log(err);

                        return res.badRequest("Something unexpected happened");
                    }

                        let info = {
                        name: user.name,
                        phone_number: user.phone_number,
                        token: firebaseResponse.token,
                        refreshToken: firebaseResponse.refreshToken,
                        expiryMilliseconds: firebaseResponse.expiryMilliseconds
                    };
                    res.success(info);
                });
            });
        }
    })
});

module.exports = router;