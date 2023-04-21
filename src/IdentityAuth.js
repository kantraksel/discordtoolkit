import GenericAuth from './GenericAuth';

class IdentityAuth extends GenericAuth {
	/**
	 * @param id client id
	 * @param secret client secret
	 * @param callback authorization callback
	 *
	 * @returns void
	 */
	constructor(id, secret, callback) {
		super(id, secret, callback, 'identify');
	}

	/**
	 * Process response from Discord authorization site
	 * Consumes authorization code, gets user object and revokes access token
	 * Do NOT use session ID
	 *
	 * @param req Express.Request | object { query: object }
	 * @param requestId unique request ID, previously used in request() (do NOT use session ID)
	 * 
	 * @returns object {object?: DiscordUser, error?: Error, cancelled: boolean} | null
	 */
	async response(req, requestId) {
		const result = await super.response(req.query, requestId);
		if (result != null && result.resource != null) {
			try {
				result.object = await result.resource.getUser();
			} catch (error) {
				result.error = error;
			}
			
			result.resource.revokeAccess();
			result.resource = undefined;
		}

		return result;
	}
}

export default IdentityAuth;
