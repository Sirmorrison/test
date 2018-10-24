let validator = require('validator');
let User = require('../models/user');
let Admin = require('../models/admin_user');
let Package = require('../models/packages');
let Category = require('../models/categories');

exports.isValidEmail = function(res, email, optional){
	if (!optional && !email) {
	    return res.badRequest('Email is required');
	}
	if (!validator.isEmail(email)){
        return res.badRequest('Email! not valid and is required');
    }

	return true;
};

exports.isValidPhoneNumber = function(res, phoneNumber, id, optional){
    if (!optional && !phoneNumber) {
        return res.badRequest('Phone Number is required');
    }
    if (!validator.isMobilePhone(phoneNumber, 'any')){
        return res.badRequest('Phone Number is not valid')
    }
    if(phoneNumber) {
        User.findOne({phone_number: phoneNumber}, function (err, result) {
            if (err) {
                console.log(err);
                return res.badRequest("Something unexpected happened");
            }
            if (result && result._id !== id) {
                return res.badRequest("user A user already exist with this phone number: " + phoneNumber);
            }

            return true
        });
    }

    return true;
};

exports.isRef = function(res, referrer, optional) {
    if (!optional && !referrer) {
        return res.badRequest('referrerId is required');
    }
    if (typeof(referrer) !== 'string' || referrer.trim().length === 0) {
        return res.badRequest('field must be a string and cannot be empty');
    }
    User.findOne({referrer: referrer}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (result) {
            return res.badRequest("mongo user A user already exist with this phone number: " + phoneNumber);
        }

        return true;
    });


    return true;
};

exports.isNumber = function(res, number, optional){
    if (!optional && !number) {
        return res.badRequest('Phone Number is required');
    }
    if (!validator.isNumeric(number) || number < 0){
        return res.badRequest('field requires only numeric values and must be greater than zero')
    }

    return true;
};

exports.isSentence = function(res, sentence, optional){

    if (!optional && !sentence) {
        return res.badRequest('A required field is missing');
    }
    if (typeof(sentence) !== 'string' || (sentence.trim().indexOf(' ') <= 0 || sentence.trim().indexOf(' ') > 2000 )){
        return res.badRequest('field value must be a string and must contain more than one word and less than 2000 words');
    }

    return true;
};

exports.isPackage = function(res, data, optional){
    console.log(data)
    if (!optional && !data) {
        return res.badRequest('A required field is missing');
    }
    if (typeof(data) !== 'string' || (data.trim().length <= 0)){
        return res.badRequest('field value must be a string and must contain more than one word and less than 2000 characters');
    }

    Package.findOne({plan: data}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (result) {
            return res.badRequest("A package already exist with this plan: " + pla);
        }

        return true;
    });

    return true;
};

exports.isValidPackage = function(res, data, optional){
    console.log(data)
    if (!optional && !data) {
        return res.badRequest('A required field is missing');
    }
    if (typeof(data) !== 'string' || (data.trim().length <= 0)){
        return res.badRequest('field value must be a string and must contain more than one word and less than 2000 characters');
    }

    Package.findOne({_id: data}, function (err, result) {
        if (err) {
            console.log(err);
            return res.badRequest("Something unexpected happened");
        }
        if (!result) {
            return res.badRequest('no plan found with details provided');
        }

        return true;
    });

    return true;
};

exports.isWord = function(res, word, optional){

    if (!optional && !word) {
        return res.badRequest('A required field is missing');
    }
    if (typeof(word) !== 'string' ||  word.trim().length === 0 || word.length === 0){
        return res.badRequest('field must be a string and cannot be empty');
    }

    return true;
};

exports.isCategory = function(res, cate_tags, optional){
    if (!optional && !cate_tags) {
        return res.badRequest('filter category is required');
    }
    if (typeof(cate_tags) && !Array.isArray(cate_tags)){
        return res.badRequest('Tags should be a json array of category Ids (string)')
    }
    if (cate_tags) {
        for (let i = 0; i < cate_tags.length; i++) {
            let cate_tag = cate_tags[i];

            if (typeof(cate_tag) !== "string") {
                return res.badRequest("category IDs in tagged array must be string");
            }

            Category.findOne({_id: cate_tag}, function (err, f) {
                if (err && err.name === "CastError") {
                    return res.badRequest("category error please pick from the available categories");
                }
                if (err) {
                    return res.badRequest("something unexpected happened");
                }
                if (!f) {
                    return res.badRequest("category error please pick from the available categories");
                }

            });
        }
    }

    return true
};

exports.isCountry = function(res, country, optional){
    if (!optional && !country) {
        return res.badRequest('country field is required');
    }
    if(typeof(country) !== 'string'){
        return res.success('country MUST be string')
    }
    let allowedStatus = ["NG","US", "GH", "KE", "OT"];
    console.log(country)

    if (country && allowedStatus.indexOf(country) < 0){
        return res.badRequest("Country is not valid please pick from the options available: NG, US,GH,KE,OT ");
    }

    return true
};

exports.isJson = function(res, field, optional) {

    if (!optional && !field) {
        return res.badRequest('min and max field field is required');
    }
    if ((typeof(field.min.currency) !== 'string'|| field.min.currency === undefined) || (typeof(field.min.amount) !== 'number'|| field.min.amount === undefined)) {
        return res.badRequest('min currency and amount must be string and number respectively and cannot be empty');
    }
    if ((typeof(field.max.currency) !== 'string'|| field.max.currency === undefined) || (typeof(field.max.amount) !== 'number'|| field.max.amount === undefined)) {
        return res.badRequest('max currency and amount must be string and in json and number respectively and cannot be empty');
    }
    if (field.commission && (typeof(field.commission.user) !== 'number'|| field.commission.user === undefined) || (typeof(field.commission.admin) !== 'number'|| field.commission.admin === undefined)) {
        return res.badRequest('commission for admins and user is required and must be in json and number respectively and cannot be empty');
    }
    if (field.min.amount > field.max.amount) {
        return res.badRequest('min amount cannot be greater than max amount');
    }
    if((field.commission.user + field.commission.admin < 100) || (field.commission.user + field.commission.admin > 100)){
        return res.badRequest('the sum of user and admin commission must be equal to 100%')
    }
    data = JSON.stringify(field)

    if (!validator.isJSON(data)) {
        return res.badRequest('min and max field not valid and is required');
    }

    return true;
};

exports.isJsonS = function(res, field, optional) {

    if (!optional && !field) {
        return res.badRequest('min and max field field is required');
    }
    if ((typeof(field.min.currency) !== 'string'|| field.min.currency === undefined) || (typeof(field.min.amount) !== 'number'|| field.min.amount === undefined)) {
        return res.badRequest('min currency and amount must be string and number respectively and cannot be empty');
    }
    if ((typeof(field.max.currency) !== 'string'|| field.max.currency === undefined) || (typeof(field.max.amount) !== 'number'|| field.max.amount === undefined)) {
        return res.badRequest('max currency and amount must be string and in json and number respectively and cannot be empty');
    }
    if (field.commission && (typeof(field.commission.user.answer) !== 'number'|| field.commission.user.answer === undefined) || (typeof(field.commission.user.question) !== 'number'|| field.commission.user.question === undefined)) {
        return res.badRequest('commission for user answer and question are required and must be in json and number respectively and cannot be empty');
    }
    if (field.commission && (typeof(field.commission.admin) !== 'number'|| field.commission.admin === undefined)) {
        return res.badRequest('commission for admin answer is required and must be in json and number and cannot be empty');
    }
    if (field.min.amount > field.max.amount) {
        return res.badRequest('min amount cannot be greater than max amount');
    }
    if((field.commission.user.answer + field.commission.user.question + field.commission.admin < 100) || (field.commission.user.answer + field.commission.user.question + field.commission.admin > 100)){
        return res.badRequest('the sum of question, answer, and admin commission must be equal to 100%')
    }
    console.log(field)

    data = JSON.stringify(field);

    if (!validator.isJSON(data)) {
        return res.badRequest('min and max field not valid and is required');
    }

    return true;
};

exports.isCommission = function(res, field, optional) {

    if (!optional && !field) {
        return res.badRequest('min and max field field is required');
    }
    if ((typeof(field.user) !== 'number'|| field.user === undefined) || (typeof(field.admin) !== 'number'|| field.admin === undefined)) {
        return res.badRequest('user and admin commission must be number respectively and cannot be empty');
    }
    if ((field.user + field.admin < 100) || (field.user + field.admin > 100)) {
        return res.badRequest('Error: user and admin commissions must be equal to 100%');
    }

    data = JSON.stringify(field);

    if (!validator.isJSON(data)) {
        return res.badRequest('min and max field not valid and is required');
    }

    return true;
};

exports.isCurrency = function(res, details, optional) {
    if (!optional && !details) {
        return res.badRequest('currency is required');
    }
    if (typeof(details) !== 'string'|| details.trim().length === 0 || details !== 'USD') {
        return res.badRequest('currency must be string and USD and is required');
    }

    return true;
};

exports.isAmount = function(res, details, optional) {
    if (!optional && !details) {
        return res.badRequest('amount is required');
    }
    if (typeof(details) !== 'number'|| details < 0 ) {
        return res.badRequest('amount must be number and is required');
    }

    return true;
};

exports.isDetails = function(res, details, optional) {
    console.log(details)
    if (!optional && !details) {
        return res.badRequest('package details is required');
    }
    if (typeof(details.currency) !== 'string'|| details.currency === undefined) {
        return res.badRequest('details currency must be string and is required');
    }
    if (typeof(details.amount) !== 'number'|| details.amount === undefined || details.amount < 0) {
        return res.badRequest('details amount must be number, cannot be less than zero and is required');
    }

    data = JSON.stringify(details);

    if (!validator.isJSON(data)) {
        return res.badRequest('min and max details have to be json and is required');
    }

    return true;

};

exports.isBankDetails = function(res, details, optional) {
    console.log(details)

    if (!optional && !details) {
        return res.badRequest('account details details is required and in json');
    }
    if (typeof(details.account_name) !== 'string'|| details.account_name === undefined) {
        return res.badRequest('BAnk account name must be string and is required');
    }
    if (typeof(details.account_number) !== 'string'|| details.account_number === undefined) {
        return res.badRequest('account number should be and is required');
    }

    data = JSON.stringify(details)

    if (!validator.isJSON(data)) {
        return res.badRequest('account details not valid and is required and must be json key value pairs');
    }

    return true;
};

exports.isValidPassword = function(res, password, optional){
	if (!optional && !password) {
	    return res.badRequest('Password is required');
	}
	if (typeof(password) !== 'string' || password.length < 6){
	    return res.badRequest('Invalid password. Must be 6 or more characters')
	}

	return true;
};

exports.isFullname = function(res, name, optional){
	if (!optional && !name) {
	    return res.badRequest('Name is required');
	}

    let validName = /^[a-z,A-Z]([-']?[a-z,A-Z]+)*( [a-z,A-Z]([-']?[a-z,A-Z]+)*)+$/.test(name); //https://stackoverflow.com/questions/11522529/regexp-for-checking-the-full-name
    if (!validName){
        return res.badRequest('Name is not valid or complete. Provide name in full');
    }

	return true;
};

exports.isName = function(res, name, optional){
    if (!optional && !name) {
        return res.badRequest('Name is required');
    }

    let validName = /^[A-Za-z0-9_.'-]+(?:\s+[A-Za-z0-9_.'-]+)*$/.test(name); //https://stackoverflow.com/questions/11522529/regexp-for-checking-the-full-name
    if (!validName){
        return res.badRequest('Business Name is not valid. name must start with a letter Provide name in full');
    }

    return true;
};

exports.isRating = function(res, rating, optional){
    if (!optional && !rating) {
        return res.badRequest('Rating is required');
    }

    if (typeof(rating) !== 'number' || (rating < 1 || rating > 5)) {
        return res.badRequest('Rating must be number not string and must be between 1 to 5');
    }

    return true;
};

exports.isAllowed = function(res, status, optional){
    if (!optional && !status) {
        return res.badRequest('status is required');
    }
    if (typeof(status) !== 'string') {
        return res.badRequest('status must be string and is required');
    }

    let allowedStatus = ["suspended","approved", "declined"];
    if (status && allowedStatus.indexOf(status.toLowerCase()) < 0){
        return res.badRequest("status is not valid please pick from the options available");
    }

    return true;
};

exports.isUsername = function(res, username, optional){
    if (!optional && !username) {
        return res.badRequest('Username is required');
    }

    let validUsername = /^[a-zA-Z0-9_.-]{3,16}$/.test(username);
    if (!validUsername){
        return res.badRequest('Username is not valid please enter a valid username');
    }

    return true;
};

exports.isAdminRating = function(res, rating, optional){
    if (!optional && !rating) {
        return res.badRequest('File to be uploaded is required');
    }

    if (typeof(rating) !== 'number' || (rating < 0 || rating > 100000)){
        return res.badRequest('admin rating must be number and not greater 100000')
    }

    return true;
};

exports.isFile = function(res, file, optional){
    if (!optional && !file) {
        return res.badRequest('File to be uploaded is required');
    }
    console.log(file);

    if (typeof(file.path) !== 'string' || file.path.trim().length <= 0 ){
        return res.badRequest('File to be uploaded is required and must be string')
    }

    return true;
};