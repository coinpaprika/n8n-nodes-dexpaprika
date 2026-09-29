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
- **Get Token OHLCV** - historical USD candles for one token, volume-weighted across every pool it trades in on that network (1m to 24h intervals, up to 1000 candles). Needs the credential with a Dev, Pro or Enterprise key; the operation calls `https://api-pro.dexpaprika.com` on its own. Plans are on the [pricing page](https://dexpaprika.com/api/pricing). See [Get OHLCV data for a token](https://docs.dexpaprika.com/api-reference/tokens/get-ohlcv-data-for-a-token).

**Pool**
- **Get Top Pools** - top pools on a network by volume
- **Get Details** - full details for one pool
- **Get OHLCV** - historical candles for one pool (1m to 24h intervals, up to 1000 candles). Start accepts an offset such as `-24h`. History depends on your plan: without a credential the last 24 hours at 1h and longer, a free key 7 days at 10m and longer, Dev 30 days at every interval, Pro with no plan limit on history. See [OHLCV limits by plan](https://docs.dexpaprika.com/knowledge-base/rate-limits#ohlcv-limits-by-plan).

**Network**
- **List Networks** - every supported blockchain network
- **List DEXes** - DEXes on a network
- **Get Stats** - platform-wide totals (chains, DEXes, pools, tokens)

## Example

**As a normal node.** Add the **DexPaprika** node, set Resource to **Pool** and Operation to **Get Top Pools**, and Network to `base`. Run it, and the node returns the top pools on Base by 24h volume, ready to pass to any downstream node (a message, a spreadsheet, a database).

**As an AI Agent tool.** Wire the DexPaprika node into an **AI Agent** node's **Tool** input and prompt the agent with something like "What are the top 5 pools on Base by 24h volume, and what is WETH trading at on Ethereum?" The agent picks the right operations, fills in the parameters, and returns live results.

## Credentials

**Optional.** The node works with no credential attached: DexPaprika serves a keyless free tier for public read access, with data delayed up to 60 seconds. Current rates and quotas are on [the rate limits page](https://docs.dexpaprika.com/knowledge-base/rate-limits). Existing workflows need no change.

Attaching a **DexPaprika API** credential raises both the credit allowance and the per-minute limit: keyless runs at 15 requests a minute and a registered key at 30, so attach one when you hit either ceiling. It also opens 7 days of OHLCV history at 10-minute candles and longer. Paid plans serve real-time data: Dev is $30 per month at 120 a minute and Pro $99 at 500. Current quotas are on the [pricing page](https://dexpaprika.com/api/pricing) and the mechanics are in the [rate limits](https://docs.dexpaprika.com/knowledge-base/rate-limits) docs.

Get a free key at [console.dexpaprika.com](https://console.dexpaprika.com) and paste it exactly as issued: the node sends the key as the entire `Authorization` value, with nothing in front of it.

Use the credential's **Test** button to confirm it works. It checks `/usage`, deliberately: on the data endpoints a key the API cannot read is ignored rather than rejected, so the call returns `200` with real data while quietly serving you the keyless tier. `/usage` is the only endpoint that reports the truth.

## Resources

- [DexPaprika in n8n](https://docs.dexpaprika.com/ai-integration/n8n)
- [DexPaprika API docs](https://docs.dexpaprika.com)

## License

[MIT](LICENSE)
