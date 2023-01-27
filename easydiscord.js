const DiscordApi = require('./discordapi');

class NewEasyDiscord {
	/**
	 * @param config oauth configuration table ({id, secret})
	 * @param callback url callback which calls response(req)
	 * @param scopes scopes used in authorization
	 *
	 */
	constructor(config, callback, scopes) {
		this._discord = new DiscordApi(config, callback, scopes);
	}

	/**
	 * Redirect to Discord authorization site
	 *
	 * @param sessionID unique sessionID
	 * @param res OutgoungMessage object
	 *
	 */
	request(sessionID, res) {
		res.redirect(this._discord.createRequest(sessionID));
	}

	/**
	 * Process response from Discord authorization site
	 * Returns access token wrapped in DiscordResource
	 *
	 * @param query deserialized GET query
	 * @param sessionID unique sessionID, previously used in request()
	 *
	 * @returns object {resource: DiscordResource | null, error: object | number | null, cancel_by_user: boolean}
	 */
	async response(query, sessionID) {
		const { code, state, error, error_description } = query;
		const result = {
			resource: null,
			error: null,
			cancel_by_user: false,
		};

		if (error) {
			if (error === 'access_denied') {
				result.cancel_by_user = true;
			} else {
				result.error = {error, error_description};
			}
		} else if (code && state === sessionID) {
			const response = await this._discord.continueRequest(code);
			if (response.object) {
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
	 * @param config oauth configuration table ({id, secret})
	 * @param callback url callback which calls response(req)
	 *
	 */
	constructor(config, callback) {
		super(config, callback, 'identify');
	}

	/**
	 * Redirect to Discord authorization site
	 *
	 * @param req IncomingMessage object (from express-session)
	 * @param res OutgoungMessage object
	 *
	 */
	request(req, res) {
		super.request(req.sessionID, res);
	}

	/**
	 * Process response from Discord authorization site
	 *
	 * @param req IncomingMessage object (from express-session)
	 *
	 * @returns object {object: DiscordUser | null, error: object | number | null, cancel_by_user: boolean}
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
