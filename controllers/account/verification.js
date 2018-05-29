let express = require('express');
let router = express.Router();

const config = require('../../config');
let FirebaseAuth = require('firebaseauth');
let firebase = new FirebaseAuth(config.FIREBASE_API_KEY);

/*** END POINT FOR REQUESTING RESENDING EMAIL VERIFICATION */
router.get('/email/request', function(req, res){
    let token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (typeof(token) !== 'string'){
        return res.badRequest('Token is missing or invalid');
    }

    firebase.sendVerificationEmail(token, function(err, result){
        if (err){
            //firebase error, return message
            return res.badRequest(err.message);
        }

        res.success(result);
    })
});

/*** END POINT FOR SUBMITTING OOBCODE FOR EMAIL VERIFICATION (TO BE CALLED FROM A WEB PAGE)*/
router.get('/email/verify', function(req, res){
    let oobCode = req.query.oobCode;
    if (typeof(oobCode) !== 'string'){
        return res.badRequest('OobCode was not provided');
    }

    firebase.verifyEmail(oobCode, function(err, result){
        if (err){
            //firebase error, return message
            return res.badRequest(err.message);
        }

        res.success(result);
    })
});

module.exports = router;