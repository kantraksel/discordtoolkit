const { AuthorizationCode } = require('simple-oauth2');
const https = require('https');

function HttpGet(token, url) {
	const httpOptions = {
		timeout: 10000,
		headers: {
			Authorization: `Bearer ${token}`,
		},
	};

	return new Promise((resolve, reject) => {
		https.get(url, httpOptions, (res) => {
			res.setEncoding('utf8');
	
			const data = [];
			res.on('data', (chunk) => {
				data.push(chunk);
			});
	
			res.on('end', () => {
				if (res.statusCode !== 200) {
					let error = new Error(`Resource returned ${res.statusCode}`);
					error.statusCode = res.statusCode;
					reject(error);
				} else {
					try {
						resolve(JSON.parse(data.toString()));
					} catch (error) {
						reject(error);
					}
				}
			});
		}).on('error', (error) => {
			reject(error);
		});
	});
}

class DiscordResource {
	constructor(accessToken) {
		this._accessToken = accessToken;
	}

	/**
	 * Get current user
	 * 
	 * @returns User object
	 * @throws Error object
	 */
	async getUser() {
		return await HttpGet(this._accessToken.token.access_token, "https://discord.com/api/users/@me");
	}

	/**
	 * Get member of guild
	 * 
	 * @param guildId Guild Id
	 * 
	 * @returns Guild Member object
	 * @throws Error object
	 */
	async getMemberFromGuild(guildId) {
		return await HttpGet(this._accessToken.token.access_token, `https://discord.com/api/users/@me/guilds/${guildId}/member`);
	}

	/**
	 * Revokes access token
	 */
	async revokeAccess() {
		try {
			await this._accessToken.revokeAll();
		} catch (_) {}
	}

	/**
	 * 
	 * @returns string - access token
	 */
	getAccessToken() {
		return _accessToken.token.access_token;
	}
}

module.exports = class DiscordApi {

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
