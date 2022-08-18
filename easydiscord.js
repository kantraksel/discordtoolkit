const DiscordApi = require('./discordapi');

class NewEasyDiscord {
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
	 * @param sessionID unique sessionID
	 * @param res OutgoungMessage object
	 *
	 */
	request(sessionID, res) {
		res.redirect(this._discord.createRequest(sessionID));
	}

	/**
	 * Process response from Discord authorization site
	 *
     * @param query deserialized get query
	 * @param sessionID unique sessionID, previously used in request()
	 *
	 * @returns object {object: DiscordUser | null, error: object | number | null, cancel_by_user: boolean}
	 */
	async response(query, sessionID) {
		const { code, state, error, error_description } = query;
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
		else if (code && state === sessionID) {
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

class EasyDiscord extends NewEasyDiscord {
    /**
	 *
	 * @param config oauth configuration table ({id, secret})
	 * @param callback url callback which calls response(req)
	 *
	 */
	constructor(config, callback) {
        super(config, callback);
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
        super.response(req.query, req.sessionID);
    }
}

module.exports = {
    EasyDiscord,
    NewEasyDiscord,
};
