let express = require('express');
let router = express.Router();

const Report = require('../../models/reports');
const validator = require('../../utils/validator');

/*** END POINT FOR GETTING PROFILE POST OF A USER BY ANOTHER CURRENTLY LOGGED IN USER */
router.post('/', function (req, res) {
    let report = req.params.report,
        id = req.user.id,
        reportedId = req.body.reportedId;

    let validated = validator.isSentence(res, report)&&
                    validator.isWord(res, reportedId);
    if (!validated) return;

    let info = {
        reportedId: reportedId,
        reportedBy: id,
        report: report
    };

    Report.create(info, function (err, report) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }

        console.log(report);
        res.success('report sent successfully');
    });
});

module.exports = router;