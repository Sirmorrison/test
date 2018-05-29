exports.setupResponder = function(req, res, next)
{
	res.reply = function(response, code){
		if (code)
			res.status(code);
		else if (response.code)
			res.status(response.code);
		else
			res.status(200);

		res.send(response);
	};

	res.success = function(data){
		if (!res.headersSent){
			let response = {
				status: "success",
				code: 200,
				data: data
			};
			
			res.reply(response);
		}
	};

	//some error not due to server
	res.serverError = function(error){
		if (!res.headersSent){
			let response = {
				status: "error",
				description: "Server Error",
				code: 500,
				error: error
			};
			
			res.reply(response);
		}
	};

	//token failed validation or was not supplied
	res.unauthorized = function(error){
		if (!res.headersSent){
			let response = {
				status: "error",
				description: "Unauthorized",
				code: 401,
				error: error,
				error_code: "unauthorized"
			};
			
			res.reply(response);
		}
	};

	//user does not have necessary permissions to perform requested action
	res.notAllowed = function(error){
		if (!res.headersSent){
			let response = {
				status: "error",
				description: "Unauthorized",
				code: 401,
				error: error,
				error_code: "not_allowed"
			};
			
			res.reply(response);
		}
	};

	//user caused error, improper or invalid request
	res.badRequest = function(error, error_code){
		if (!res.headersSent){
			let response = {
				status: "error",
				description: "Bad Request",
				code: 400,
				error: error,
				error_code: error_code
			};
			
			res.reply(response);
			return false; //to stop code execution
		}
	};

	next();
};