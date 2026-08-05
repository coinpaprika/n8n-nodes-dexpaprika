import type { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

// Declarative node: every operation maps to a keyless GET on the public
// DexPaprika REST API (https://api.dexpaprika.com). Calls the keyless free tier; no credentials sent.
export class DexPaprika implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DexPaprika',
		name: 'dexPaprika',
		icon: { light: 'file:dexpaprika.svg', dark: 'file:dexpaprika.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Real-time DEX and on-chain market data across 36 blockchains: pools, token prices, OHLCV, and search. Keyless.',
		defaults: {
			name: 'DexPaprika',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		requestDefaults: {
			baseURL: 'https://api.dexpaprika.com',
			headers: {
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Token', value: 'token' },
					{ name: 'Pool', value: 'pool' },
					{ name: 'Network', value: 'network' },
				],
				default: 'token',
			},

			// ─── Token operations ────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['token'] } },
				options: [
					{
						name: 'Search',
						value: 'search',
						action: 'Search tokens pools and exchanges across all networks',
						routing: { request: { method: 'GET', url: '/search' } },
					},
					{
						name: 'Get Details',
						value: 'getDetails',
						action: 'Get price and metadata for one token',
						routing: {
							request: {
								method: 'GET',
								url: '=/networks/{{$parameter.network}}/tokens/{{$parameter.contractAddress}}',
							},
						},
					},
					{
						name: 'Get Prices (Batch)',
						value: 'getPrices',
						action: 'Get USD prices for up to 10 tokens on one network',
						routing: {
							request: {
								method: 'GET',
								url: '=/networks/{{$parameter.network}}/multi/prices',
							},
						},
					},
					{
						name: 'Get Top Tokens',
						value: 'getTop',
						action: 'Get top tokens on a network by volume',
						routing: {
							request: {
								method: 'GET',
								url: '=/networks/{{$parameter.network}}/tokens/search',
							},
						},
					},
				],
				default: 'search',
			},

			// ─── Pool operations ─────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['pool'] } },
				options: [
					{
						name: 'Get Top Pools',
						value: 'getTop',
						action: 'Get top pools on a network by volume',
						routing: {
							request: {
								method: 'GET',
								url: '=/networks/{{$parameter.network}}/pools/search',
							},
						},
					},
					{
						name: 'Get Details',
						value: 'getDetails',
						action: 'Get details for one pool',
						routing: {
							request: {
								method: 'GET',
								url: '=/networks/{{$parameter.network}}/pools/{{$parameter.poolAddress}}',
							},
						},
					},
					{
						name: 'Get OHLCV',
						value: 'getOhlcv',
						action: 'Get historical OHLCV candles for one pool',
						routing: {
							request: {
								method: 'GET',
								url: '=/networks/{{$parameter.network}}/pools/{{$parameter.poolAddress}}/ohlcv',
							},
						},
					},
				],
				default: 'getTop',
			},

			// ─── Network operations ──────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['network'] } },
				options: [
					{
						name: 'List Networks',
						value: 'list',
						action: 'List all supported blockchain networks',
						routing: { request: { method: 'GET', url: '/networks' } },
					},
					{
						name: 'List DEXes',
						value: 'listDexes',
						action: 'List exchanges on a network',
						routing: {
							request: { method: 'GET', url: '=/networks/{{$parameter.network}}/dexes' },
						},
					},
					{
						name: 'Get Stats',
						value: 'stats',
						action: 'Get platform statistics',
						routing: { request: { method: 'GET', url: '/stats' } },
					},
				],
				default: 'list',
			},

			// ─── Shared: network id ──────────────────────────────────────────
			{
				displayName: 'Network',
				name: 'network',
				type: 'string',
				default: 'ethereum',
				required: true,
				placeholder: 'ethereum',
				description: 'Network ID (e.g. \'ethereum\', \'solana\', \'base\'). List them with the Network resource.',
				displayOptions: {
					show: {
						resource: ['token', 'pool'],
					},
					hide: {
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Network',
				name: 'network',
				type: 'string',
				default: 'ethereum',
				required: true,
				placeholder: 'ethereum',
				description: 'Network ID (e.g. \'ethereum\', \'solana\', \'base\')',
				displayOptions: {
					show: {
						resource: ['network'],
						operation: ['listDexes'],
					},
				},
			},

			// ─── Token params ────────────────────────────────────────────────
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'WETH',
				description: 'Token name, symbol, or address to search for',
				displayOptions: { show: { resource: ['token'], operation: ['search'] } },
				routing: { send: { type: 'query', property: 'query' } },
			},
			{
				displayName: 'Token Address',
				name: 'contractAddress',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
				description: 'Token contract address on the given network',
				displayOptions: { show: { resource: ['token'], operation: ['getDetails'] } },
			},
			{
				displayName: 'Token Addresses',
				name: 'contractAddresses',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0xabc...,0xdef...',
				description: 'Comma-separated token addresses (up to 10) on the same network',
				displayOptions: { show: { resource: ['token'], operation: ['getPrices'] } },
				routing: { send: { type: 'query', property: 'tokens' } },
			},

			// ─── Pool params ─────────────────────────────────────────────────
			{
				displayName: 'Pool Address',
				name: 'poolAddress',
				type: 'string',
				default: '',
				required: true,
				placeholder: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
				description: 'Pool contract address on the given network',
				displayOptions: {
					show: { resource: ['pool'], operation: ['getDetails', 'getOhlcv'] },
				},
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'string',
				default: '',
				required: true,
				placeholder: '2026-01-01',
				description: 'Start of the OHLCV range (YYYY-MM-DD, RFC3339, or Unix timestamp)',
				displayOptions: { show: { resource: ['pool'], operation: ['getOhlcv'] } },
				routing: { send: { type: 'query', property: 'start' } },
			},
			{
				displayName: 'Interval',
				name: 'interval',
				type: 'options',
				default: '24h',
				options: [
					{ name: '1 Hour', value: '1h' },
					{ name: '1 Minute', value: '1m' },
					{ name: '12 Hours', value: '12h' },
					{ name: '15 Minutes', value: '15m' },
					{ name: '24 Hours', value: '24h' },
					{ name: '30 Minutes', value: '30m' },
					{ name: '5 Minutes', value: '5m' },
					{ name: '6 Hours', value: '6h' },
				],
				displayOptions: { show: { resource: ['pool'], operation: ['getOhlcv'] } },
				routing: { send: { type: 'query', property: 'interval' } },
			},

			// ─── Shared: limit (list operations) ─────────────────────────────
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 100 },
				default: 50,
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['token', 'pool'],
						operation: ['getTop', 'getOhlcv'],
					},
				},
				routing: { send: { type: 'query', property: 'limit' } },
			},
		],
	};
}
