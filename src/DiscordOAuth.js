const { AuthorizationCode } = require('simple-oauth2');
const DiscordResource = require('./DiscordResource');

class DiscordOAuth {
	/**
	 * @param id client id
	 * @param secret client secret
	 * @param callback authorization callback
	 * @param scopes scopes used in authorization
	 */
	constructor(id, secret, callback, scopes) {
		this._client = new AuthorizationCode({
			client: {id, secret},
			auth: {
				tokenHost: 'https://discord.com',
				tokenPath: '/api/oauth2/token',
				revokePath: '/api/oauth2/token/revoke',
				authorizePath: '/oauth2/authorize',
			},
			options: {
				authorizationMethod: 'body',
			},
		});

		this._header = {
			scope: scopes,
			redirect_uri: callback,
		};
	}

	/**
	 * Creates url to authorization site
	 *
	 * @param stateId state id - cross site security parameter
	 *
	 * @returns string
	 */
	createRequest(stateId) {
		return this._client.authorizeURL({
			state: stateId,
			...this._header,
		});
	}

	/**
	 * Gets access token from authorization code
	 *
	 * @param code code obtained from authorization site
	 * 
	 * @returns object: DiscordResource
	 * @throws object: Error
	 */
	async continueRequest(code) {
		const accessToken = await this._client.getToken({
			code,
			...this._header,
		});
		return new DiscordResource(accessToken);
	}
};

module.exports = DiscordOAuth;
