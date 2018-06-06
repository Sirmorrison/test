const express = require('express');
const router = express.Router();

const User = require('../../models/user');
const Package = require('../../models/packages');

/*** END POINT FOR GETTING PLAN PACKAGES BY ALL USER */
router.get('/', function (req, res) {

    Package.find({}, {package_name:1, amount:1, currency:1},function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        res.success(result);
    })
});

module.exports = router;