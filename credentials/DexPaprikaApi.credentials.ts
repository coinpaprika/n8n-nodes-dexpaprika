import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Optional DexPaprika API key.
 *
 * The node works without this credential: DexPaprika serves a keyless free tier
 * that needs no signup. Attaching a key raises the credit allowance, doubles the
 * per-minute limit from 15 to 30, and opens streaming on any token. An earlier
 * version of this comment said a key did not raise the per-minute limit, which
 * was built on a keyless figure of 30 that was never right.
 */
export class DexPaprikaApi implements ICredentialType {
	name = 'dexPaprikaApi';

	displayName = 'DexPaprika API';

	// Same pair the node uses, copied rather than referenced across directories
	// because the build resolves `file:` relative to the class that declares it.
	icon: Icon = { light: 'file:dexpaprika.svg', dark: 'file:dexpaprika.dark.svg' };

	documentationUrl = 'https://docs.dexpaprika.com/knowledge-base/rate-limits';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Paste the key exactly as issued, with no prefix. Get one free at console.dexpaprika.com. The node also works with no credential at all.',
		},
	];

	/**
	 * The key is the ENTIRE Authorization value.
	 *
	 * There is no `Bearer` prefix and no other scheme word: the API checksums the
	 * raw header, so a scheme word returns 401. This is the single most common
	 * reason a working key looks broken, which is why the expression below is
	 * bare and must stay that way.
	 */
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.apiKey}}',
			},
		},
	};

	/**
	 * Tests against /usage rather than a data endpoint, deliberately.
	 *
	 * On the data endpoints a key the API cannot read is ignored rather than
	 * rejected: the call returns 200 with real data while quietly serving the
	 * keyless tier, so a broken key would test as working. /usage is the only
	 * endpoint that reports the truth.
	 */
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.dexpaprika.com',
			url: '/usage',
		},
	};
}
