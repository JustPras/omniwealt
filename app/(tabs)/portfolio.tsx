import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Icon } from '../../src/components/common/icon';
import { HeaderBar } from '../../src/components/layout/header-bar';
import { GlassCard } from '../../src/components/common/glass-card';
import { ScreenTransition } from '../../src/components/common/screen-transition';
import { Sparkline } from '../../src/components/common/sparkline';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { StockModal } from '../../src/components/modals/stock-modal';
import { CryptoModal } from '../../src/components/modals/crypto-modal';
import { useWealth } from '../../src/store/wealth-context';
import { formatPercent } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { StockAsset, CryptoAsset } from '../../src/types';

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

  // Filtered by Search Query
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

  return (
    <ScreenTransition style={styles.screenContainer}>
      <HeaderBar />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isSmall ? 12 : 16 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshMarketPrices}
            tintColor="#38BDF8"
            colors={['#38BDF8']}
          />
        }
      >
        {/* INVESTMENT HERO STATS */}
        <GlassCard
          style={styles.heroCard}
          borderTint="rgba(56, 189, 248, 0.25)"
          gradientColors={['rgba(56, 189, 248, 0.10)', 'rgba(15, 23, 42, 0.55)']}
        >
          {/* Hero Top: Label and Action Buttons */}
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroLabel}>TOTAL NILAI INVESTASI</Text>
            <View style={styles.heroActions}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  setSelectedStock(null);
                  setStockModalVisible(true);
                }}
                style={styles.addBtnSky}
                activeOpacity={0.7}
              >
                <Icon name="Plus" size={12} color="#080C14" />
                <Text style={styles.addBtnText}>+ Saham</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  setSelectedCrypto(null);
                  setCryptoModalVisible(true);
                }}
                style={styles.addBtnAmber}
                activeOpacity={0.7}
              >
                <Icon name="Plus" size={12} color="#080C14" />
                <Text style={styles.addBtnText}>+ Kripto</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Full-width Investment Value */}
          <PrivacyValue value={totalInvestments} style={styles.heroAmount} />

          {/* Unrealized PnL Pod */}
          <View style={styles.pnlPod}>
            <Text style={styles.pnlPodLabel}>Total Unrealized Profit / Loss</Text>
            <View style={styles.pnlValuesRow}>
              <PrivacyValue
                value={totalUnrealizedPnL}
                prefix={isOverallProfit ? '+ ' : ''}
                style={[styles.pnlAmount, isOverallProfit ? styles.textGreen : styles.textRed]}
              />
              <View style={[styles.pnlChip, isOverallProfit ? styles.chipGreen : styles.chipRed]}>
                <Icon
                  name={isOverallProfit ? 'ArrowUpRight' : 'ArrowDownRight'}
                  size={12}
                  color={isOverallProfit ? '#10B981' : '#F43F5E'}
                />
                <Text style={[styles.pnlChipText, isOverallProfit ? styles.textGreen : styles.textRed]}>
                  {formatPercent(totalUnrealizedPnLPercent)}
                </Text>
              </View>
            </View>
          </View>

          {/* Micro Sparkline Trend */}
          <Sparkline
            data={portfolioSparkline}
            isPositive={isOverallProfit}
            height={32}
            style={styles.heroSparkline}
          />
        </GlassCard>

        {/* FLUID ASSET FILTER & SORT BAR */}
        <View style={styles.filterAndSortRow}>
          <View style={styles.filterContainer}>
            {(['ALL', 'STOCKS', 'CRYPTO'] as AssetFilter[]).map((f) => {
              const isActive = activeFilter === f;
              const count = f === 'ALL'
                ? stocks.length + cryptos.length
                : f === 'STOCKS'
                ? stocks.length
                : cryptos.length;

              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => {
                    triggerHaptic('selection');
                    setActiveFilter(f);
                  }}
                  style={[styles.filterTab, isActive && styles.activeFilterTab]}
                  activeOpacity={0.65}
                >
                  <Text style={[styles.filterTabText, isActive && styles.activeFilterTabText]}>
                    {f === 'ALL' ? 'Semua' : f === 'STOCKS' ? 'Saham' : 'Kripto'} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Interactive Sort Button */}
          <TouchableOpacity
            onPress={toggleSort}
            style={styles.sortBtn}
            activeOpacity={0.65}
          >
            <Text style={styles.sortBtnText}>
              Urut: {sortMode === 'VALUE' ? 'Nilai' : sortMode === 'PNL' ? 'PnL %' : 'Nama'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instant Search Bar */}
        <View style={styles.searchBarContainer}>
          <Icon name="Search" size={15} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kode saham (BBRI, ARCI...) atau koin..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="X" size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* IDX STOCKS SECTION */}
        {(activeFilter === 'ALL' || activeFilter === 'STOCKS') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.titleWithIcon}>
                <Icon name="TrendingUp" size={15} color="#38BDF8" />
                <Text style={styles.sectionTitle}>Saham Indonesia (IDX)</Text>
              </View>
              <View style={styles.sectionRightRow}>
                <PrivacyValue value={totalStocks} style={styles.sectionTotalVal} />
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('medium');
                    setSelectedStock(null);
                    setStockModalVisible(true);
                  }}
                  style={styles.sectionAddBtnSky}
                  activeOpacity={0.7}
                >
                  <Icon name="Plus" size={10} color="#38BDF8" />
                  <Text style={styles.sectionAddBtnSkyText}>Tambah</Text>
                </TouchableOpacity>
              </View>
            </View>

            {displayedStocks.length === 0 ? (
              <GlassCard style={styles.emptyCard} borderTint="rgba(56, 189, 248, 0.2)">
                <View style={styles.emptyIconCircle}>
                  <Icon name="TrendingUp" size={20} color="#38BDF8" />
                </View>
                <Text style={styles.emptyCardTitle}>
                  {searchQuery ? 'Saham Tidak Ditemukan' : 'Belum Ada Saham'}
                </Text>
                <Text style={styles.emptyCardDesc}>
                  {searchQuery
                    ? `Tidak ada saham dengan kata kunci "${searchQuery}". Coba cari ticker lain.`
                    : 'Sinkronkan dokumen SoA Stockbit atau catat saham IDX Anda manual.'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('medium');
                    setSelectedStock(null);
                    setStockModalVisible(true);
                  }}
                  style={styles.emptyActionBtnSky}
                  activeOpacity={0.75}
                >
                  <Icon name="Plus" size={13} color="#080C14" />
                  <Text style={styles.emptyActionBtnText}>+ Tambah Saham Manual</Text>
                </TouchableOpacity>
              </GlassCard>
            ) : (
              <View style={styles.assetList}>
              {displayedStocks.map((stock) => {
                const totalCost = (Number(stock.lots) || 0) * 100 * (Number(stock.avgBuyPrice) || 0);
                const marketVal = (Number(stock.lots) || 0) * 100 * (Number(stock.currentPrice) || 0);
                const pnlRp = marketVal - totalCost;
                const pnlPct = totalCost > 0 ? pnlRp / totalCost : 0;
                const isProfit = pnlRp >= 0;

                return (
                  <GlassCard
                    key={stock.id}
                    style={styles.assetCard}
                    borderTint="rgba(56, 189, 248, 0.16)"
                    onPress={() => {
                      triggerHaptic('light');
                      setSelectedStock(stock);
                      setStockModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.tickerBadgeRow}>
                          <Text style={styles.tickerText}>{stock.ticker.replace('.JK', '')}</Text>
                          <View style={styles.idxTag}>
                            <Text style={styles.idxTagText}>IDX</Text>
                          </View>
                        </View>
                        <Text style={styles.assetName} numberOfLines={1}>
                          {stock.name}
                        </Text>
                      </View>

                      <View style={styles.topRightActions}>
                        <PrivacyValue value={marketVal} style={styles.marketValText} />
                        <View style={styles.editPill}>
                          <Icon name="Edit2" size={11} color="#94A3B8" />
                          <Text style={styles.editPillText}>Edit</Text>
                        </View>
                      </View>
                    </View>

                    {/* Stock Metrics Grid (Fluid 4-cell row) */}
                    <View style={styles.metricsGrid}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Jumlah</Text>
                        <Text style={styles.metricValue}>{stock.lots} Lot</Text>
                        <Text style={styles.metricSub}>{stock.lots * 100} lbr</Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Harga Rata2</Text>
                        <PrivacyValue value={stock.avgBuyPrice} style={styles.metricValue} compact />
                        <Text style={styles.metricSub}>Modal</Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Harga Pasar</Text>
                        <PrivacyValue value={stock.currentPrice} style={styles.metricValue} compact />
                        <Text style={[styles.metricSub, stock.change24h >= 0 ? styles.textGreen : styles.textRed]}>
                          {formatPercent(stock.change24h)}
                        </Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Unrealized PnL</Text>
                        <Text style={[styles.metricValue, isProfit ? styles.textGreen : styles.textRed]}>
                          {isProfit ? '+' : ''}
                          {formatPercent(pnlPct)}
                        </Text>
                        <PrivacyValue
                          value={pnlRp}
                          prefix={isProfit ? '+' : ''}
                          style={[styles.metricSub, isProfit ? styles.textGreen : styles.textRed]}
                          compact
                        />
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* CRYPTO ASSETS SECTION */}
      {(activeFilter === 'ALL' || activeFilter === 'CRYPTO') && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.titleWithIcon}>
              <Icon name="Coins" size={15} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Aset Kripto (IDR)</Text>
            </View>
            <View style={styles.sectionRightRow}>
              <PrivacyValue value={totalCryptos} style={styles.sectionTotalVal} />
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  setSelectedCrypto(null);
                  setCryptoModalVisible(true);
                }}
                style={styles.sectionAddBtnAmber}
                activeOpacity={0.7}
              >
                <Icon name="Plus" size={10} color="#F59E0B" />
                <Text style={styles.sectionAddBtnAmberText}>Tambah</Text>
              </TouchableOpacity>
            </View>
          </View>

          {displayedCryptos.length === 0 ? (
            <GlassCard style={styles.emptyCard} borderTint="rgba(245, 158, 11, 0.2)">
              <View style={styles.emptyIconCircle}>
                <Icon name="Coins" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.emptyCardTitle}>
                {searchQuery ? 'Kripto Tidak Ditemukan' : 'Belum Ada Aset Kripto'}
              </Text>
              <Text style={styles.emptyCardDesc}>
                {searchQuery
                  ? `Tidak ada aset kripto dengan kata kunci "${searchQuery}".`
                  : 'Catat portofolio koin crypto seperti BTC, ETH, SOL, USDT, dll.'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  setSelectedCrypto(null);
                  setCryptoModalVisible(true);
                }}
                style={styles.emptyActionBtn}
                activeOpacity={0.75}
              >
                <Icon name="Plus" size={13} color="#080C14" />
                <Text style={styles.emptyActionBtnText}>+ Tambah Kripto Baru</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            <View style={styles.assetList}>
              {displayedCryptos.map((crypto) => {
                const totalCost = (Number(crypto.holdings) || 0) * (Number(crypto.avgBuyPriceIdr) || 0);
                const marketVal = (Number(crypto.holdings) || 0) * (Number(crypto.currentPriceIdr) || 0);
                const pnlRp = marketVal - totalCost;
                const pnlPct = totalCost > 0 ? pnlRp / totalCost : 0;
                const isProfit = pnlRp >= 0;

                return (
                  <GlassCard
                    key={crypto.id}
                    style={styles.assetCard}
                    borderTint="rgba(245, 158, 11, 0.16)"
                    onPress={() => {
                      triggerHaptic('light');
                      setSelectedCrypto(crypto);
                      setCryptoModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.tickerBadgeRow}>
                          <Text style={styles.tickerText}>{crypto.symbol}</Text>
                          <View style={styles.cryptoTag}>
                            <Text style={styles.cryptoTagText}>CRYPTO</Text>
                          </View>
                        </View>
                        <Text style={styles.assetName}>{crypto.name}</Text>
                      </View>

                      <View style={styles.topRightActions}>
                        <PrivacyValue value={marketVal} style={styles.marketValText} />
                        <View style={styles.editPill}>
                          <Icon name="Edit2" size={11} color="#94A3B8" />
                          <Text style={styles.editPillText}>Edit</Text>
                        </View>
                      </View>
                    </View>

                    {/* Crypto Metrics Grid */}
                    <View style={styles.metricsGrid}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Holdings</Text>
                        <Text style={styles.metricValue}>
                          {crypto.holdings} {crypto.symbol}
                        </Text>
                        <Text style={styles.metricSub}>Koin</Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Harga Beli</Text>
                        <PrivacyValue value={crypto.avgBuyPriceIdr} style={styles.metricValue} compact />
                        <Text style={styles.metricSub}>IDR</Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Live Rate</Text>
                        <PrivacyValue value={crypto.currentPriceIdr} style={styles.metricValue} compact />
                        <Text style={[styles.metricSub, crypto.change24h >= 0 ? styles.textGreen : styles.textRed]}>
                          {formatPercent(crypto.change24h)}
                        </Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Unrealized PnL</Text>
                        <Text style={[styles.metricValue, isProfit ? styles.textGreen : styles.textRed]}>
                          {isProfit ? '+' : ''}
                          {formatPercent(pnlPct)}
                        </Text>
                        <PrivacyValue
                          value={pnlRp}
                          prefix={isProfit ? '+' : ''}
                          style={[styles.metricSub, isProfit ? styles.textGreen : styles.textRed]}
                          compact
                        />
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </View>
      )}
      </ScrollView>

      {/* Stock Modal */}
      <StockModal
        visible={stockModalVisible}
        onClose={() => setStockModalVisible(false)}
        stockToEdit={selectedStock}
      />

      {/* Crypto Modal */}
      <CryptoModal
        visible={cryptoModalVisible}
        onClose={() => setCryptoModalVisible(false)}
        cryptoToEdit={selectedCrypto}
      />
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  scrollContent: {
    paddingBottom: 120,
    gap: 14,
  },
  heroCard: {
    borderRadius: 24,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.1,
  },
  heroAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 4,
  },
  heroSparkline: {
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  addBtnSky: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#38BDF8',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 9,
  },
  addBtnAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 9,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#080C14',
  },
  pnlPod: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pnlPodLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  pnlValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  pnlAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  pnlChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  chipGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  chipRed: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  pnlChipText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  filterAndSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeFilterTab: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  activeFilterTabText: {
    color: '#38BDF8',
  },
  sortBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sortBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '500',
    padding: 0,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectionTotalVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  sectionRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAddBtnSky: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sectionAddBtnSkyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
  sectionAddBtnAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sectionAddBtnAmberText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  emptyCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  emptyCardDesc: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 260,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  emptyActionBtnSky: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  emptyActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#080C14',
  },
  assetList: {
    gap: 8,
  },
  assetCard: {
    borderRadius: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tickerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tickerText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  idxTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  idxTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38BDF8',
  },
  cryptoTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  cryptoTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
  },
  assetName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  topRightActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  marketValText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  editPillText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  metricSub: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  textGreen: {
    color: '#10B981',
  },
  textRed: {
    color: '#F43F5E',
  },
});
