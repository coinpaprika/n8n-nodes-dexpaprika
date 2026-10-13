import type { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

// Declarative node: every operation maps to a GET on the public DexPaprika REST
// API (https://api.dexpaprika.com). Keyless by default and no credential is
// required; attaching one raises the credit allowance and the per-minute limit.
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
		// Optional on purpose. Without a credential the node behaves exactly as
		// before, calling the keyless free tier, so existing workflows are
		// untouched by this addition.
		credentials: [
			{
				name: 'dexPaprikaApi',
				required: false,
			},
		],
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
						name: 'Get Indicator',
						value: 'getIndicator',
						action: 'Get a technical indicator for one token',
						description:
							'RSI, EMA, MACD, Bollinger Bands or VWAP for one token, aggregated the same way as Get Token OHLCV. Needs a Dev, Pro or Enterprise plan on https://api-pro.dexpaprika.com.',
						routing: {
							request: {
								method: 'GET',
								// Same reasoning as Get Token OHLCV: no plan below Dev can call
								// this endpoint at all, so the host is fixed rather than configured.
								baseURL: 'https://api-pro.dexpaprika.com',
								url: '=/networks/{{$parameter.network}}/tokens/{{$parameter.contractAddress}}/indicators',
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
						name: 'Get Token OHLCV',
						value: 'getTokenOhlcv',
						action: 'Get historical OHLCV candles for one token',
						description:
							'USD candles built from a volume-weighted price across every pool the token trades in on that network. Needs a Dev, Pro or Enterprise plan on https://api-pro.dexpaprika.com.',
						routing: {
							request: {
								method: 'GET',
								// Dev, Pro and Enterprise all use this host, and no other plan
								// can call the endpoint, so it is fixed rather than configured.
								baseURL: 'https://api-pro.dexpaprika.com',
								url: '=/networks/{{$parameter.network}}/tokens/{{$parameter.contractAddress}}/ohlcv',
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
					{
						name: 'Search',
						value: 'search',
						action: 'Search tokens pools and exchanges across all networks',
						routing: { request: { method: 'GET', url: '/search' } },
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
					{
						name: 'Get Indicator',
						value: 'getIndicator',
						action: 'Get a technical indicator for one pool',
						description:
							'RSI, EMA, MACD, Bollinger Bands or VWAP over the candles for one pool. Available on every plan; interval and history depend on plan the same way as Get OHLCV. See https://docs.dexpaprika.com/knowledge-base/rate-limits.',
						routing: {
							request: {
								method: 'GET',
								url: '=/networks/{{$parameter.network}}/pools/{{$parameter.poolAddress}}/indicators',
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
				displayOptions: {
					show: { resource: ['token'], operation: ['getDetails', 'getTokenOhlcv', 'getIndicator'] },
				},
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
			{
				displayName:
					'Get Token OHLCV needs a Dev, Pro or Enterprise plan. Attach the DexPaprika API credential with a key from one of those plans; this operation calls https://api-pro.dexpaprika.com.',
				name: 'tokenOhlcvPlanNotice',
				type: 'notice',
				default: '',
				displayOptions: { show: { resource: ['token'], operation: ['getTokenOhlcv'] } },
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'string',
				default: '-24h',
				required: true,
				placeholder: '-24h',
				description:
					'Start of the OHLCV range. An offset back from now is simplest: -24h, -7d, -90m. Also YYYY-MM-DD, RFC3339, or Unix timestamp. Needs a Dev, Pro or Enterprise plan; Dev history reaches back 30 days.',
				displayOptions: { show: { resource: ['token'], operation: ['getTokenOhlcv'] } },
				routing: { send: { type: 'query', property: 'start' } },
			},
			{
				displayName: 'End',
				name: 'end',
				type: 'string',
				default: '',
				placeholder: '-1h',
				description: 'End of the OHLCV range, same formats as Start. Leave blank for now.',
				displayOptions: { show: { resource: ['token'], operation: ['getTokenOhlcv'] } },
				routing: { send: { type: 'query', property: 'end' } },
			},
			{
				displayName: 'Interval',
				name: 'interval',
				type: 'options',
				default: '24h',
				options: [
					{ name: '1 Hour', value: '1h' },
					{ name: '1 Minute', value: '1m' },
					{ name: '10 Minutes', value: '10m' },
					{ name: '12 Hours', value: '12h' },
					{ name: '15 Minutes', value: '15m' },
					{ name: '24 Hours', value: '24h' },
					{ name: '30 Minutes', value: '30m' },
					{ name: '5 Minutes', value: '5m' },
					{ name: '6 Hours', value: '6h' },
				],
				description: 'Candle size',
				displayOptions: { show: { resource: ['token'], operation: ['getTokenOhlcv'] } },
				routing: { send: { type: 'query', property: 'interval' } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 1000 },
				default: 50,
				description: 'Max number of results to return',
				displayOptions: { show: { resource: ['token'], operation: ['getTokenOhlcv'] } },
				routing: { send: { type: 'query', property: 'limit' } },
			},
			{
				displayName:
					'Get Indicator on a token needs a Dev, Pro or Enterprise plan. Attach the DexPaprika API credential with a key from one of those plans; this operation calls https://api-pro.dexpaprika.com.',
				name: 'tokenIndicatorPlanNotice',
				type: 'notice',
				default: '',
				displayOptions: { show: { resource: ['token'], operation: ['getIndicator'] } },
			},

			// ─── Shared: indicator params (Token and Pool Get Indicator) ───────
			{
				displayName: 'Indicator',
				name: 'indicator',
				type: 'options',
				noDataExpression: true,
				required: true,
				options: [
					{ name: 'Bollinger Bands', value: 'bbands' },
					{ name: 'EMA', value: 'ema' },
					{ name: 'MACD', value: 'macd' },
					{ name: 'RSI', value: 'rsi' },
					{ name: 'VWAP', value: 'vwap' },
				],
				default: 'rsi',
				description: 'The technical indicator to compute over the candles',
				displayOptions: { show: { resource: ['token', 'pool'], operation: ['getIndicator'] } },
				routing: { send: { type: 'query', property: 'indicator' } },
			},
			{
				displayName: 'Interval',
				name: 'interval',
				type: 'options',
				default: '',
				options: [
					{ name: '1 Day', value: '1d' },
					{ name: '1 Hour', value: '1h' },
					{ name: '1 Minute', value: '1m' },
					{ name: '10 Minutes', value: '10m' },
					{ name: '12 Hours', value: '12h' },
					{ name: '15 Minutes', value: '15m' },
					{ name: '24 Hours', value: '24h' },
					{ name: '30 Minutes', value: '30m' },
					{ name: '5 Minutes', value: '5m' },
					{ name: '6 Hours', value: '6h' },
					{ name: 'Server Default', value: '' },
				],
				description:
					'Candle size. Leave at Server Default to let the API choose: 24 hours normally, or 1 hour for a pool indicator called without a credential. Availability depends on plan, the same as Get OHLCV.',
				displayOptions: { show: { resource: ['token', 'pool'], operation: ['getIndicator'] } },
				routing: { send: { type: 'query', property: 'interval' } },
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['token', 'pool'], operation: ['getIndicator'] } },
				options: [
					{
						displayName: 'Cursor',
						name: 'cursor',
						type: 'string',
						default: '',
						description:
							'The next_cursor value from a previous response, for paging forward. Do not combine with Start.',
						routing: { request: { qs: { cursor: '={{$value}}' } } },
					},
					{
						displayName: 'End',
						name: 'end',
						type: 'string',
						default: '',
						placeholder: '-1h',
						description: 'Exclusive end of the range, same formats as Start. Leave blank for now.',
						routing: { request: { qs: { end: '={{$value}}' } } },
					},
					{
						displayName: 'Fast Period',
						name: 'fast_period',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 200 },
						default: 12,
						description: 'MACD fast EMA length. MACD only.',
						displayOptions: { show: { '/indicator': ['macd'] } },
						routing: { request: { qs: { fast_period: '={{$value}}' } } },
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 1000 },
						default: 50,
						description: 'Max number of results to return',
						routing: { request: { qs: { limit: '={{$value}}' } } },
					},
					{
						displayName: 'Period',
						name: 'period',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 200 },
						default: 14,
						description:
							'Lookback length. Defaults to 14 for RSI and VWAP, 20 for EMA and Bollinger Bands, when left unset. Not used by MACD.',
						displayOptions: { show: { '/indicator': ['rsi', 'ema', 'bbands', 'vwap'] } },
						routing: { request: { qs: { period: '={{$value}}' } } },
					},
					{
						displayName: 'Signal Period',
						name: 'signal_period',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 200 },
						default: 9,
						description: 'MACD signal line length. MACD only.',
						displayOptions: { show: { '/indicator': ['macd'] } },
						routing: { request: { qs: { signal_period: '={{$value}}' } } },
					},
					{
						displayName: 'Slow Period',
						name: 'slow_period',
						type: 'number',
						typeOptions: { minValue: 2, maxValue: 200 },
						default: 26,
						description: 'MACD slow EMA length, must be greater than Fast Period. MACD only.',
						displayOptions: { show: { '/indicator': ['macd'] } },
						routing: { request: { qs: { slow_period: '={{$value}}' } } },
					},
					{
						displayName: 'Standard Deviation',
						name: 'std_dev',
						type: 'number',
						typeOptions: { minValue: 0.1, maxValue: 10, numberPrecision: 2 },
						default: 2,
						description:
							'Bollinger Bands width in standard deviations, greater than 0 and up to 10. Bollinger Bands only.',
						displayOptions: { show: { '/indicator': ['bbands'] } },
						routing: { request: { qs: { std_dev: '={{$value}}' } } },
					},
					{
						displayName: 'Start',
						name: 'start',
						type: 'string',
						default: '',
						placeholder: '-6h',
						description:
							'First candle of the range. An offset back from now is simplest: -6h, -24h, -7d. Also YYYY-MM-DD, RFC3339, or Unix timestamp.',
						routing: { request: { qs: { start: '={{$value}}' } } },
					},
				],
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
					show: { resource: ['pool'], operation: ['getDetails', 'getOhlcv', 'getIndicator'] },
				},
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'string',
				default: '-24h',
				required: true,
				placeholder: '-24h',
				description:
					'Start of the OHLCV range. An offset back from now is simplest: -24h, -7d, -90m. Also YYYY-MM-DD, RFC3339, or Unix timestamp. Without a credential only the last 24 hours are available; a free key opens 7 days.',
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
					{ name: '10 Minutes', value: '10m' },
					{ name: '12 Hours', value: '12h' },
					{ name: '15 Minutes', value: '15m' },
					{ name: '24 Hours', value: '24h' },
					{ name: '30 Minutes', value: '30m' },
					{ name: '5 Minutes', value: '5m' },
					{ name: '6 Hours', value: '6h' },
				],
				description:
					'Candle size. Without a credential 1 hour and longer; a free key opens 10 minutes and longer; 1 and 5 minutes need a paid plan.',
				displayOptions: { show: { resource: ['pool'], operation: ['getOhlcv'] } },
				routing: { send: { type: 'query', property: 'interval' } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 1000 },
				default: 50,
				description: 'Max number of results to return',
				displayOptions: { show: { resource: ['pool'], operation: ['getOhlcv'] } },
				routing: { send: { type: 'query', property: 'limit' } },
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
						operation: ['getTop'],
					},
				},
				routing: { send: { type: 'query', property: 'limit' } },
			},
		],
	};
}
