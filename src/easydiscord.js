import crypto from 'crypto';
import DiscordApi from './discordapi';

function compareSafe(object, other) {
	if (typeof(object) !== 'string' || typeof(other) !== 'string') {
		return false;
	}

	if (object.length === 0 || other.length === 0) {
		return false;
	}

	let buff1 = Buffer.from(object);
	let buff2 = Buffer.from(other);

	let value = true;
	if (buff1.length != buff2.length) {
		value = false;
		buff2 = buff1;
	}

	let value2 = crypto.timingSafeEqual(buff1, buff2);
	return value && value2;
}

class NewEasyDiscord {
	/**
	 * @param config configuration object ({id, secret})
	 * @param callback authorization calllback
	 * @param scopes scopes used in authorization
	 *
	 */
	constructor(config, callback, scopes) {
		this._discord = new DiscordApi(config, callback, scopes);
	}

	/**
	 * Redirect to Discord authorization site
	 *
	 * @param requestId unique request ID (do NOT use session ID)
	 * @param res Express.Response | object { redirect(url: string) => any }
	 *
	 * @returns void
	 */
	request(requestId, res) {
		res.redirect(this._discord.createRequest(requestId));
	}

	/**
	 * Process response from Discord authorization site
	 * Returns access token wrapped in DiscordResource
	 *
	 * @param query deserialized GET query
	 * @param requestId unique request ID, previously used in request() (do NOT use session ID)
	 *
	 * @returns object {resource?: DiscordResource, error?: any, cancel_by_user: boolean}
	 */
	async response(query, requestId) {
		const { code, state, error, error_description } = query;

		const result = {
			resource: null,
			error: null,
			cancel_by_user: false,
		};

		if (!compareSafe(requestId, state)) {
			return result;
		}

		if (error != null) {
			result.error = {error, error_description};
			result.cancel_by_user = error === 'access_denied';
		} else if (code != null) {
			const response = await this._discord.continueRequest(code);
			if (response.object != null) {
				result.resource = response.object;
			} else {
				result.error = response.error;
			}
		}
		
		return result;
	}
}

export default NewEasyDiscord;
