const { AuthorizationCode } = require('simple-oauth2');
const https = require('node:https');

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
	
			let data = '';
			res.on('data', (chunk) => {
				data += chunk;
			});
	
			res.on('end', () => {
				if (res.statusCode !== 200) {
					reject(res.statusCode);
				}
				try {
					resolve(JSON.parse(data));
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

	async getUser() {
		return await HttpGet(this._accessToken.token.access_token, "https://discord.com/api/users/@me");
	}

	async revokeAccess() {
		try {
			await this._accessToken.revokeAll();
		} catch (_) {}
	}
}

module.exports = class DiscordApi {
	constructor(config, callback) {
		this._client = new AuthorizationCode({
			client: config,
			auth: {
				tokenHost: 'https://discord.com/api',
				tokenPath: '/api/oauth2/token',
				revokePath: '/api/oauth2/token/revoke',
				authorizePath: '/oauth2/authorize',
			},
			options: {
				authorizationMethod: "body",
			},
		});

		this._header = {
			scope: 'identify',
			redirect_uri: callback,
		};
	}

	createRequest(id) {
		return this._client.authorizeURL({
			state: id,
			...this._header,
		});
	}

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
}
