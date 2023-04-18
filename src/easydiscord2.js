const NewEasyDiscord = require('./easydiscord');

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

module.exports = EasyDiscord;
