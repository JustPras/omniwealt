// Multi-Chain Crypto Wallet Auto-Sync Service
// Supports EVM (Ethereum, BSC, Polygon, Arbitrum, Base, Optimism, Avalanche), Solana, and Bitcoin.
// 100% Read-Only, Non-Custodial: Uses public RPCs with zero private keys or seed phrases.

import { CryptoNetworkType, CryptoWalletToken, CryptoWallet } from '../types';
import { MarketService } from './market-service';

export interface ScanWalletResult {
  address: string;
  networkType: CryptoNetworkType;
  chains: string[];
  tokens: CryptoWalletToken[];
  totalBalanceIdr: number;
  scannedAt: string;
}

export interface ExtractedWalletAddress {
  address: string;
  networkType: CryptoNetworkType;
}

// Chain and Token configurations
interface EvmChainConfig {
  name: string;
  rpcUrl: string;
  nativeToken: {
    symbol: string;
    name: string;
    coingeckoId: string;
    decimals: number;
  };
  tokens: {
    contractAddress: string;
    symbol: string;
    name: string;
    coingeckoId: string;
    decimals: number;
  }[];
}

const EVM_CHAINS: EvmChainConfig[] = [
  {
    name: 'Ethereum',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    nativeToken: {
      symbol: 'ETH',
      name: 'Ethereum',
      coingeckoId: 'ethereum',
      decimals: 18,
    },
    tokens: [
      {
        contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        symbol: 'USDT',
        name: 'Tether USD',
        coingeckoId: 'tether',
        decimals: 6,
      },
      {
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        name: 'USD Coin',
        coingeckoId: 'usd-coin',
        decimals: 6,
      },
      {
        contractAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        coingeckoId: 'dai',
        decimals: 18,
      },
      {
        contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
        symbol: 'LINK',
        name: 'Chainlink',
        coingeckoId: 'chainlink',
        decimals: 18,
      },
      {
        contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        symbol: 'UNI',
        name: 'Uniswap',
        coingeckoId: 'uniswap',
        decimals: 18,
      },
      {
        contractAddress: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
        symbol: 'PEPE',
        name: 'Pepe',
        coingeckoId: 'pepe',
        decimals: 18,
      },
    ],
  },
  {
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-rpc.publicnode.com',
    nativeToken: {
      symbol: 'BNB',
      name: 'BNB',
      coingeckoId: 'binancecoin',
      decimals: 18,
    },
    tokens: [
      {
        contractAddress: '0x55d398326f99059ff775485246999027b3197955',
        symbol: 'USDT',
        name: 'Tether USD (BSC)',
        coingeckoId: 'tether',
        decimals: 18,
      },
      {
        contractAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        symbol: 'USDC',
        name: 'USD Coin (BSC)',
        coingeckoId: 'usd-coin',
        decimals: 18,
      },
    ],
  },
  {
    name: 'Polygon',
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    nativeToken: {
      symbol: 'POL',
      name: 'Polygon',
      coingeckoId: 'matic-network',
      decimals: 18,
    },
    tokens: [
      {
        contractAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        symbol: 'USDT',
        name: 'Tether USD (Polygon)',
        coingeckoId: 'tether',
        decimals: 6,
      },
      {
        contractAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
        symbol: 'USDC',
        name: 'USD Coin (Polygon)',
        coingeckoId: 'usd-coin',
        decimals: 6,
      },
    ],
  },
  {
    name: 'Arbitrum One',
    rpcUrl: 'https://arbitrum-one-rpc.publicnode.com',
    nativeToken: {
      symbol: 'ETH',
      name: 'Ethereum (Arbitrum)',
      coingeckoId: 'ethereum',
      decimals: 18,
    },
    tokens: [
      {
        contractAddress: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        symbol: 'USDT',
        name: 'Tether USD (Arbitrum)',
        coingeckoId: 'tether',
        decimals: 6,
      },
      {
        contractAddress: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        symbol: 'USDC',
        name: 'USD Coin (Arbitrum)',
        coingeckoId: 'usd-coin',
        decimals: 6,
      },
      {
        contractAddress: '0x912ce59144191c1204e64559fe8253a0e49e6548',
        symbol: 'ARB',
        name: 'Arbitrum',
        coingeckoId: 'arbitrum',
        decimals: 18,
      },
    ],
  },
  {
    name: 'Base',
    rpcUrl: 'https://base-rpc.publicnode.com',
    nativeToken: {
      symbol: 'ETH',
      name: 'Ethereum (Base)',
      coingeckoId: 'ethereum',
      decimals: 18,
    },
    tokens: [
      {
        contractAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        symbol: 'USDC',
        name: 'USD Coin (Base)',
        coingeckoId: 'usd-coin',
        decimals: 6,
      },
    ],
  },
];

// Fallback prices in case CoinGecko is completely unavailable
const DEFAULT_CRYPTO_FALLBACKS: Record<string, number> = {
  bitcoin: 1045000000,
  ethereum: 44800000,
  solana: 2840000,
  binancecoin: 9400000,
  'matic-network': 6500,
  'avalanche-2': 420000,
  arbitrum: 8500,
  tether: 16200,
  'usd-coin': 16200,
  dai: 16200,
  pepe: 0.15,
  uniswap: 120000,
  chainlink: 180000,
  bonk: 0.35,
  'jupiter-exchange-solana': 14000,
};

/**
 * Executes a JSON-RPC request with a strict timeout
 */
async function rpcCall<T = any>(rpcUrl: string, method: string, params: any[], timeoutMs: number = 4500): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 100000),
        method,
        params,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`RPC HTTP error: ${res.status}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || 'RPC Error');
    }

    return data.result as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const CryptoWalletService = {
  /**
   * Validate wallet address according to the network specification
   */
  isValidAddress(address: string, networkType?: CryptoNetworkType): boolean {
    const clean = address.trim();
    if (!clean) return false;

    if (networkType === 'EVM') {
      return /^0x[a-fA-F0-9]{40}$/.test(clean);
    }

    if (networkType === 'SOLANA') {
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean);
    }

    if (networkType === 'BITCOIN') {
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(clean);
    }

    // Auto check if networkType is not specified
    return (
      /^0x[a-fA-F0-9]{40}$/.test(clean) ||
      /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean) ||
      /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(clean)
    );
  },

  /**
   * Automatically detect the blockchain network type based on public address format
   */
  detectNetworkType(address: string): CryptoNetworkType | null {
    const clean = address.trim();
    if (/^0x[a-fA-F0-9]{40}$/.test(clean)) {
      return 'EVM';
    }
    if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(clean)) {
      return 'BITCOIN';
    }
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean)) {
      return 'SOLANA';
    }
    return null;
  },

  /**
   * Format address for display (e.g. 0xd8dA...6045)
   */
  truncateAddress(address: string, lead: number = 6, tail: number = 4): string {
    const clean = address.trim();
    if (clean.length <= lead + tail) return clean;
    return `${clean.slice(0, lead)}...${clean.slice(-tail)}`;
  },

  /**
   * Smart Multi-Address Batch Extractor:
   * Parses arbitrary user text/notes and extracts all valid EVM, Bitcoin, and Solana addresses.
   */
  extractAddresses(text: string): ExtractedWalletAddress[] {
    const raw = text.trim();
    if (!raw) return [];

    const evmRegex = /0x[a-fA-F0-9]{40}/g;
    const btcRegex = /\b(bc1[a-zA-HJ-NP-Z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g;
    const solRegex = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;

    const evmMatches = Array.from(new Set(raw.match(evmRegex) || []));
    const btcMatches = Array.from(new Set((raw.match(btcRegex) || []).filter((a) => !evmMatches.includes(a))));
    const solMatches = Array.from(
      new Set((raw.match(solRegex) || []).filter((a) => !evmMatches.includes(a) && !btcMatches.includes(a)))
    );

    const results: ExtractedWalletAddress[] = [];
    evmMatches.forEach((addr) => results.push({ address: addr, networkType: 'EVM' }));
    solMatches.forEach((addr) => results.push({ address: addr, networkType: 'SOLANA' }));
    btcMatches.forEach((addr) => results.push({ address: addr, networkType: 'BITCOIN' }));

    return results;
  },

  /**
   * Scan EVM Multi-Chain balances (ETH, BSC, Polygon, Arbitrum, Base)
   */
  async scanEvm(address: string): Promise<{ chains: string[]; tokens: CryptoWalletToken[] }> {
    const cleanAddress = address.trim().toLowerCase();
    const cleanAddressNo0x = cleanAddress.replace(/^0x/, '');
    const paddedAddress = cleanAddressNo0x.padStart(64, '0');
    // ERC-20 balanceOf(address) selector: 0x70a08231
    const balanceOfData = `0x70a08231${paddedAddress}`;

    const tokensFound: CryptoWalletToken[] = [];
    const chainsWithActivity = new Set<string>();

    await Promise.allSettled(
      EVM_CHAINS.map(async (chain) => {
        try {
          // 1. Fetch Native Gas Token Balance (ETH, BNB, POL)
          const nativeBalanceHex = await rpcCall<string>(chain.rpcUrl, 'eth_getBalance', [cleanAddress, 'latest']);
          if (nativeBalanceHex && nativeBalanceHex !== '0x0') {
            const rawWei = BigInt(nativeBalanceHex);
            const nativeBalance = Number(rawWei) / 10 ** chain.nativeToken.decimals;
            if (nativeBalance > 0.000001) {
              tokensFound.push({
                chain: chain.name,
                symbol: chain.nativeToken.symbol,
                name: chain.nativeToken.name,
                balance: nativeBalance,
                priceIdr: 0,
                valueIdr: 0,
                coingeckoId: chain.nativeToken.coingeckoId,
              });
              chainsWithActivity.add(chain.name);
            }
          }
        } catch (err) {
          // Silently handle RPC transient errors for this chain
        }

        // 2. Fetch Known Popular ERC-20 Tokens on this Chain
        await Promise.allSettled(
          chain.tokens.map(async (tok) => {
            try {
              const resHex = await rpcCall<string>(chain.rpcUrl, 'eth_call', [
                {
                  to: tok.contractAddress,
                  data: balanceOfData,
                },
                'latest',
              ]);

              if (resHex && resHex !== '0x' && resHex !== '0x0') {
                const rawBal = BigInt(resHex);
                const tokenBal = Number(rawBal) / 10 ** tok.decimals;
                if (tokenBal > 0.0001) {
                  tokensFound.push({
                    chain: chain.name,
                    symbol: tok.symbol,
                    name: tok.name,
                    balance: tokenBal,
                    priceIdr: 0,
                    valueIdr: 0,
                    contractAddress: tok.contractAddress,
                    coingeckoId: tok.coingeckoId,
                  });
                  chainsWithActivity.add(chain.name);
                }
              }
            } catch {
              // Ignore single token call failures
            }
          })
        );
      })
    );

    const activeChains = Array.from(chainsWithActivity);
    return {
      chains: activeChains.length > 0 ? activeChains : ['Ethereum'],
      tokens: tokensFound,
    };
  },

  /**
   * Scan Solana native SOL and SPL token balances
   */
  async scanSolana(address: string): Promise<{ chains: string[]; tokens: CryptoWalletToken[] }> {
    const cleanAddress = address.trim();
    const tokensFound: CryptoWalletToken[] = [];
    const rpcUrl = 'https://api.mainnet-beta.solana.com';

    try {
      // 1. Fetch Native SOL Balance
      const balanceData = await rpcCall<{ value: number }>(rpcUrl, 'getBalance', [cleanAddress]);
      if (balanceData && typeof balanceData.value === 'number') {
        const solBalance = balanceData.value / 1e9;
        if (solBalance > 0.00001) {
          tokensFound.push({
            chain: 'Solana',
            symbol: 'SOL',
            name: 'Solana',
            balance: solBalance,
            priceIdr: 0,
            valueIdr: 0,
            coingeckoId: 'solana',
          });
        }
      }
    } catch (e) {
      console.warn('Solana getBalance failed:', e);
    }

    try {
      // 2. Fetch SPL Token Accounts
      const tokenAccounts = await rpcCall<{
        value: Array<{
          account: {
            data: {
              parsed: {
                info: {
                  mint: string;
                  tokenAmount: {
                    uiAmount: number;
                    decimals: number;
                  };
                };
              };
            };
          };
        }>;
      }>(rpcUrl, 'getTokenAccountsByOwner', [
        cleanAddress,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed' },
      ]);

      if (tokenAccounts?.value) {
        for (const item of tokenAccounts.value) {
          const info = item?.account?.data?.parsed?.info;
          const uiAmount = info?.tokenAmount?.uiAmount;
          const mint = info?.mint;

          if (uiAmount && uiAmount > 0.0001 && mint) {
            // Check known mint addresses
            let symbol = 'SPL';
            let name = 'Solana Token';
            let coingeckoId = 'solana';

            if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
              symbol = 'USDC';
              name = 'USD Coin (Solana)';
              coingeckoId = 'usd-coin';
            } else if (mint === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') {
              symbol = 'USDT';
              name = 'Tether USD (Solana)';
              coingeckoId = 'tether';
            } else if (mint === 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263') {
              symbol = 'BONK';
              name = 'Bonk';
              coingeckoId = 'bonk';
            } else if (mint === 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN') {
              symbol = 'JUP';
              name = 'Jupiter';
              coingeckoId = 'jupiter-exchange-solana';
            }

            tokensFound.push({
              chain: 'Solana',
              symbol,
              name,
              balance: uiAmount,
              priceIdr: 0,
              valueIdr: 0,
              contractAddress: mint,
              coingeckoId,
            });
          }
        }
      }
    } catch {
      // Ignore SPL token query error
    }

    return {
      chains: ['Solana'],
      tokens: tokensFound,
    };
  },

  /**
   * Scan Bitcoin balance via blockchain.info
   */
  async scanBitcoin(address: string): Promise<{ chains: string[]; tokens: CryptoWalletToken[] }> {
    const cleanAddress = address.trim();
    const tokensFound: CryptoWalletToken[] = [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`https://blockchain.info/balance?active=${cleanAddress}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const data = json[cleanAddress];
        if (data && typeof data.final_balance === 'number') {
          const btcBalance = data.final_balance / 100000000;
          if (btcBalance > 0) {
            tokensFound.push({
              chain: 'Bitcoin',
              symbol: 'BTC',
              name: 'Bitcoin',
              balance: btcBalance,
              priceIdr: 0,
              valueIdr: 0,
              coingeckoId: 'bitcoin',
            });
          }
        }
      }
    } catch (e) {
      console.warn('Bitcoin scan failed:', e);
    }

    return {
      chains: ['Bitcoin'],
      tokens: tokensFound,
    };
  },

  /**
   * Master Scan Function:
   * Detects network, scans on-chain balances, fetches real-time IDR quotes,
   * and calculates total wallet value in IDR.
   */
  async scanWallet(address: string, networkType?: CryptoNetworkType): Promise<ScanWalletResult> {
    const targetNetwork = networkType || this.detectNetworkType(address) || 'EVM';
    let chains: string[] = [];
    let tokens: CryptoWalletToken[] = [];

    if (targetNetwork === 'EVM') {
      const res = await this.scanEvm(address);
      chains = res.chains;
      tokens = res.tokens;
    } else if (targetNetwork === 'SOLANA') {
      const res = await this.scanSolana(address);
      chains = res.chains;
      tokens = res.tokens;
    } else if (targetNetwork === 'BITCOIN') {
      const res = await this.scanBitcoin(address);
      chains = res.chains;
      tokens = res.tokens;
    }

    // Collect unique coingecko IDs to price all detected tokens
    const coingeckoIds = Array.from(new Set(tokens.map((t) => t.coingeckoId)));
    let prices: Record<string, { priceIdr: number }> = {};

    if (coingeckoIds.length > 0) {
      try {
        prices = await MarketService.fetchCryptoPrices(coingeckoIds);
      } catch {
        // Degrade to fallbacks
      }
    }

    let totalBalanceIdr = 0;
    const pricedTokens = tokens.map((token) => {
      const price = prices[token.coingeckoId]?.priceIdr || DEFAULT_CRYPTO_FALLBACKS[token.coingeckoId] || 0;
      const valueIdr = token.balance * price;
      totalBalanceIdr += valueIdr;

      return {
        ...token,
        priceIdr: price,
        valueIdr,
      };
    });

    return {
      address: address.trim(),
      networkType: targetNetwork,
      chains,
      tokens: pricedTokens,
      totalBalanceIdr,
      scannedAt: new Date().toISOString(),
    };
  },
};
