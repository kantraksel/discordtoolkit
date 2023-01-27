const { AuthorizationCode } = require('simple-oauth2');
const https = require('https');

async function HttpGet(token, url) {
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
					reject(res.statusCode);
				}
				try {
					resolve(JSON.parse(data.toString()));
				} catch (_) {
					reject(0);
				}
			});
		}).on('error', (_) => {
			reject(0);
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
	 * @returns User object | error number
	 */
	async getUser() {
		return await HttpGet(this._accessToken.token.access_token, "https://discord.com/api/users/@me");
	}

	/**
	 * Get member of guild
	 * 
	 * @param guildId Guild Id
	 * 
	 * @returns Guild Member object | error number
	 */
	async getMemberFromGuild(guildId) {
		return await HttpGet(this._accessToken.token.access_token, `https://discord.com/api/guilds/${guildId}/members/@me`);
	}

	/**
	 * Revokes access token
	 */
	async revokeAccess() {
		try {
			await this._accessToken.revokeAll();
		} catch (_) {}
	}
}

module.exports = class DiscordApi {

	/**
	 *
	 * @param config oauth configuration table ({id, secret})
	 * @param callback url callback which calls response(req)
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
	 * @param id state id - cross site security parameter
	 *
	 * @returns string
	 */
	createRequest(id) {
		return this._client.authorizeURL({
			state: id,
			...this._header,
		});
	}

	/**
	 * Gets access token from authorization code
	 *
	 * @param code code got from authorization site
	 * 
	 * @returns object { object: DiscordResource | error: object }
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
