// Get Token OHLCV fields, checked on the built dist like the pool OHLCV tests.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { DexPaprika } = require('../dist/nodes/DexPaprika/DexPaprika.node.js');

const node = new DexPaprika();
const properties = node.description.properties;
const shownFor = (operation) =>
	properties.filter((p) => p.displayOptions?.show?.operation?.includes(operation));
const field = (name) => {
	const matches = shownFor('getTokenOhlcv').filter((p) => p.name === name);
	assert.equal(matches.length, 1, `expected exactly one ${name} field on Get Token OHLCV`);
	return matches[0];
};

const tokenOperations = properties.find(
	(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('token'),
).options;
const tokenOhlcv = tokenOperations.find((o) => o.value === 'getTokenOhlcv');

// ── The operation exists and points at the right endpoint ──────────────────

test('the Token resource offers Get Token OHLCV', () => {
	assert.ok(tokenOhlcv, 'no getTokenOhlcv option on the token operation list');
});

test('it calls /networks/{network}/tokens/{address}/ohlcv, not the pool endpoint', () => {
	assert.equal(
		tokenOhlcv.routing.request.url,
		'=/networks/{{$parameter.network}}/tokens/{{$parameter.contractAddress}}/ohlcv',
	);
});

test('there is no Inversed field anywhere on Get Token OHLCV', () => {
	const names = shownFor('getTokenOhlcv').map((p) => p.name.toLowerCase());
	assert.ok(!names.includes('inversed'), 'an Inversed field leaked onto Get Token OHLCV');
});

// ── It needs a paid plan and the paid host ──────────────────────────────────

test('the operation description names the plan requirement and the paid host', () => {
	assert.match(tokenOhlcv.description, /Dev, Pro or Enterprise/);
	assert.match(tokenOhlcv.description, /https:\/\/api-pro\.dexpaprika\.com/);
});

test('a notice on the operation repeats the plan and host requirement', () => {
	const notice = properties.find(
		(p) =>
			p.type === 'notice' &&
			p.displayOptions?.show?.resource?.includes('token') &&
			p.displayOptions?.show?.operation?.includes('getTokenOhlcv'),
	);
	assert.ok(notice, 'no notice callout on Get Token OHLCV');
	assert.match(notice.displayName, /Dev, Pro or Enterprise/);
	assert.match(notice.displayName, /https:\/\/api-pro\.dexpaprika\.com/);
});

// n8n's declarative routing reads an `authentication` parameter to pick a
// credential whenever the node lists more than one. This node has no such
// parameter, so a second entry would break every operation, not just this one.
test('the node keeps exactly one optional credential entry', () => {
	assert.equal(node.description.credentials.length, 1);
	assert.equal(node.description.credentials[0].name, 'dexPaprikaApi');
	assert.equal(node.description.credentials[0].required, false);
});

test('this operation alone calls the paid host; the node default stays keyless', () => {
	assert.equal(tokenOhlcv.routing.request.baseURL, 'https://api-pro.dexpaprika.com');
	assert.equal(node.description.requestDefaults.baseURL, 'https://api.dexpaprika.com');
});

// ── No em dash, en dash, or "Bearer" leaked into the new copy ───────────────

test('the new copy has no em dash, en dash, or Bearer', () => {
	const strings = [
		tokenOhlcv.description,
		...shownFor('getTokenOhlcv').flatMap((p) => [p.displayName, p.description]),
	].filter(Boolean);
	for (const s of strings) {
		assert.ok(!s.includes('—'), `em dash found in: ${s}`);
		assert.ok(!s.includes('–'), `en dash found in: ${s}`);
		assert.ok(!/bearer/i.test(s), `the word Bearer found in: ${s}`);
	}
});

// ── Fields mirror the pool OHLCV shape ──────────────────────────────────────

test('every interval the API accepts is offered, matching the pool operation', () => {
	const values = field('interval').options.map((o) => o.value).sort();
	assert.deepEqual(values, ['10m', '12h', '15m', '1h', '1m', '24h', '30m', '5m', '6h']);
});

test('start defaults to -24h and is sent as a query parameter', () => {
	const start = field('start');
	assert.equal(start.default, '-24h');
	assert.equal(start.required, true);
	assert.deepEqual(start.routing.send, { type: 'query', property: 'start' });
});

test('end is optional and sent as a query parameter', () => {
	const end = field('end');
	assert.equal(end.default, '');
	assert.ok(!end.required, 'End should not be required');
	assert.deepEqual(end.routing.send, { type: 'query', property: 'end' });
});

test('limit goes up to 1000, same ceiling as the pool operation', () => {
	const limit = field('limit');
	assert.equal(limit.typeOptions.maxValue, 1000);
	assert.deepEqual(limit.routing.send, { type: 'query', property: 'limit' });
});

test('the token address field is shown on Get Token OHLCV', () => {
	const addressField = properties.find(
		(p) =>
			p.name === 'contractAddress' &&
			p.displayOptions?.show?.operation?.includes('getTokenOhlcv'),
	);
	assert.ok(addressField, 'contractAddress is not shown for getTokenOhlcv');
});
