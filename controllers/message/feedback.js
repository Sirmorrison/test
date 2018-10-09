const express = require('express');
const router = express.Router();

let Feedback = require('../../models/feedback');
let validator = require('../../utils/validator');

//FEEDBACK
/*** END POINT FOR SENDING FEEDBACK TO THE ADMIN FOR GUEST USERS*/
router.post('/', function (req, res){

    let email = req.body.email,
        title = req.body.title,
        message = req.body.message;

    let validated = validator.isValidEmail(res, email)&&
        validator.isSentence(res, message)&&
        validator.isSentence(res, title);
    if (!validated) return;

    let data = {
        email: email,
        message: message,
        title: title
    };

    Feedback.create(data, function (err, feed) {
        if (err){
            console.log(err);
            return res.serverError("Something unexpected happened");
        }

        console.log(feed);
        res.success("SUCCESSFUL: your feedback has been sent and you will be hearing from us soon");
    })
});

module.exports = router;