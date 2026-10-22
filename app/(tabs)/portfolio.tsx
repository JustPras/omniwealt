import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Icon } from '../../src/components/common/icon';
import { HeaderBar } from '../../src/components/layout/header-bar';
import { GlassCard } from '../../src/components/common/glass-card';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { StockModal } from '../../src/components/modals/stock-modal';
import { CryptoModal } from '../../src/components/modals/crypto-modal';
import { useWealth } from '../../src/store/wealth-context';
import { formatIDR, formatPercent, formatNumber } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { StockAsset, CryptoAsset } from '../../src/types';

type AssetFilter = 'ALL' | 'STOCKS' | 'CRYPTO';

export default function PortfolioScreen() {
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
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockAsset | null>(null);

  const [cryptoModalVisible, setCryptoModalVisible] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(null);

  const isOverallProfit = totalUnrealizedPnL >= 0;

  return (
    <View style={styles.screenContainer}>
      <HeaderBar />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
          borderTint="rgba(56, 189, 248, 0.22)"
          gradientColors={['rgba(56, 189, 248, 0.08)', 'rgba(15, 23, 42, 0.4)']}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>TOTAL NILAI INVESTASI</Text>
              <PrivacyValue value={totalInvestments} style={styles.heroAmount} />
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  setSelectedStock(null);
                  setStockModalVisible(true);
                }}
                style={styles.addBtnSky}
                activeOpacity={0.8}
              >
                <Icon name="Plus" size={13} color="#080C14" />
                <Text style={styles.addBtnText}>+ Saham</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  setSelectedCrypto(null);
                  setCryptoModalVisible(true);
                }}
                style={styles.addBtnAmber}
                activeOpacity={0.8}
              >
                <Icon name="Plus" size={13} color="#080C14" />
                <Text style={styles.addBtnText}>+ Kripto</Text>
              </TouchableOpacity>
            </View>
          </View>

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
                {isOverallProfit ? (
                  <Icon name="ArrowUpRight" size={13} color="#10B981" />
                ) : (
                  <Icon name="ArrowDownRight" size={13} color="#F43F5E" />
                )}
                <Text style={[styles.pnlChipText, isOverallProfit ? styles.textGreen : styles.textRed]}>
                  {formatPercent(totalUnrealizedPnLPercent)}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* SEGMENTED GLASS FILTER */}
        <View style={styles.filterContainer}>
          {(['ALL', 'STOCKS', 'CRYPTO'] as AssetFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => {
                triggerHaptic('selection');
                setActiveFilter(f);
              }}
              style={[styles.filterTab, activeFilter === f && styles.activeFilterTab]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, activeFilter === f && styles.activeFilterTabText]}>
                {f === 'ALL' ? 'Semua Aset' : f === 'STOCKS' ? 'Saham IDX' : 'Kripto'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* IDX STOCKS SECTION */}
        {(activeFilter === 'ALL' || activeFilter === 'STOCKS') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.titleWithIcon}>
                <Icon name="TrendingUp" size={16} color="#38BDF8" />
                <Text style={styles.sectionTitle}>Portofolio Saham Indonesia (IDX)</Text>
              </View>
              <PrivacyValue value={totalStocks} style={styles.sectionTotalVal} />
            </View>

            <View style={styles.assetList}>
              {stocks.map((stock) => {
                const totalCost = (Number(stock.lots) || 0) * 100 * (Number(stock.avgBuyPrice) || 0);
                const marketVal = (Number(stock.lots) || 0) * 100 * (Number(stock.currentPrice) || 0);
                const pnlRp = marketVal - totalCost;
                const pnlPct = totalCost > 0 ? pnlRp / totalCost : 0;
                const isProfit = pnlRp >= 0;

                return (
                  <GlassCard
                    key={stock.id}
                    style={styles.assetCard}
                    borderTint="rgba(56, 189, 248, 0.15)"
                  >
                    <View style={styles.cardTopRow}>
                      <View>
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
                        <TouchableOpacity
                          onPress={() => {
                            triggerHaptic('light');
                            setSelectedStock(stock);
                            setStockModalVisible(true);
                          }}
                          style={styles.editIconBtn}
                        >
                          <Icon name="Edit2" size={13} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Stock Metrics Grid */}
                    <View style={styles.metricsGrid}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Jumlah</Text>
                        <Text style={styles.metricValue}>{stock.lots} Lot</Text>
                        <Text style={styles.metricSub}>{stock.lots * 100} lbr</Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Avg Buy</Text>
                        <PrivacyValue value={stock.avgBuyPrice} style={styles.metricValue} />
                        <Text style={styles.metricSub}>Modal</Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Live Price</Text>
                        <PrivacyValue value={stock.currentPrice} style={styles.metricValue} />
                        <Text style={[styles.metricSub, stock.change24h >= 0 ? styles.textGreen : styles.textRed]}>
                          {formatPercent(stock.change24h)}
                        </Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Floating PnL</Text>
                        <Text style={[styles.metricValue, isProfit ? styles.textGreen : styles.textRed]}>
                          {isProfit ? '+' : ''}
                          {formatPercent(pnlPct)}
                        </Text>
                        <PrivacyValue
                          value={pnlRp}
                          prefix={isProfit ? '+' : ''}
                          style={[styles.metricSub, isProfit ? styles.textGreen : styles.textRed]}
                        />
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </View>
        )}

        {/* CRYPTO ASSETS SECTION */}
        {(activeFilter === 'ALL' || activeFilter === 'CRYPTO') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.titleWithIcon}>
                <Icon name="Coins" size={16} color="#F59E0B" />
                <Text style={styles.sectionTitle}>Portofolio Aset Kripto</Text>
              </View>
              <PrivacyValue value={totalCryptos} style={styles.sectionTotalVal} />
            </View>

            <View style={styles.assetList}>
              {cryptos.map((crypto) => {
                const totalCost = (Number(crypto.holdings) || 0) * (Number(crypto.avgBuyPriceIdr) || 0);
                const marketVal = (Number(crypto.holdings) || 0) * (Number(crypto.currentPriceIdr) || 0);
                const pnlRp = marketVal - totalCost;
                const pnlPct = totalCost > 0 ? pnlRp / totalCost : 0;
                const isProfit = pnlRp >= 0;

                return (
                  <GlassCard
                    key={crypto.id}
                    style={styles.assetCard}
                    borderTint="rgba(245, 158, 11, 0.15)"
                  >
                    <View style={styles.cardTopRow}>
                      <View>
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
                        <TouchableOpacity
                          onPress={() => {
                            triggerHaptic('light');
                            setSelectedCrypto(crypto);
                            setCryptoModalVisible(true);
                          }}
                          style={styles.editIconBtn}
                        >
                          <Icon name="Edit2" size={13} color="#94A3B8" />
                        </TouchableOpacity>
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
                        <Text style={styles.metricLabel}>Avg Price</Text>
                        <PrivacyValue value={crypto.avgBuyPriceIdr} style={styles.metricValue} compact />
                        <Text style={styles.metricSub}>IDR</Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>CoinGecko Live</Text>
                        <PrivacyValue value={crypto.currentPriceIdr} style={styles.metricValue} compact />
                        <Text style={[styles.metricSub, crypto.change24h >= 0 ? styles.textGreen : styles.textRed]}>
                          {formatPercent(crypto.change24h)}
                        </Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Floating PnL</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  heroActions: {
    flexDirection: 'row',
    gap: 6,
  },
  addBtnSky: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#38BDF8',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  addBtnAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#080C14',
  },
  pnlPod: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
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
    marginTop: 4,
  },
  pnlAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  pnlChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  chipGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  chipRed: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  pnlChipText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeFilterTab: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterTabText: {
    color: '#38BDF8',
  },
  sectionBlock: {
    gap: 10,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  assetList: {
    gap: 10,
  },
  assetCard: {
    borderRadius: 20,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tickerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tickerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  idxTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  idxTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38BDF8',
  },
  cryptoTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  editIconBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '700',
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
