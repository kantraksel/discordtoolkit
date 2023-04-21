const NewEasyDiscord = require('./easydiscord');

class EasyDiscord extends NewEasyDiscord {
	/**
	 * @param config configuration object ({id, secret})
	 * @param callback authorization calllback
	 *
	 * @returns void
	 */
	constructor(config, callback) {
		super(config, callback, 'identify');
	}

	/**
	 * Process response from Discord authorization site
	 * Consumes authorization code, gets user object and revokes access token
	 * Do NOT use session ID
	 *
	 * @param req Express.Request | object { query: object }
	 * @param requestId unique request ID, previously used in request() (do NOT use session ID)
	 * 
	 * @returns object {object?: DiscordUser, error?: any, cancel_by_user: boolean}
	 */
	async response(req, requestId) {
		const result = await super.response(req.query, requestId);
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

module.exports = EasyDiscord;
