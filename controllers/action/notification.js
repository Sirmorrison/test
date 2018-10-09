let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

let Notification = require('../../models/notification');

/*** END POINT FOR GETTING NOTIFICATION OF CURRENTLY LOGGED IN USER */
router.get('/', function (req, res) {

    let id = req.user.id;
    Notification.remove({ownerId: id, viewed: true}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest('something unexpected happened')
        }
        console.log(err);
        Notification.find({ownerId: id, viewed: false}, {message: 1, createdOn: 1}, function (err, note) {
            if (err) {
                console.log(err);
                return res.badRequest('something unexpected happened')
            }
            if (!note) {
                return res.success({})
            }

            let data = {
                'total notification': note.length,
                notification: note
            };

            res.success(data)
        });
    });
});

/*** END POINT FOR GETTING A NOTIFICATION BY ITS ID OF CURRENTLY LOGGED IN USER */
router.get('/:notificationId', function (req, res) {

    let id = req.user.id,
        note = req.params.notificationId,
        noteId = mongoose.Types.ObjectId(note);

    Notification.update(
        {"ownerId": id, _id: noteId},
        {$set: {viewed: true}}, function (err) {
            if (err) {
                console.log(err)
            }
            Notification.findOne({ownerId: id, viewed: false}, {__v: 0, updatedAt: 0, ownerId:0, viewed:0})
                .populate({
                    path: 'userId',
                    select: 'name photoUrl'
                })
                .exec(function (err, note) {
                if (err) {
                    console.log(err);
                    return res.badRequest('something unexpected happened')
                }
                if (!note) {
                    return res.success({})
                }

                let data = {
                    notificationId: note._id,
                    createdAt: note.createdAt,
                    message: note.message,
                    postId: note.postId,
                };

                res.success(data)
            });

            // Notification.aggregate([
            //     {$match: {"ownerId": id, _id: noteId}},
            //     {$project: {postId: 1, createdOn: 1, message: 1, userId: 1}},
            //     {$sort: {date: -1}}
            // ], function (err, data) {
            //     if (err) {
            //         console.log(err);
            //         return res.badRequest("Something unexpected happened");
            //     }
            //     Notification.populate(data, {
            //         'path': 'userId postId',
            //         'select': 'name title'
            //     }, function (err, post) {
            //
            //         if (err) {
            //             console.log(err);
            //             return res.badRequest("Something unexpected happened");
            //         }
            //
            //         res.success(post);
            //     });
            // });
        });
});

module.exports = router;