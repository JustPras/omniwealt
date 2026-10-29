import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Icon } from '../../src/components/common/icon';
import { HeaderBar } from '../../src/components/layout/header-bar';
import { GlassCard } from '../../src/components/common/glass-card';
import { LiquidButton } from '../../src/components/common/liquid-button';
import { ScreenTransition } from '../../src/components/common/screen-transition';
import { AmbientBackground } from '../../src/components/common/ambient-background';
import { Sparkline } from '../../src/components/common/sparkline';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { LiquidSegmentControl } from '../../src/components/common/liquid-segment-control';
import { StockModal } from '../../src/components/modals/stock-modal';
import { CryptoModal } from '../../src/components/modals/crypto-modal';
import { CryptoWalletModal } from '../../src/components/modals/crypto-wallet-modal';
import { CryptoWalletService } from '../../src/services/crypto-wallet-service';
import { useWealth } from '../../src/store/wealth-context';
import { formatPercent, formatChangePercent, formatIDR } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { StockAsset, CryptoAsset } from '../../src/types';
import { color, space, radius, shadow, font, useTheme, Colors } from '../../src/theme/tokens';

type AssetFilter = 'ALL' | 'STOCKS' | 'CRYPTO';
type SortMode = 'VALUE' | 'PNL' | 'NAME';

export default function PortfolioScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 375;
  const theme = useTheme();

  const {
    stocks,
    cryptos,
    cryptoWallets,
    totalStocks,
    totalCryptos,
    totalInvestments,
    totalUnrealizedPnL,
    totalUnrealizedPnLPercent,
    isRefreshing,
    refreshMarketPrices,
    syncCryptoWallet,
    deleteCryptoWallet,
  } = useWealth();

  const [activeFilter, setActiveFilter] = useState<AssetFilter>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('VALUE');
  const [searchQuery, setSearchQuery] = useState('');

  // In-place expanded asset IDs
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);

  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockAsset | null>(null);

  const [cryptoModalVisible, setCryptoModalVisible] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(null);

  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [syncingWalletId, setSyncingWalletId] = useState<string | null>(null);

  const isOverallProfit = totalUnrealizedPnL >= 0;

  // Auto-refresh market prices silently when opening Portfolio tab, throttled to max once every 90s
  const lastMarketRefreshRef = useRef<number>(0);
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastMarketRefreshRef.current > 90_000 && (stocks.length > 0 || cryptos.length > 0)) {
        lastMarketRefreshRef.current = now;
        refreshMarketPrices(true);
      }
    }, [stocks.length, cryptos.length, refreshMarketPrices])
  );

  // Memoized Sorted Stocks
  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a, b) => {
      const valA = (Number(a.lots) || 0) * 100 * (Number(a.currentPrice) || 0);
      const valB = (Number(b.lots) || 0) * 100 * (Number(b.currentPrice) || 0);
      const costA = (Number(a.lots) || 0) * 100 * (Number(a.avgBuyPrice) || 0);
      const costB = (Number(b.lots) || 0) * 100 * (Number(b.avgBuyPrice) || 0);
      const pnlA = costA > 0 ? (valA - costA) / costA : 0;
      const pnlB = costB > 0 ? (valB - costB) / costB : 0;

      if (sortMode === 'VALUE') return valB - valA;
      if (sortMode === 'PNL') return pnlB - pnlA;
      return a.ticker.localeCompare(b.ticker);
    });
  }, [stocks, sortMode]);

  const displayedStocks = useMemo(() => {
    if (!searchQuery.trim()) return sortedStocks;
    const q = searchQuery.toLowerCase();
    return sortedStocks.filter(
      (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [sortedStocks, searchQuery]);

  // Memoized Sorted Cryptos
  const sortedCryptos = useMemo(() => {
    return [...cryptos].sort((a, b) => {
      const valA = (Number(a.holdings) || 0) * (Number(a.currentPriceIdr) || 0);
      const valB = (Number(b.holdings) || 0) * (Number(b.currentPriceIdr) || 0);
      const costA = (Number(a.holdings) || 0) * (Number(a.avgBuyPriceIdr) || 0);
      const costB = (Number(b.holdings) || 0) * (Number(b.avgBuyPriceIdr) || 0);
      const pnlA = costA > 0 ? (valA - costA) / costA : 0;
      const pnlB = costB > 0 ? (valB - costB) / costB : 0;

      if (sortMode === 'VALUE') return valB - valA;
      if (sortMode === 'PNL') return pnlB - pnlA;
      return a.symbol.localeCompare(b.symbol);
    });
  }, [cryptos, sortMode]);

  const displayedCryptos = useMemo(() => {
    if (!searchQuery.trim()) return sortedCryptos;
    const q = searchQuery.toLowerCase();
    return sortedCryptos.filter(
      (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    );
  }, [sortedCryptos, searchQuery]);

  const portfolioSparkline = useMemo(() => {
    return isOverallProfit
      ? [92, 93.5, 94.2, 93.8, 95.8, 97.2, 96.5, 98.4, 100.2, 99.8, 101.5, 103.5]
      : [104, 102.5, 103.1, 101.2, 99.8, 98.2, 99.1, 97.4, 96.0, 95.2, 94.1, 92.5];
  }, [isOverallProfit]);

  const toggleSort = () => {
    triggerHaptic('selection');
    if (sortMode === 'VALUE') setSortMode('PNL');
    else if (sortMode === 'PNL') setSortMode('NAME');
    else setSortMode('VALUE');
  };

  const toggleExpand = (id: string) => {
    triggerHaptic('light');
    setExpandedAssetId(expandedAssetId === id ? null : id);
  };

  return (
    <ScreenTransition style={[styles.screenContainer, { backgroundColor: theme.canvas }]}>
      <AmbientBackground activeAssetClass={activeFilter === 'CRYPTO' ? 'CRYPTO' : 'STOCK'} />
      <HeaderBar />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isSmall ? space.md : space.lg },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshMarketPrices}
            tintColor={color.accent}
            colors={[color.accent]}
          />
        }
      >
        {/* 1. INVESTMENT HERO STATS */}
        <GlassCard level="bullion" style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={[styles.heroLabel, { color: Colors.palette.naturalTitanium }]}>TOTAL INVESTASI // PORTFOLIO</Text>
              <PrivacyValue value={totalInvestments} style={[styles.heroAmount, { color: Colors.palette.alabasterWhite }]} />
            </View>
            <View style={styles.heroActions}>
              <LiquidButton
                title="Saham"
                icon="Plus"
                variant="azure"
                size="sm"
                onPress={() => {
                  setSelectedStock(null);
                  setStockModalVisible(true);
                }}
              />
              <LiquidButton
                title="Kripto"
                icon="Plus"
                variant="clear"
                size="sm"
                onPress={() => {
                  setSelectedCrypto(null);
                  setCryptoModalVisible(true);
                }}
              />
              <LiquidButton
                title="Web3"
                icon="Link2"
                variant="obsidian"
                size="sm"
                onPress={() => {
                  setWalletModalVisible(true);
                }}
              />
            </View>
          </View>

          {/* Unrealized PnL Row */}
          <View style={styles.pnlRow}>
            <Text style={styles.pnlLabel}>Laba belum terealisasi</Text>
            <View style={styles.pnlValues}>
              <Text
                style={[
                  styles.pnlPercent,
                  isOverallProfit ? styles.textGain : styles.textLoss,
                ]}
              >
                {formatChangePercent(totalUnrealizedPnLPercent)}
              </Text>
              <PrivacyValue
                value={totalUnrealizedPnL}
                prefix={isOverallProfit ? '▲ +' : '▼ −'}
                style={[
                  styles.pnlAmount,
                  isOverallProfit ? styles.textGain : styles.textLoss,
                ]}
              />
            </View>
          </View>

          {/* Micro Sparkline */}
          <Sparkline
            data={portfolioSparkline}
            isPositive={isOverallProfit}
            height={32}
            style={styles.heroSparkline}
          />
        </GlassCard>

        {/* 2. SLIDING SEGMENT FILTER (Semua | Saham | Crypto) & SORT */}
        <View style={styles.filterRow}>
          <LiquidSegmentControl<AssetFilter>
            items={[
              { key: 'ALL', label: 'Semua', count: stocks.length + cryptos.length },
              { key: 'STOCKS', label: 'Saham', count: stocks.length },
              { key: 'CRYPTO', label: 'Crypto', count: cryptos.length },
            ]}
            activeKey={activeFilter}
            onSelect={setActiveFilter}
            style={styles.segmentContainer}
            height={36}
            fontSize={isSmall ? 11 : 12}
          />

          <Pressable onPress={toggleSort} style={styles.sortBtn} hitSlop={6}>
            <Text style={styles.sortBtnText}>
              Urut: {sortMode === 'VALUE' ? 'Nilai' : sortMode === 'PNL' ? 'PnL' : 'Nama'}
            </Text>
          </Pressable>
        </View>

        {/* 3. PENCARIAN DI ATAS DAFTAR */}
        <View style={styles.searchBar}>
          <Icon name="Search" size={15} color={color.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kode (BBRI, BTC) atau nama..."
            placeholderTextColor={color.textFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Icon name="X" size={14} color={color.textMuted} />
            </Pressable>
          )}
        </View>

        {/* 4. DAFTAR SAHAM (SATU KARTU BERISI BARIS DIPISAH HAIRLINE) */}
        {(activeFilter === 'ALL' || activeFilter === 'STOCKS') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionHeadline, { color: theme.text }]}>Saham Indonesia (IDX)</Text>
              <PrivacyValue value={totalStocks} style={styles.sectionTotal} />
            </View>

            {displayedStocks.length === 0 ? (
              <GlassCard level="base" style={styles.emptyCard}>
                <Text style={styles.emptyDesc}>
                  {stocks.length === 0
                    ? 'Belum ada aset saham. Tambahkan lot atau impor dari SoA broker.'
                    : 'Tidak ada saham yang sesuai pencarian.'}
                </Text>
              </GlassCard>
            ) : (
              <GlassCard level="base" noPadding style={styles.listCard}>
                {displayedStocks.map((stock, index) => {
                  const isExpanded = expandedAssetId === stock.id;
                  const isLast = index === displayedStocks.length - 1;
                  const totalValue = (Number(stock.lots) || 0) * 100 * (Number(stock.currentPrice) || 0);
                  const totalCost = (Number(stock.lots) || 0) * 100 * (Number(stock.avgBuyPrice) || 0);
                  const pnlRp = totalValue - totalCost;
                  const pnlPct = totalCost > 0 ? pnlRp / totalCost : 0;
                  const isUp = pnlPct >= 0;
                  const cleanTicker = stock.ticker.replace('.JK', '');

                  return (
                    <View key={stock.id}>
                      <Pressable
                        onPress={() => toggleExpand(stock.id)}
                        onLongPress={() => {
                          triggerHaptic('medium');
                          setSelectedStock(stock);
                          setStockModalVisible(true);
                        }}
                        style={[styles.assetRow, isExpanded && styles.assetRowExpanded]}
                      >
                        {/* Left: Ticker & Name & Lots */}
                        <View style={styles.assetLeft}>
                          <View style={[styles.assetDot, { backgroundColor: color.asset.stock }]} />
                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.assetTicker}>{cleanTicker}</Text>
                              {/-W[0-9A-Z]*$/i.test(cleanTicker) && (
                                <View style={styles.derivativeBadge}>
                                  <Text style={styles.derivativeBadgeText}>WARRANT</Text>
                                </View>
                              )}
                              {/-R[0-9A-Z]*$/i.test(cleanTicker) && (
                                <View style={styles.derivativeBadge}>
                                  <Text style={styles.derivativeBadgeText}>RIGHT</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.assetName} numberOfLines={1}>
                              {stock.name}
                            </Text>
                            <Text style={styles.assetLots}>
                              {stock.lots} lot <Text style={styles.assetShares}>({stock.lots * 100} lembar)</Text>
                            </Text>
                          </View>
                        </View>

                        {/* Right: Value & PnL */}
                        <View style={styles.assetRight}>
                          <PrivacyValue value={totalValue} style={styles.assetValueText} />
                          <Text style={[styles.assetPnlText, isUp ? styles.textGain : styles.textLoss]}>
                            {formatChangePercent(pnlPct)}
                          </Text>
                          <PrivacyValue
                            value={pnlRp}
                            prefix={isUp ? '▲ +' : '▼ −'}
                            style={[styles.assetPnlAmount, isUp ? styles.textGain : styles.textLoss]}
                          />
                        </View>
                      </Pressable>

                      {/* IN-PLACE EXPANDED DETAIL */}
                      {isExpanded && (
                        <View style={styles.expandedDetailBox}>
                          <View style={styles.expandedMetricsRow}>
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>Harga beli rata-rata</Text>
                              <Text style={styles.metricValue}>{formatIDR(stock.avgBuyPrice)}</Text>
                            </View>
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>Harga live pasar</Text>
                              <Text style={styles.metricValue}>{formatIDR(stock.currentPrice)}</Text>
                            </View>
                          </View>

                          <View style={styles.expandedMetricsRow}>
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>Modal investasi</Text>
                              <PrivacyValue value={totalCost} style={styles.metricValue} />
                            </View>
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>Laba / rugi</Text>
                              <PrivacyValue
                                value={pnlRp}
                                prefix={isUp ? '▲ +' : '▼ −'}
                                style={[styles.metricValue, isUp ? styles.textGain : styles.textLoss]}
                              />
                            </View>
                          </View>

                          <View style={styles.expandedActionRow}>
                            <Pressable
                              onPress={() => {
                                triggerHaptic('light');
                                setSelectedStock(stock);
                                setStockModalVisible(true);
                              }}
                              style={styles.expandedEditBtn}
                            >
                              <Icon name="Edit2" size={12} color={color.accent} />
                              <Text style={styles.expandedEditBtnText}>Ubah transaksi</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}

                      {!isLast && <View style={styles.rowHairline} />}
                    </View>
                  );
                })}
              </GlassCard>
            )}
          </View>
        )}

        {/* 4b. DOMPET WEB3 TERHUBUNG (MULTI-CHAIN AUTO-SYNC) */}
        {(activeFilter === 'ALL' || activeFilter === 'CRYPTO') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="Wallet" size={16} color="#A78BFA" />
                <Text style={[styles.sectionHeadline, { color: theme.text }]}>Dompet Web3 Terhubung</Text>
              </View>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  setWalletModalVisible(true);
                }}
                style={styles.connectWalletBtn}
                hitSlop={6}
              >
                <Icon name="Plus" size={13} color="#A78BFA" />
                <Text style={styles.connectWalletBtnText}>Tambah</Text>
              </Pressable>
            </View>

            {cryptoWallets.length === 0 ? (
              <GlassCard level="base" style={styles.web3EmptyCard}>
                <View style={styles.web3EmptyContent}>
                  <View style={styles.web3IconCircle}>
                    <Icon name="Link2" size={20} color="#A78BFA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.web3EmptyTitle}>Auto-Sync Dompet Multi-Chain</Text>
                    <Text style={styles.web3EmptyDesc}>
                      Hubungkan alamat publik dompet Web3 Anda (EVM, Solana, Bitcoin) untuk memantau saldo on-chain 100% otomatis.
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    triggerHaptic('medium');
                    setWalletModalVisible(true);
                  }}
                  style={styles.web3ConnectAction}
                >
                  <Text style={styles.web3ConnectActionText}>Hubungkan Dompet Sekarang</Text>
                  <Icon name="ArrowRight" size={14} color="#EDE9FE" />
                </Pressable>
              </GlassCard>
            ) : (
              <View style={styles.walletCardGrid}>
                {cryptoWallets.map((wallet) => {
                  const isThisSyncing = syncingWalletId === wallet.id;
                  return (
                    <GlassCard key={wallet.id} level="base" style={styles.walletItemCard}>
                      <View style={styles.walletHeaderRow}>
                        <View style={styles.walletLeft}>
                          <View style={styles.walletNetworkBadge}>
                            <Text style={styles.walletNetworkBadgeText}>{wallet.networkType}</Text>
                          </View>
                          <View>
                            <Text style={styles.walletNameText}>{wallet.name}</Text>
                            <Text style={styles.walletAddressText}>
                              {CryptoWalletService.truncateAddress(wallet.address, 6, 4)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.walletRight}>
                          <PrivacyValue value={wallet.balanceIdr} style={styles.walletBalanceText} />
                          <View style={styles.syncStatusRow}>
                            <View style={styles.greenSyncDot} />
                            <Text style={styles.syncStatusText}>Auto-Sync</Text>
                          </View>
                        </View>
                      </View>

                      {/* Chains pill row */}
                      {wallet.chains && wallet.chains.length > 0 && (
                        <View style={styles.walletChainsRow}>
                          {wallet.chains.map((chain) => (
                            <View key={chain} style={styles.walletChainChip}>
                              <Text style={styles.walletChainChipText}>{chain}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Action buttons bar */}
                      <View style={styles.walletActionsBar}>
                        <Text style={styles.walletTokensCount}>
                          {wallet.tokens.length} aset on-chain terdeteksi
                        </Text>
                        <View style={styles.walletBtnGroup}>
                          <Pressable
                            onPress={async () => {
                              setSyncingWalletId(wallet.id);
                              try {
                                await syncCryptoWallet(wallet.id);
                              } finally {
                                setSyncingWalletId(null);
                              }
                            }}
                            disabled={isThisSyncing}
                            style={styles.walletIconBtn}
                            hitSlop={6}
                          >
                            <Icon
                              name="RefreshCw"
                              size={13}
                              color={isThisSyncing ? color.accent : color.textMuted}
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              deleteCryptoWallet(wallet.id);
                            }}
                            style={styles.walletIconBtn}
                            hitSlop={6}
                          >
                            <Icon name="Trash2" size={13} color={color.loss} />
                          </Pressable>
                        </View>
                      </View>
                    </GlassCard>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* 5. DAFTAR KRIPTO (SATU KARTU BERISI BARIS DIPISAH HAIRLINE) */}
        {(activeFilter === 'ALL' || activeFilter === 'CRYPTO') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionHeadline, { color: theme.text }]}>Aset kripto</Text>
              <PrivacyValue value={totalCryptos} style={styles.sectionTotal} />
            </View>

            {displayedCryptos.length === 0 ? (
              <GlassCard level="base" style={styles.emptyCard}>
                <Text style={styles.emptyDesc}>
                  {cryptos.length === 0
                    ? 'Belum ada aset kripto terdaftar.'
                    : 'Tidak ada kripto yang sesuai pencarian.'}
                </Text>
              </GlassCard>
            ) : (
              <GlassCard level="base" noPadding style={styles.listCard}>
                {displayedCryptos.map((crypto, index) => {
                  const isExpanded = expandedAssetId === crypto.id;
                  const isLast = index === displayedCryptos.length - 1;
                  const totalValue = (Number(crypto.holdings) || 0) * (Number(crypto.currentPriceIdr) || 0);
                  const totalCost = (Number(crypto.holdings) || 0) * (Number(crypto.avgBuyPriceIdr) || 0);
                  const pnlRp = totalValue - totalCost;
                  const pnlPct = totalCost > 0 ? pnlRp / totalCost : 0;
                  const isUp = pnlPct >= 0;

                  return (
                    <View key={crypto.id}>
                      <Pressable
                        onPress={() => toggleExpand(crypto.id)}
                        onLongPress={() => {
                          triggerHaptic('medium');
                          setSelectedCrypto(crypto);
                          setCryptoModalVisible(true);
                        }}
                        style={[styles.assetRow, isExpanded && styles.assetRowExpanded]}
                      >
                        {/* Left: Symbol & Name */}
                        <View style={styles.assetLeft}>
                          <View style={[styles.assetDot, { backgroundColor: color.asset.crypto }]} />
                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.assetTicker}>{crypto.symbol}</Text>
                              {crypto.walletId && (
                                <View style={styles.onChainBadge}>
                                  <Text style={styles.onChainBadgeText}>
                                    {crypto.chain ? crypto.chain.toUpperCase() : 'ON-CHAIN'}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.assetName} numberOfLines={1}>
                              {crypto.name}
                            </Text>
                            <Text style={styles.assetLots}>
                              {crypto.holdings} {crypto.symbol}
                            </Text>
                          </View>
                        </View>

                        {/* Right: Value & PnL */}
                        <View style={styles.assetRight}>
                          <PrivacyValue value={totalValue} style={styles.assetValueText} />
                          <Text style={[styles.assetPnlText, isUp ? styles.textGain : styles.textLoss]}>
                            {formatChangePercent(pnlPct)}
                          </Text>
                          <PrivacyValue
                            value={pnlRp}
                            prefix={isUp ? '▲ +' : '▼ −'}
                            style={[styles.assetPnlAmount, isUp ? styles.textGain : styles.textLoss]}
                          />
                        </View>
                      </Pressable>

                      {/* IN-PLACE EXPANDED DETAIL */}
                      {isExpanded && (
                        <View style={styles.expandedDetailBox}>
                          <View style={styles.expandedMetricsRow}>
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>Harga beli rata-rata</Text>
                              <Text style={styles.metricValue}>{formatIDR(crypto.avgBuyPriceIdr)}</Text>
                            </View>
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>Harga live pasar</Text>
                              <Text style={styles.metricValue}>{formatIDR(crypto.currentPriceIdr)}</Text>
                            </View>
                          </View>

                          <View style={styles.expandedMetricsRow}>
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>Modal investasi</Text>
                              <PrivacyValue value={totalCost} style={styles.metricValue} />
                            </View>
                            <View style={styles.metricItem}>
                              <Text style={styles.metricLabel}>Laba / rugi</Text>
                              <PrivacyValue
                                value={pnlRp}
                                prefix={isUp ? '▲ +' : '▼ −'}
                                style={[styles.metricValue, isUp ? styles.textGain : styles.textLoss]}
                              />
                            </View>
                          </View>

                          <View style={styles.expandedActionRow}>
                            <Pressable
                              onPress={() => {
                                triggerHaptic('light');
                                setSelectedCrypto(crypto);
                                setCryptoModalVisible(true);
                              }}
                              style={styles.expandedEditBtn}
                            >
                              <Icon name="Edit2" size={12} color={color.accent} />
                              <Text style={styles.expandedEditBtnText}>Ubah transaksi</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}

                      {!isLast && <View style={styles.rowHairline} />}
                    </View>
                  );
                })}
              </GlassCard>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <StockModal
        visible={stockModalVisible}
        stock={selectedStock}
        onClose={() => {
          setStockModalVisible(false);
          setSelectedStock(null);
        }}
      />

      <CryptoModal
        visible={cryptoModalVisible}
        crypto={selectedCrypto}
        onClose={() => {
          setCryptoModalVisible(false);
          setSelectedCrypto(null);
        }}
      />

      <CryptoWalletModal
        visible={walletModalVisible}
        onClose={() => {
          setWalletModalVisible(false);
        }}
      />
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: color.obsidian,
  },
  scrollContent: {
    paddingBottom: 110,
    gap: space.lg,
  },
  heroCard: {
    padding: space.lg,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  heroLabel: {
    fontSize: 13,
    color: color.textMuted,
    fontWeight: '500',
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: color.text,
    letterSpacing: -0.5,
    marginVertical: space.xs,
  },
  heroActions: {
    flexDirection: 'row',
    gap: space.xs + 2,
  },
  actionBtn: {
    backgroundColor: color.glassFillInset,
    borderWidth: 1,
    borderColor: color.hairline,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: color.text,
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
  },
  pnlLabel: {
    fontSize: 12,
    color: color.textMuted,
  },
  pnlValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  pnlPercent: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  pnlAmount: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  heroSparkline: {
    marginTop: space.sm,
  },

  // Segment Filter & Sort
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  segmentContainer: {
    flex: 1,
  },
  segmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  activeSegmentBtn: {
    backgroundColor: color.accentSoft,
    borderWidth: 1,
    borderColor: color.accentRim,
  },
  segmentText: {
    fontSize: 12,
    color: color.textMuted,
    fontWeight: '500',
  },
  activeSegmentText: {
    color: color.accent,
    fontWeight: '600',
  },
  sortBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  sortBtnText: {
    fontSize: 12,
    color: color.textMuted,
    fontWeight: '500',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.glassFillInset,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.hairline,
    paddingHorizontal: space.md,
    height: 42,
    gap: space.sm,
  },
  searchInput: {
    flex: 1,
    color: color.text,
    fontSize: 13,
  },

  // Section
  sectionContainer: {
    gap: space.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionHeadline: {
    fontSize: 16,
    fontWeight: '600',
    color: color.text,
  },
  sectionTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: color.textMuted,
  },
  listCard: {
    borderRadius: radius.lg,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  assetRowExpanded: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    flex: 1,
  },
  assetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  assetTicker: {
    fontSize: 15,
    fontWeight: '700',
    color: color.text,
  },
  assetName: {
    fontSize: 12,
    color: color.textMuted,
    maxWidth: 160,
    marginTop: 1,
  },
  assetLots: {
    fontSize: 11,
    color: color.textMuted,
    marginTop: 2,
  },
  assetShares: {
    fontSize: 10,
    color: color.textFaint,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: color.text,
    textAlign: 'right',
  },
  assetPnlText: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  assetPnlAmount: {
    fontSize: 11,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  rowHairline: {
    height: 1,
    backgroundColor: color.hairline,
    marginHorizontal: space.lg,
  },

  // In-Place Expanded Box
  expandedDetailBox: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: color.glassFillInset,
    gap: space.sm,
  },
  expandedMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: color.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: color.text,
    fontVariant: ['tabular-nums'],
  },
  expandedActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  expandedEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: color.accentSoft,
    borderWidth: 1,
    borderColor: color.accentRim,
  },
  expandedEditBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: color.accent,
  },

  textGain: {
    color: color.gain,
  },
  textLoss: {
    color: color.loss,
  },
  derivativeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  derivativeBadgeText: {
    fontSize: 9,
    fontFamily: font.mono,
    fontWeight: '700',
    color: Colors.palette.champagneGold,
    letterSpacing: 0.4,
  },
  emptyCard: {
    padding: space.lg,
    alignItems: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: color.textMuted,
    textAlign: 'center',
  },

  // Web3 Multi-Chain Wallets Section Styles
  walletActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(224, 122, 95, 0.16)',
    borderColor: 'rgba(224, 122, 95, 0.35)',
  },
  connectWalletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(224, 122, 95, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.30)',
  },
  connectWalletBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.palette.burnishedCopper,
  },
  web3EmptyCard: {
    padding: space.md,
    gap: space.md,
    borderRadius: radius.lg,
  },
  web3EmptyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  web3IconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(224, 122, 95, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  web3EmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: color.text,
    marginBottom: 2,
  },
  web3EmptyDesc: {
    fontSize: 12,
    color: color.textMuted,
    lineHeight: 16,
  },
  web3ConnectAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(224, 122, 95, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.40)',
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  web3ConnectActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
  },
  walletCardGrid: {
    gap: space.sm,
  },
  walletItemCard: {
    padding: space.md,
    borderRadius: radius.lg,
    gap: space.sm,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  walletNetworkBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(224, 122, 95, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.35)',
  },
  walletNetworkBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.palette.burnishedCopper,
  },
  walletNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: color.text,
  },
  walletAddressText: {
    fontSize: 11,
    fontFamily: font.num,
    color: color.textMuted,
  },
  walletRight: {
    alignItems: 'flex-end',
  },
  walletBalanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: color.text,
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  greenSyncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.gain,
  },
  syncStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: color.gain,
  },
  walletChainsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  walletChainChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  walletChainChipText: {
    fontSize: 9,
    color: color.textMuted,
  },
  walletActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: space.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  walletTokensCount: {
    fontSize: 11,
    color: color.textMuted,
  },
  walletBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  walletIconBtn: {
    padding: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  onChainBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  onChainBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DDD6FE',
    letterSpacing: 0.4,
  },
});
