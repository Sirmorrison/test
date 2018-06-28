const express = require('express');
const router = express.Router();
let moment = require('moment');

let User = require('../../models/user');
const config = require('../../config');
const unirest = require("unirest"); //unirest is an http request library so any other preferred library can be used.

router.post("/subscription", function (req, res) {

    let txref = req.body.reference;
    let userId = req.user.id;

    if (typeof(txref) !== 'string' || txref.trim() === 0) {
        return res.badRequest('Reference is required and cannot be empty');
    }

    let payload = {
        "SECKEY": config.rave,
        "txref": txref,
        "include_payment_entity": 1
    };

    let server_url = "https://ravesandboxapi.flutterwave.com/flwv3-pug/getpaidx/api/xrequery";
//please make sure to change this to production url when you go live

//make a post request to the server
    unirest.post(server_url)
        .headers({'Content-Type': 'application/json'})
        .send(payload)
        .end(function (response) {
            if (response.error){
                console.log(response.error);
                return res.badRequest('something unexpected happened')
            }
            // if(response.body.status === 'error' || response.body.data.message === "No transaction found" || response.body._data.code === "NO TX"){
            //     return res.badRequest('transaction was unsuccessful')
            // }
            //check status is success.
            paymentInfo(response, userId, function (errorMessage, userInfo) {
                if (err) {
                    res.badRequest(errorMessage);
                }
                else {
                    res.success(userInfo);
                }
            });

            res.success(response)
        });
});

function paymentInfo(response, userId, callback){

    let sub_date = moment(response.body.data.created);
    let sub_expiry = moment(response.body.data.created).add(30, 'days');
    let amount = response.body.data.amount;
    let currency = response.body.data.currency;
    let data = {
        sub_date: sub_date,
        sub_expiry: sub_expiry,
    };

    if (response.body.data.status === "successful" && response.body.data.chargecode === '00') {
        //check if the amount is same as amount you wanted to charge just to be very sure
        if (amount === 200 && currency === 'USD') {
            data.packageType = "silver"
        } else if (amount === 40 && currency === 'USD') {
            data.packageType = "diamond"
        } else {
            return res.badRequest('payment amount undefined please check the amount');
        }
            //then give value for the payment
        User.findByIdAndUpdate(userId, {$set: data}, {new: true}, function (err, info) {
            if (err) {
                console.log("This is verification error: ", err);
                return callback("Something unexpected happened");
            }
            if (!user) {
                return callback("no user found");
            }
            return callback(null, 'Your Subscription to ', info.data.packageType, ' was a: ', info.status);
        });
    }
}

module.exports = router;