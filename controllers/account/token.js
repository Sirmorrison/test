let express = require('express');
let router = express.Router();

const config = require('../../config');
let FirebaseAuth = require('firebaseauth');
let firebase = new FirebaseAuth(config.FIREBASE_API_KEY);

router.post('/', function(req, res){

    let refreshToken =  (req.headers.refreshToken || req.body.refreshToken || req.query.refreshToken)
    if (typeof(refreshToken) !== 'string'){
        return res.badRequest('refreshToken is required');
    }

    firebase.refreshToken(refreshToken, function(err, response){
        if (err){
            //firebase errors come as object {code, message}, return only message
            return res.badRequest(err.message);
        }

        res.success(response);
    });
});

module.exports = router;