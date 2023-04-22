class AuthorizationError extends Error {
	constructor(error, description, ...params) {
		super(description, ...params);
		Error.captureStackTrace(this, AuthorizationError);

		this.name = 'AuthorizationError';
		this.code = error;
	}
}

module.exports = AuthorizationError;
