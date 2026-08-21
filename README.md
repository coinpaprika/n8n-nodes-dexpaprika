# n8n-nodes-dexpaprika

[![npm version](https://img.shields.io/npm/v/n8n-nodes-dexpaprika)](https://www.npmjs.com/package/n8n-nodes-dexpaprika)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An [n8n](https://n8n.io) community node for [DexPaprika](https://dexpaprika.com): keyless DEX and on-chain market data across 36 blockchains. No API key and no signup to start.

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

## Example

**As a normal node.** Add the **DexPaprika** node, set Resource to **Pool** and Operation to **Get Top Pools**, and Network to `base`. Run it, and the node returns the top pools on Base by 24h volume, ready to pass to any downstream node (a message, a spreadsheet, a database).

**As an AI Agent tool.** Wire the DexPaprika node into an **AI Agent** node's **Tool** input and prompt the agent with something like "What are the top 5 pools on Base by 24h volume, and what is WETH trading at on Ethereum?" The agent picks the right operations, fills in the parameters, and returns live results.

## Credentials

**Optional.** The node works with no credential attached and always will: DexPaprika serves a keyless free tier for public read access, with data delayed up to 15 seconds. Current rates and quotas are on [the rate limits page](https://docs.dexpaprika.com/knowledge-base/rate-limits). Existing workflows need no change.

Attaching a **DexPaprika API** credential raises the monthly credit allowance. It does **not** raise the per-minute limit, which is the same on both free tiers, so attach one if you are running out of monthly credits rather than hitting rate limits. Pro is $99 per month at 300 per minute with real-time data. Current quotas are on the [pricing page](https://dexpaprika.com/api/pricing) and the mechanics are in the [rate limits](https://docs.dexpaprika.com/knowledge-base/rate-limits) docs.

Get a free key at [console.dexpaprika.com](https://console.dexpaprika.com) and paste it exactly as issued. **There is no `Bearer` prefix**: the node sends the key as the entire `Authorization` value, which is what the API expects.

Use the credential's **Test** button to confirm it works. It checks `/usage`, deliberately: on the data endpoints a key the API cannot read is ignored rather than rejected, so the call returns `200` with real data while quietly serving you the keyless tier. `/usage` is the only endpoint that reports the truth.

## Resources

- [DexPaprika in n8n](https://docs.dexpaprika.com/ai-integration/n8n)
- [DexPaprika API docs](https://docs.dexpaprika.com)

## License

[MIT](LICENSE)
