import crypto from 'crypto';
import DiscordApi from './discordapi';
import AuthorizationError from './AuthorizationError';

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
	 * @param id client id
	 * @param secret client secret
	 * @param callback authorization callback
	 * @param scopes scopes used in authorization
	 */
	constructor(id, secret, callback, scopes) {
		this._discord = new DiscordApi(id, secret, callback, scopes);
	}

	/**
	 * Redirect to Discord authorization site
	 *
	 * @param requestId string - unique request ID (do NOT use session ID)
	 * @param res Express.Response | { redirect(url: string) => void }
	 */
	request(requestId, res) {
		res.redirect(this._discord.createRequest(requestId));
	}

	/**
	 * Process response from Discord authorization site
	 * Returns access token wrapped in DiscordResource
	 * Do NOT use session ID
	 *
	 * @param query object - deserialized GET query
	 * @param requestId string - unique request ID, previously used in request() (do NOT use session ID)
	 *
	 * @returns object {resource?: DiscordResource, error?: Error, cancelled: boolean} | null
	 */
	async response(query, requestId) {
		const { code, state, error, error_description } = query;

		if (!compareSafe(requestId, state)) {
			return null;
		}

		const result = {
			resource: null,
			error: null,
			cancelled: false,
		};

		if (error != null) {
			result.error = new AuthorizationError(error, error_description);
			result.cancelled = error === 'access_denied';
		} else if (code != null) {
			try {
				result.resource = await this._discord.continueRequest(code);
			} catch (error) {
				result.error = error;
			}
		} else {
			return null;
		}
		
		return result;
	}
}

export default NewEasyDiscord;
