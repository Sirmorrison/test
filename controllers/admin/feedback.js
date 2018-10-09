let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

const Feedback = require('../../models/feedback');
let Admin = require('../../models/admin_user');


/*** END POINT FOR GETTING ALL SUPPORT MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/', allow('messages'), function (req, res) {

    Feedback.find({}, {email: 1, message: 1, title: 1, createdAt: 1})
        .sort({createdAt: -1})
        .limit(30)
        .exec(function (err, data) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!data) {
            return res.success({});
        }

        res.success(data);
    })
});

/*** END POINT FOR GETTING ALL SUPPORT MESSAGE BY CURRENTLY LOGGED IN USER */
router.get('/:feedBackId', allow('messages'), function (req, res) {

    let feedBackId = req.params.feedBackId,
        id = mongoose.Types.ObjectId(feedBackId);

    Feedback.findOne({_id: id}, {email: 1, message: 1, title: 1, createdAt: 1}, function (err, feed) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!feed) {
            return res.success({});
        }

        res.success(feed);
    })
});

/*** END POINT FOR DELETING ADDRESS BY ID OF CURRENTLY LOGGED IN USER */
router.delete('/:feedBackId', allow('messages'), function (req, res) {

    let feedBackId = req.params.feedBackId;
    Feedback.remove({_id: feedBackId}, function (err) {
        if (err) {
            console.log(err);
            return res.badRequest("Some error occurred");
        }

        res.success('feedback deleted successfully');
    });
});

function allow(admin_function) {
    return function (req, res, next) {
        let userId = req.user.id;
        Admin.findById(userId, function (err, user) {
            if(err){
                console.log(err);
                return res.badRequest('something happened')
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


            // if (user) {
            //     let that = user.admin_function;
            //     console.log(that)
            //
            //     for (let i = 0; i < that.length; i++) {
            //         console.log(that[i].indexOf(admin_function.split(',')))
            //
            //         if (that[i].indexOf(admin_function.split(',')) >= 0) {
            //             console.log(user)
            //
            //             req.user = user;
            //             return next();
            //         }
            //     }
            // }
            return res.unauthorized('you are not authorized to perform this action')
        })

    }
}

module.exports = router;