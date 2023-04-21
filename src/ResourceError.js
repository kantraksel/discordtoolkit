class ResourceError extends Error {
	constructor(statusCode, ...params) {
		super(...params);
		Error.captureStackTrace(this, ResourceError);

		this.name = 'ResourceError';
		this.statusCode = statusCode;
	}
}

export default ResourceError;
