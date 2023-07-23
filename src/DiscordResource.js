const https = require('https');
const ResourceError = require('./ResourceError');

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
					reject(new ResourceError(res.statusCode, res.statusMessage));
				} else {
					try {
						resolve(JSON.parse(data.toString()));
					} catch (error) {
						reject(new ResourceError(res.statusCode, 'Failed to parse response', {cause: error}));
					}
				}
			});
		}).on('error', (error) => {
			reject(new ResourceError(0, 'HTTP transaction failed', {cause: error}));
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
	 * @returns object: DiscordUser
	 * @throws object: ResourceError
	 */
	async getUser() {
		return await HttpGet(this._accessToken.token.access_token, "https://discord.com/api/users/@me");
	}

	/**
	 * Get member of guild
	 * 
	 * @param guildId Guild Id
	 * 
	 * @returns object: GuildMember
	 * @throws object: ResourceError
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
	 * @returns string
	 */
	getAccessToken() {
		return _accessToken.token.access_token;
	}
}

module.exports = DiscordResource;
