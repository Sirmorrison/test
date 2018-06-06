let express = require('express');
let router = express.Router();

const protector = require('../middlewares/protector');

//all packages endpoints
let packages = require('../controllers/admin/packages');
router.use('/packages',protector.protect, packages);

//all category endpoints
let category = require('../controllers/admin/category');
router.use('/category',protector.protect, category);

//all profile endpoints
// let biz_profile = require('../controllers/business/biz_profile');
// router.use('/biz_profile',protector.protect, biz_profile);

module.exports = router;