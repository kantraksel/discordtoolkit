const { AuthorizationCode } = require('simple-oauth2');
const DiscordResource = require('./discordresource');

class DiscordApi {

	/**
	 *
	 * @param config configuration table ({id, secret})
	 * @param callback authorization calllback
	 * @param scopes scopes used in authorization
	 *
	 */
	constructor(config, callback, scopes) {
		this._client = new AuthorizationCode({
			client: config,
			auth: {
				tokenHost: 'https://discord.com/api',
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
	 * @returns object { object?: DiscordResource | error?: any }
	 */
	async continueRequest(code) {
		try {
			const accessToken = await this._client.getToken({
				code,
				...this._header,
			});
			return {object: new DiscordResource(accessToken)};
		} catch (error) {
			return {error: error};
		}
	}
};

module.exports = DiscordApi;
