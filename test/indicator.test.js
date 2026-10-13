// Get Indicator fields, checked on the built dist like the other operation tests.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { DexPaprika } = require('../dist/nodes/DexPaprika/DexPaprika.node.js');

const node = new DexPaprika();
const properties = node.description.properties;
const shownFor = (operation) =>
	properties.filter((p) => p.displayOptions?.show?.operation?.includes(operation));
const field = (name) => {
	const matches = shownFor('getIndicator').filter((p) => p.name === name);
	assert.equal(matches.length, 1, `expected exactly one ${name} field on Get Indicator`);
	return matches[0];
};

const tokenOperations = properties.find(
	(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('token'),
).options;
const poolOperations = properties.find(
	(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('pool'),
).options;
const tokenIndicator = tokenOperations.find((o) => o.value === 'getIndicator');
const poolIndicator = poolOperations.find((o) => o.value === 'getIndicator');

// ── The operation exists on both resources and points at the right endpoint ─

test('the Token resource offers Get Indicator', () => {
	assert.ok(tokenIndicator, 'no getIndicator option on the token operation list');
});

test('the Pool resource offers Get Indicator', () => {
	assert.ok(poolIndicator, 'no getIndicator option on the pool operation list');
});

test('the token operation calls /networks/{network}/tokens/{address}/indicators', () => {
	assert.equal(
		tokenIndicator.routing.request.url,
		'=/networks/{{$parameter.network}}/tokens/{{$parameter.contractAddress}}/indicators',
	);
});

test('the pool operation calls /networks/{network}/pools/{address}/indicators', () => {
	assert.equal(
		poolIndicator.routing.request.url,
		'=/networks/{{$parameter.network}}/pools/{{$parameter.poolAddress}}/indicators',
	);
});

// ── Token Get Indicator needs a paid plan and the paid host; Pool does not ──

test('the token operation description names the plan requirement and the paid host', () => {
	assert.match(tokenIndicator.description, /Dev, Pro or Enterprise/);
	assert.match(tokenIndicator.description, /https:\/\/api-pro\.dexpaprika\.com/);
});

test('a notice on the token operation repeats the plan and host requirement', () => {
	const notice = properties.find(
		(p) =>
			p.type === 'notice' &&
			p.displayOptions?.show?.resource?.includes('token') &&
			p.displayOptions?.show?.operation?.includes('getIndicator'),
	);
	assert.ok(notice, 'no notice callout on the token Get Indicator operation');
	assert.match(notice.displayName, /Dev, Pro or Enterprise/);
	assert.match(notice.displayName, /https:\/\/api-pro\.dexpaprika\.com/);
});

test('the token operation alone calls the paid host; the node default stays keyless', () => {
	assert.equal(tokenIndicator.routing.request.baseURL, 'https://api-pro.dexpaprika.com');
	assert.equal(node.description.requestDefaults.baseURL, 'https://api.dexpaprika.com');
});

test('the pool operation does not override the base URL, unlike the token operation', () => {
	assert.equal(poolIndicator.routing.request.baseURL, undefined);
});

test('no notice callout exists for the pool Get Indicator operation', () => {
	const notice = properties.find(
		(p) =>
			p.type === 'notice' &&
			p.displayOptions?.show?.resource?.includes('pool') &&
			p.displayOptions?.show?.operation?.includes('getIndicator'),
	);
	assert.equal(notice, undefined, 'pool Get Indicator should not need a plan notice');
});

// ── Shared Indicator and Interval fields ────────────────────────────────────

test('the Indicator field offers exactly the five supported indicators and is required', () => {
	const indicator = field('indicator');
	assert.equal(indicator.required, true);
	assert.deepEqual(
		indicator.options.map((o) => o.value).sort(),
		['bbands', 'ema', 'macd', 'rsi', 'vwap'],
	);
	assert.deepEqual(indicator.routing.send, { type: 'query', property: 'indicator' });
});

test('the Indicator field is shown for Get Indicator on both Token and Pool', () => {
	const indicator = field('indicator');
	assert.deepEqual(indicator.displayOptions.show.resource.sort(), ['pool', 'token']);
});

test('the Interval field is optional and defaults to Server Default, not a hard-coded interval', () => {
	const interval = field('interval');
	assert.equal(interval.default, '');
	assert.ok(!interval.required, 'Interval should not be required on Get Indicator');
	assert.deepEqual(interval.routing.send, { type: 'query', property: 'interval' });
	const values = interval.options.map((o) => o.value).sort();
	assert.deepEqual(values, ['', '10m', '12h', '15m', '1d', '1h', '1m', '24h', '30m', '5m', '6h']);
});

test('the token address field is shown on the token Get Indicator operation', () => {
	const addressField = properties.find(
		(p) =>
			p.name === 'contractAddress' &&
			p.displayOptions?.show?.operation?.includes('getIndicator'),
	);
	assert.ok(addressField, 'contractAddress is not shown for getIndicator');
});

test('the pool address field is shown on the pool Get Indicator operation', () => {
	const addressField = properties.find(
		(p) => p.name === 'poolAddress' && p.displayOptions?.show?.operation?.includes('getIndicator'),
	);
	assert.ok(addressField, 'poolAddress is not shown for getIndicator');
});

// ── Additional Fields collection: sent only when set ────────────────────────

const additionalFields = () => field('additionalFields');

test('Additional Fields is a collection, so unset options are never sent', () => {
	const collection = additionalFields();
	assert.equal(collection.type, 'collection');
	assert.deepEqual(collection.default, {});
});

const collectionOption = (name) => {
	const option = additionalFields().options.find((o) => o.name === name);
	assert.ok(option, `no ${name} option on Additional Fields`);
	return option;
};

test('Limit, Start, End and Cursor have no per-indicator display condition', () => {
	for (const name of ['limit', 'start', 'end', 'cursor']) {
		const option = collectionOption(name);
		assert.equal(option.displayOptions, undefined, `${name} should show for every indicator`);
	}
});

test('Period shows only for rsi, ema, bbands and vwap, never macd', () => {
	const period = collectionOption('period');
	assert.deepEqual(period.displayOptions.show['/indicator'].sort(), [
		'bbands',
		'ema',
		'rsi',
		'vwap',
	]);
});

test('Fast Period, Slow Period and Signal Period show only for macd', () => {
	for (const name of ['fast_period', 'slow_period', 'signal_period']) {
		const option = collectionOption(name);
		assert.deepEqual(option.displayOptions.show['/indicator'], ['macd']);
	}
});

test('Standard Deviation shows only for bbands', () => {
	const stdDev = collectionOption('std_dev');
	assert.deepEqual(stdDev.displayOptions.show['/indicator'], ['bbands']);
});

test('every Additional Fields option is routed as a query string parameter, by its own name', () => {
	const names = [
		'limit',
		'start',
		'end',
		'cursor',
		'period',
		'fast_period',
		'slow_period',
		'signal_period',
		'std_dev',
	];
	for (const name of names) {
		const option = collectionOption(name);
		assert.deepEqual(option.routing.request.qs, { [name]: '={{$value}}' });
	}
});
