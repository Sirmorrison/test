const express = require('express');
const router = express.Router();

const User = require('../../models/user');
const event = require('../../models/events');

/** endpoint for getting event list by users and admin*/
router.get('/', function (req,res) {

    User.findById(req.user.id, function (err, user) {
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        if (!user){
            return res.badRequest("you not authorized perform this action");
        }

        event.find({}, function (err, result) {
            if (err) {
                return res.badRequest("Something unexpected happened");
            }
            if (!result) {
                return res.success([]);
            }

            res.success(result);
        });
    });
});

/** endpoint for posting event list by admin*/
router.post('/', function (req,res) {

    let event_type = req.body.event_type;

    User.findById(req.user.id, function (err, user) {
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        if (!user){
            return res.badRequest("you not authorized perform this action");
        }
        if (user.admin !== true){
            return res.badRequest("you not authorized perform this action");
        }
        if (typeof(event_type) !== 'string' || event_type.trim().length <= 0) {
            return res.badRequest('Type of Event is required, cannot be empty and must be string');
        }
        let event = {
            postedBy:  req.user.id,
            event_type: event_type
        };

        event.create(event, function (err, result) {
            if (err){
                console.log(err);
                return res.serverError("Something unexpected happened");
            }

            res.success({eventId: result._id, event: result.event_type});
        });
    });
});

/** editing event by admin USING the ID*/
router.post('/:event_typeId', function (req,res) {

    let event_type = req.body.event_type;

    User.findById(req.user.id, function (err, user) {
        if (err) {
            return res.badRequest("Something unexpected happened");
        }
        if (!user){
            return res.badRequest("you not authorized perform this action");
        }
        if (user.admin !== true) {
            return res.badRequest("You are not Authorized Perform this Action");
        }
        if (typeof(event_type) !== 'string' || event_type.trim().length <= 0) {
            return res.badRequest('Type of Event is required, cannot be empty and must be string');
        }

        let event = {
            postedBy:  req.user.id,
            event_type: event_type
        };

        event.findByIdAndUpdate({_id : req.params.event_typeId}, {$set: event}, {new: true}, function (err, result) {
            if (err) {
                console.log("This is weeks error: ", err);
                return res.badRequest("Something unexpected happened");
            }

            res.success({event: result.event_type});
        });
    });
});

/** deleting an event type by admin*/
router.delete('/:event_typeId', function (req, res) {

    User.findById(req.user.id, function (err, user) {
        if (err) {
            console.log("This is weeks error: ", err);
            return res.badRequest("Something unexpected happened");
        }
        if (user.admin !== true) {
            return res.badRequest("You are not Authorized Perform this Action");
        }

        event.remove({_id: req.params.event_typeId}, function (err, result) {
            if (err) {
                return res.badRequest("Something unexpected happened");
            }

            res.success("event type was deleted successfully");
        });
    });
});
