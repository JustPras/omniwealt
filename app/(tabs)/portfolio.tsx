import React, { useState, useCallback } from 'react';
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
import { ScreenTransition } from '../../src/components/common/screen-transition';
import { AmbientBackground } from '../../src/components/common/ambient-background';
import { Sparkline } from '../../src/components/common/sparkline';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { StockModal } from '../../src/components/modals/stock-modal';
import { CryptoModal } from '../../src/components/modals/crypto-modal';
import { useWealth } from '../../src/store/wealth-context';
import { formatPercent, formatChangePercent, formatIDR } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { StockAsset, CryptoAsset } from '../../src/types';
import { color, space, radius, shadow } from '../../src/theme/tokens';

type AssetFilter = 'ALL' | 'STOCKS' | 'CRYPTO';
type SortMode = 'VALUE' | 'PNL' | 'NAME';

export default function PortfolioScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  const {
    stocks,
    cryptos,
    totalStocks,
    totalCryptos,
    totalInvestments,
    totalUnrealizedPnL,
    totalUnrealizedPnLPercent,
    isRefreshing,
    refreshMarketPrices,
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

  const isOverallProfit = totalUnrealizedPnL >= 0;

  // Auto-refresh market prices silently when opening the Portfolio tab
  useFocusEffect(
    useCallback(() => {
      if (stocks.length > 0 || cryptos.length > 0) {
        refreshMarketPrices(true);
      }
    }, [stocks.length, cryptos.length, refreshMarketPrices])
  );

  // Sorted Stocks
  const sortedStocks = [...stocks].sort((a, b) => {
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

  const displayedStocks = sortedStocks.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
  });

  // Sorted Cryptos
  const sortedCryptos = [...cryptos].sort((a, b) => {
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

  const displayedCryptos = sortedCryptos.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  const portfolioSparkline = isOverallProfit
    ? [92, 93.5, 94.2, 93.8, 95.8, 97.2, 96.5, 98.4, 100.2, 99.8, 101.5, 103.5]
    : [104, 102.5, 103.1, 101.2, 99.8, 98.2, 99.1, 97.4, 96.0, 95.2, 94.1, 92.5];

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
    <ScreenTransition style={styles.screenContainer}>
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
        <GlassCard level="base" style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroLabel}>Nilai investasi</Text>
              <PrivacyValue value={totalInvestments} style={styles.heroAmount} />
            </View>
            <View style={styles.heroActions}>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  setSelectedStock(null);
                  setStockModalVisible(true);
                }}
                style={styles.actionBtn}
              >
                <Text style={styles.actionBtnText}>+ Saham</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  setSelectedCrypto(null);
                  setCryptoModalVisible(true);
                }}
                style={styles.actionBtn}
              >
                <Text style={styles.actionBtnText}>+ Kripto</Text>
              </Pressable>
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

        {/* 2. SLIDING SEGMENT FILTER (Saham | Kripto) & SORT */}
        <View style={styles.filterRow}>
          <View style={styles.segmentContainer}>
            {(['ALL', 'STOCKS', 'CRYPTO'] as AssetFilter[]).map((f) => {
              const isActive = activeFilter === f;
              const label = f === 'ALL' ? 'Semua' : f === 'STOCKS' ? 'Saham' : 'Kripto';
              const count = f === 'ALL'
                ? stocks.length + cryptos.length
                : f === 'STOCKS'
                ? stocks.length
                : cryptos.length;

              return (
                <Pressable
                  key={f}
                  onPress={() => {
                    triggerHaptic('selection');
                    setActiveFilter(f);
                  }}
                  style={[styles.segmentBtn, isActive && styles.activeSegmentBtn]}
                >
                  <Text style={[styles.segmentText, isActive && styles.activeSegmentText]}>
                    {label} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>

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
              <Text style={styles.sectionHeadline}>Saham Indonesia (IDX)</Text>
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
                            <Text style={styles.assetTicker}>{cleanTicker}</Text>
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

        {/* 5. DAFTAR KRIPTO (SATU KARTU BERISI BARIS DIPISAH HAIRLINE) */}
        {(activeFilter === 'ALL' || activeFilter === 'CRYPTO') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeadline}>Aset kripto</Text>
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
                            <Text style={styles.assetTicker}>{crypto.symbol}</Text>
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
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: color.glassFillInset,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: color.hairline,
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
  emptyCard: {
    padding: space.lg,
    alignItems: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: color.textMuted,
    textAlign: 'center',
  },
});
