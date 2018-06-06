const express = require('express');
const router = express.Router();
let braintree = require('braintree');

const config = require('../../config');
let gateway = config.gateway;


router.get('/clientToken', function (req, res) {
    gateway.clientToken.generate({}, function (err, response) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
console.log(response)
        let clientToken = response.clientToken;
        res.success(clientToken);
    });
});



module.exports = router;