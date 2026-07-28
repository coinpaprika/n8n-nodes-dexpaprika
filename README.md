# n8n-nodes-dexpaprika

[![npm version](https://img.shields.io/npm/v/n8n-nodes-dexpaprika)](https://www.npmjs.com/package/n8n-nodes-dexpaprika)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An [n8n](https://n8n.io) community node for [DexPaprika](https://dexpaprika.com): keyless, real-time DEX and on-chain market data across 36 blockchains. No API key, no signup.

The node works as a normal n8n node and as an [AI Agent tool](https://docs.n8n.io/advanced-ai/), so your AI Agent can query live DeFi data directly.

## Installation

In n8n, go to **Settings > Community Nodes > Install**, enter `n8n-nodes-dexpaprika`, and confirm. See the [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/installation/) for details.

## Operations

**Token**
- **Search** - find tokens, pools, and DEXes across all networks by name, symbol, or address
- **Get Details** - price and metadata for one token on one network
- **Get Prices (Batch)** - USD prices for up to 10 tokens on the same network
- **Get Top Tokens** - top tokens on a network by volume

**Pool**
- **Get Top Pools** - top pools on a network by volume
- **Get Details** - full details for one pool
- **Get OHLCV** - historical candles for one pool (1m to 24h intervals)

**Network**
- **List Networks** - every supported blockchain network
- **List DEXes** - DEXes on a network
- **Get Stats** - platform-wide totals (chains, DEXes, pools, tokens)

## Credentials

None. The DexPaprika API is keyless for public read access. A free registered key or Pro plan raises your rate and monthly quota; see the [rate limits](https://docs.dexpaprika.com/knowledge-base/rate-limits).

## Resources

- [DexPaprika in n8n](https://docs.dexpaprika.com/ai-integration/n8n)
- [DexPaprika API docs](https://docs.dexpaprika.com)

## License

[MIT](LICENSE)
