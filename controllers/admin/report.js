let express = require('express');
let router = express.Router();
let mongoose = require("mongoose");

const Report = require('../../models/reports');
let Admin = require('../../models/admin_user');


/*** END POINT FOR GETTING REPORTS CURRENTLY LOGGED IN ADMIN */
router.get('/', allow('queries'), function (req, res) {

    Report.aggregate([
        {$match: {viewed: false}},
        {
            $project: {
                report: 1,
                query: 1,
                reportedBy: 1,
                createdAt: 1
            },
        },
        {$sort: {createdAt: -1}},
        {$limit: 10}
    ], function (err, data) {

        if (err) {
            console.log(err);
            return res.badRequest(err, "Something unexpected happened");
        }

        Report.populate(data, {
                'path': 'reportedBy report.postedBy',
                'model': 'User',
                'select': 'name photoUrl'
            },

            function (err, post) {

                if (err) {
                    console.log(err);
                    return res.badRequest(err, "Something unexpected happened");
                }

                res.success(post);
            }
        );
    });
});

/*** END POINT FOR GETTING A PARTICULAR  CURRENTLY LOGGED IN ADMIN */
router.get('/:reportId', allow('queries'), function (req, res) {

    let id = req.params.reportId;
    Report.update({_id: id}, {$set: {viewed: true}}, function (err, z) {
        if (err) {
            console.log(err)
        }
        Report.findById(id, function (err, report) {
            if (err) {
                console.log(err);
                return res.serverError("Something unexpected happened");
            }
            if (!report) {
                return res.badRequest("no report found with the id provided");
            }
            console.log(report)
            Report.populate(report, {
                'path': 'reportedBy report.userId',
                'model': 'User',
                'select': 'name photoUrl'
            }, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.badRequest(err, "Something unexpected happened");
                }

                let info = {
                    reportId: result._id,
                    query: result.query,
                    createdAt: result.createdAt,
                    reportedBy: result.reportedBy,
                    report: result.report
                };

                return res.success(info);
            })
        });
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