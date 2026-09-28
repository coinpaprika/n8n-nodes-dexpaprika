// Get OHLCV fields, checked on the built dist like the credential tests.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { DexPaprika } = require('../dist/nodes/DexPaprika/DexPaprika.node.js');

const properties = new DexPaprika().description.properties;
const shownFor = (operation) =>
	properties.filter((p) => p.displayOptions?.show?.operation?.includes(operation));
const ohlcvField = (name) => {
	const matches = shownFor('getOhlcv').filter((p) => p.name === name);
	assert.equal(matches.length, 1, `expected exactly one ${name} field on Get OHLCV`);
	return matches[0];
};

test('every interval the API accepts is offered, 10m included', () => {
	const values = ohlcvField('interval').options.map((o) => o.value).sort();
	assert.deepEqual(values, ['10m', '12h', '15m', '1h', '1m', '24h', '30m', '5m', '6h']);
});

test('start defaults to the last 24 hours, which works without a credential', () => {
	const start = ohlcvField('start');
	assert.equal(start.default, '-24h');
	assert.deepEqual(start.routing.send, { type: 'query', property: 'start' });
});

test('OHLCV takes up to 1000 candles while top lists stay at 100', () => {
	const limit = ohlcvField('limit');
	assert.equal(limit.typeOptions.maxValue, 1000);
	assert.deepEqual(limit.routing.send, { type: 'query', property: 'limit' });

	const topLimit = shownFor('getTop').filter((p) => p.name === 'limit');
	assert.equal(topLimit.length, 1);
	assert.equal(topLimit[0].typeOptions.maxValue, 100);
});
