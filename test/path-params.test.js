// Values that end up in the request path, checked on the built dist.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { DexPaprika } = require('../dist/nodes/DexPaprika/DexPaprika.node.js');

const properties = new DexPaprika().description.properties;

// Run a field's preSend hooks the way n8n's routing does, with only the
// parameter lookup and the node reference it needs.
async function runPreSend(property, value) {
	const ctx = {
		getNodeParameter: (name, fallback) => (name === property.name ? value : fallback),
		getNode: () => ({ name: 'DexPaprika', type: 'dexPaprika' }),
	};
	let options = { url: '/x' };
	for (const hook of property.routing.send.preSend) {
		options = await hook.call(ctx, options);
	}
	return options;
}

const operationLists = properties.filter((p) => p.name === 'operation');
const pathRoutes = operationLists.flatMap((list) =>
	list.options
		.filter((o) => typeof o.routing?.request?.url === 'string')
		.map((o) => ({ resource: list.displayOptions.show.resource[0], operation: o.value, url: o.routing.request.url })),
);

test('every parameter placed into a request path is checked before sending', () => {
	let checked = 0;
	for (const route of pathRoutes) {
		for (const [, name] of route.url.matchAll(/\$parameter\.(\w+)/g)) {
			const fields = properties.filter(
				(p) =>
					p.name === name &&
					p.displayOptions?.show?.resource?.includes(route.resource) &&
					(!p.displayOptions.show.operation || p.displayOptions.show.operation.includes(route.operation)) &&
					!p.displayOptions?.hide?.operation?.includes(route.operation),
			);
			assert.equal(fields.length, 1, `${route.resource}/${route.operation}: expected one ${name} field`);
			assert.ok(
				fields[0].routing?.send?.preSend?.length,
				`${route.resource}/${route.operation}: ${name} goes into the path unchecked`,
			);
			checked++;
		}
	}
	assert.ok(checked >= 10, `only ${checked} path parameters found`);
});

const field = (name) => properties.find((p) => p.name === name && p.routing?.send?.preSend);

test('real network ids, token and pool addresses pass', async () => {
	const cases = [
		['network', 'ethereum'],
		['network', 'bob_network'],
		['contractAddress', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'],
		['contractAddress', 'So11111111111111111111111111111111111111112'],
		['contractAddress', '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'],
		['contractAddress', 'EQA-X_yo3fzzbDbJ_0bzFWKqtRuZFIRa1sJsveZJ1YpViO3r'],
		['poolAddress', '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'],
	];
	for (const [name, value] of cases) {
		const options = await runPreSend(field(name), value);
		assert.deepEqual(options, { url: '/x' }, `${name}=${value} was changed or refused`);
	}
});

test('values that would leave their path segment are refused', async () => {
	const bad = ['', '.', '..', '../../../usage', '../../../usage#', 'eth/../x', 'a\\b', 'x?limit=1', 'x#y', '%2e%2e', '..%2Fusage', 'a b', 'a\nb'];
	for (const name of ['network', 'contractAddress', 'poolAddress']) {
		for (const value of bad) {
			await assert.rejects(runPreSend(field(name), value), /must be a single id or address/, `${name}=${JSON.stringify(value)} was let through`);
		}
	}
});
