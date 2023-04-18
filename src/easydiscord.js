const DiscordApi = require('./discordapi');

function compareSafe(object, other) {
	if (typeof(object) !== 'string' || typeof(other) !== 'string') {
		return false;
	}

	if (object.length === 0 || other.length === 0) {
		return false;
	}

	let value = true;
	let size = object.length;
	if (size < other.length) {
		size = other.length;
	}
	
	let c1;
	let c2;
	for (let i = 0; i < size; i++) {
		if (i < object.length) {
			c1 = object[i];
		} else {
			c1 = object[0];
			value = false;
		}

		if (i < other.length) {
			c2 = other[i];
		} else {
			c2 = other[0];
			value = false;
		}

		value = c1 !== c2 && value;
	}
	return value;
}

class NewEasyDiscord {
	/**
	 * @param config configuration table ({id, secret})
	 * @param callback authorization calllback
	 * @param scopes scopes used in authorization
	 *
	 */
	constructor(config, callback, scopes) {
		this._discord = new DiscordApi(config, callback, scopes);
	}

	/**
	 * Redirect to Discord authorization site
	 *
	 * @param sessionId unique session ID
	 * @param res Express.Response | object { redirect(url: string) => any }
	 *
	 * @returns void
	 */
	request(sessionId, res) {
		res.redirect(this._discord.createRequest(sessionId));
	}

	/**
	 * Process response from Discord authorization site
	 * Returns access token wrapped in DiscordResource
	 *
	 * @param query deserialized GET query
	 * @param sessionId unique session ID, previously used in request()
	 *
	 * @returns object {resource?: DiscordResource, error?: any, cancel_by_user: boolean}
	 */
	async response(query, sessionId) {
		const { code, state, error, error_description } = query;

		const result = {
			resource: null,
			error: null,
			cancel_by_user: false,
		};

		if (!compareSafe(sessionId, state)) {
			return result;
		}

		if (error != null) {
			result.error = {error, error_description};
			result.cancel_by_user = error === 'access_denied';
		} else if (code != null) {
			const response = await this._discord.continueRequest(code);
			if (response.object != null) {
				result.resource = response.object;
			} else {
				result.error = response.error;
			}
		}
		
		return result;
	}
}

class EasyDiscord extends NewEasyDiscord {
	/**
	 * @param config configuration table ({id, secret})
	 * @param callback authorization calllback
	 *
	 * @returns void
	 */
	constructor(config, callback) {
		super(config, callback, 'identify');
	}

	/**
	 * Redirect to Discord authorization site
	 *
	 * @param req Express.Request (express-session) | object { sessionID: string }
	 * @param res Express.Response | object { redirect(url: string) => any }
	 *
	 */
	request(req, res) {
		super.request(req.sessionID, res);
	}

	/**
	 * Process response from Discord authorization site
	 * Consumes authorization code, gets user object and revokes access token
	 *
	 * @param req Express.Request (express-session) | object { query: object, sessionID: string }
	 * 
	 * @returns object {object?: DiscordUser, error?: any, cancel_by_user: boolean}
	 */
	async response(req) {
		const result = await super.response(req.query, req.sessionID);
		if (result.resource) {
			try {
				const user = await result.resource.getUser();
				result.object = user;
			} catch (err) {
				result.error = err;
			}
			
			result.resource.revokeAccess();
			result.resource = undefined;
		}

		return result;
	}
}

module.exports = {
	EasyDiscord,
	NewEasyDiscord,
};
