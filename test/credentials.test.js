// Runs against the built dist, which is what npm actually ships, so the test
// covers the artifact rather than the source it came from.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { DexPaprikaApi } = require('../dist/credentials/DexPaprikaApi.credentials.js');
const { DexPaprika } = require('../dist/nodes/DexPaprika/DexPaprika.node.js');

const credential = new DexPaprikaApi();
const node = new DexPaprika();
const authHeader = credential.authenticate.properties.headers.Authorization;

// ── The Authorization rule ─────────────────────────────────────────────────
// The key is the entire Authorization value. Nothing goes in front of it and no
// scheme word is ever prepended. That has been re-derived wrongly three times in
// four months, so pin the expression exactly.

test('the credential sends the key as the entire Authorization value', () => {
	assert.equal(authHeader, '={{$credentials.apiKey}}');
});

test('no scheme word is baked into the header expression', () => {
	for (const scheme of ['Bearer', 'Token', 'ApiKey', 'Basic', 'Key']) {
		assert.ok(
			!new RegExp(`${scheme}\\s`, 'i').test(authHeader),
			`Authorization expression contains the scheme word ${scheme}`,
		);
	}
});

// ── Keyless stays the default ──────────────────────────────────────────────

test('the credential is optional, so existing keyless workflows keep working', () => {
	const attached = node.description.credentials ?? [];
	const entry = attached.find((c) => c.name === 'dexPaprikaApi');
	assert.ok(entry, 'the node does not offer the credential at all');
	assert.equal(entry.required, false);
});

test('the node still defaults to the keyless host', () => {
	assert.equal(node.description.requestDefaults.baseURL, 'https://api.dexpaprika.com');
});

// ── Credential test endpoint ───────────────────────────────────────────────

test('the credential test hits /usage, not a data endpoint', () => {
	// On the data endpoints a key the API cannot read is ignored rather than
	// rejected: the call returns 200 with real data while quietly serving the
	// keyless tier, so a broken key would test as working. /usage is the only
	// endpoint that reports the truth.
	assert.equal(credential.test.request.url, '/usage');
	assert.equal(credential.test.request.baseURL, 'https://api.dexpaprika.com');
});

// ── Shape ──────────────────────────────────────────────────────────────────

test('the key field is masked in the UI', () => {
	const field = credential.properties.find((p) => p.name === 'apiKey');
	assert.ok(field, 'no apiKey property');
	assert.equal(field.typeOptions.password, true);
});

test('the credential name matches what the node asks for', () => {
	const entry = node.description.credentials.find((c) => c.name === credential.name);
	assert.ok(entry, `node asks for a credential named other than ${credential.name}`);
});
