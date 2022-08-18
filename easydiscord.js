const DiscordApi = require('./discordapi');

module.exports = class EasyDiscord {
	/**
	 *
	 * @param config oauth configuration table ({id, secret})
	 * @param callback url callback which calls response(req)
	 *
	 */
	constructor(config, callback) {
		this._discord = new DiscordApi(config, callback);
	}

	/**
	 * Redirect to Discord authorization site
	 *
	 * @param req IncomingMessage object (from express package)
	 * @param res OutgoungMessage object (from express package)
	 *
	 */
	request(req, res) {
		res.redirect(this._discord.createRequest(req.sessionID));
	}

	/**
	 * Process response from Discord authorization site
	 *
	 * @param req IncomingMessage object (from express package)
	 *
	 * @returns full response information
	 */
	async response(req) {
		const { code, state, error, error_description } = req.query;
		const result = {
			object: null,
			error: null,
			cancel_by_user: false,
		};

		if (error) {
			if (error === 'access_denied')
				result.cancel_by_user = true;
			else {
				result.error = {error, error_description};
			}
		}
		else if (code && state === req.sessionID) {
			const response = await this._discord.continueRequest(code);
			if (response.object) {
				try {
					const user = await response.object.getUser();
					result.object = user;
				} catch (err) {
					result.error = err;
				}
				
				response.object.revokeAccess();
			} else {
				result.error = response.error;
			}
		}
		
		return result;
	}
}
