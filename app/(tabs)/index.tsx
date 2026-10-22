import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../src/components/common/icon';
import { HeaderBar } from '../../src/components/layout/header-bar';
import { GlassCard } from '../../src/components/common/glass-card';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { CashMutationModal } from '../../src/components/modals/cash-mutation-modal';
import { useWealth } from '../../src/store/wealth-context';
import { formatIDR, formatPercent } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';

export default function OverviewScreen() {
  const { width } = useWindowDimensions();
  const {
    totalNetWorth,
    totalCash,
    totalStocks,
    totalCryptos,
    totalInvestments,
    totalUnrealizedPnL,
    totalUnrealizedPnLPercent,
    dailyChangeRp,
    dailyChangePercent,
    stocks,
    cryptos,
    isRefreshing,
    refreshMarketPrices,
  } = useWealth();

  const [mutationModalVisible, setMutationModalVisible] = useState(false);

  // Proportional multi-segment allocation calculation
  const cashPct = totalNetWorth > 0 ? (totalCash / totalNetWorth) * 100 : 33.3;
  const stockPct = totalNetWorth > 0 ? (totalStocks / totalNetWorth) * 100 : 33.3;
  const cryptoPct = totalNetWorth > 0 ? (totalCryptos / totalNetWorth) * 100 : 33.4;

  // High-Density Top Movers (combined Stocks & Cryptos sorted by largest absolute 24h change)
  const allMovers = [
    ...stocks.map((s) => ({
      id: s.id,
      symbol: s.ticker.replace('.JK', ''),
      name: s.name,
      type: 'IDX' as const,
      change24h: s.change24h,
      currentPrice: s.currentPrice,
    })),
    ...cryptos.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      type: 'CRYPTO' as const,
      change24h: c.change24h,
      currentPrice: c.currentPriceIdr,
    })),
  ].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 4);

  const isDailyProfit = dailyChangeRp >= 0;
  const isPnLProfit = totalUnrealizedPnL >= 0;

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
        {/* HERO NET WORTH POD */}
        <GlassCard
          style={styles.heroCard}
          borderTint="rgba(56, 189, 248, 0.22)"
          gradientColors={['rgba(56, 189, 248, 0.08)', 'rgba(15, 23, 42, 0.4)']}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>TOTAL NET WORTH</Text>
            <View style={[styles.dailyBadge, isDailyProfit ? styles.badgeGreen : styles.badgeRed]}>
              {isDailyProfit ? (
                <Icon name="ArrowUpRight" size={13} color="#10B981" />
              ) : (
                <Icon name="ArrowDownRight" size={13} color="#F43F5E" />
              )}
              <Text style={[styles.dailyBadgeText, isDailyProfit ? styles.textGreen : styles.textRed]}>
                {formatPercent(dailyChangePercent)} (hari ini)
              </Text>
            </View>
          </View>

          {/* Super Dominant Currency Display */}
          <View style={styles.dominantAmountContainer}>
            <PrivacyValue value={totalNetWorth} style={styles.dominantAmountText} />
          </View>

          {/* Allocation Bar */}
          <View style={styles.allocationBarContainer}>
            <View style={[styles.allocationSegment, { width: `${Math.max(4, cashPct)}%`, backgroundColor: '#10B981' }]} />
            <View style={[styles.allocationSegment, { width: `${Math.max(4, stockPct)}%`, backgroundColor: '#38BDF8' }]} />
            <View style={[styles.allocationSegment, { width: `${Math.max(4, cryptoPct)}%`, backgroundColor: '#F59E0B' }]} />
          </View>

          {/* Legend Items */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendLabel}>Kas {cashPct.toFixed(0)}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
              <Text style={styles.legendLabel}>Saham {stockPct.toFixed(0)}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendLabel}>Kripto {cryptoPct.toFixed(0)}%</Text>
            </View>
          </View>
        </GlassCard>

        {/* ASYMMETRIC 2-COLUMN BENTO GRID */}
        <View style={styles.bentoContainer}>
          {/* Left Column: Full Height Active Investment Pod */}
          <View style={styles.bentoLeftCol}>
            <GlassCard
              style={styles.investmentPodCard}
              borderTint="rgba(255, 255, 255, 0.12)"
            >
              <View style={styles.podIconBadge}>
                <Icon name="TrendingUp" size={16} color="#38BDF8" />
              </View>
              <Text style={styles.podLabel}>Investasi Aktif</Text>
              <PrivacyValue value={totalInvestments} style={styles.podMainValue} />

              <View style={styles.pnlContainer}>
                <Text style={styles.pnlTitle}>Unrealized PnL</Text>
                <View style={styles.pnlRow}>
                  <Text style={[styles.pnlValue, isPnLProfit ? styles.textGreen : styles.textRed]}>
                    {isPnLProfit ? '+' : ''}
                    {formatPercent(totalUnrealizedPnLPercent)}
                  </Text>
                </View>
                <PrivacyValue
                  value={totalUnrealizedPnL}
                  prefix={isPnLProfit ? '+' : ''}
                  style={[styles.pnlSubValue, isPnLProfit ? styles.textGreen : styles.textRed]}
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('selection');
                  router.push('/(tabs)/portfolio');
                }}
                style={styles.inspectBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.inspectBtnText}>Lihat Portofolio</Text>
                <Icon name="ArrowUpRight" size={13} color="#38BDF8" />
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* Right Column: 2 Stacked Cards */}
          <View style={styles.bentoRightCol}>
            {/* Top Right Card: Cash Liquidity */}
            <GlassCard
              style={styles.cashPodCard}
              borderTint="rgba(16, 185, 129, 0.2)"
            >
              <View style={styles.cashHeader}>
                <Icon name="Wallet" size={15} color="#10B981" />
                <Text style={styles.podLabel}>Kas & RDN</Text>
              </View>
              <PrivacyValue value={totalCash} style={styles.cashAmount} />
              <Text style={styles.cashSubtext}>Tersedia untuk transaksi</Text>
            </GlassCard>

            {/* Bottom Right Card: Action Shortcuts */}
            <GlassCard
              style={styles.actionPodCard}
              borderTint="rgba(245, 158, 11, 0.2)"
            >
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  setMutationModalVisible(true);
                }}
                style={styles.quickActionBtn}
                activeOpacity={0.7}
              >
                <Icon name="Plus" size={14} color="#10B981" />
                <Text style={styles.quickActionText}>+ Catat Mutasi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  router.push('/(tabs)/sync');
                }}
                style={[styles.quickActionBtn, styles.syncQuickBtn]}
                activeOpacity={0.7}
              >
                <Icon name="RefreshCw" size={13} color="#F59E0B" />
                <Text style={[styles.quickActionText, { color: '#F59E0B' }]}>Sync SoA</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </View>

        {/* HIGH-DENSITY TOP MOVERS */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="Sparkles" size={16} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Top Movers Hari Ini</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/portfolio');
            }}
          >
            <Text style={styles.seeAllText}>Semua Aset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.moversList}>
          {allMovers.map((mover) => {
            const isUp = mover.change24h >= 0;
            return (
              <GlassCard key={mover.id} style={styles.moverCard}>
                <View style={styles.moverLeft}>
                  <View
                    style={[
                      styles.moverIconBadge,
                      mover.type === 'IDX' ? styles.idxBadge : styles.cryptoBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.moverBadgeText,
                        mover.type === 'IDX' ? styles.textSky : styles.textAmber,
                      ]}
                    >
                      {mover.type}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.moverSymbol}>{mover.symbol}</Text>
                    <Text style={styles.moverName} numberOfLines={1}>
                      {mover.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.moverRight}>
                  <PrivacyValue
                    value={mover.currentPrice}
                    style={styles.moverPrice}
                  />
                  <View style={[styles.changeChip, isUp ? styles.chipGreen : styles.chipRed]}>
                    <Text style={[styles.changeChipText, isUp ? styles.textGreen : styles.textRed]}>
                      {formatPercent(mover.change24h)}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            );
          })}
        </View>
      </ScrollView>

      {/* Cash Mutation Quick Modal */}
      <CashMutationModal
        visible={mutationModalVisible}
        onClose={() => setMutationModalVisible(false)}
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
    padding: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeRed: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  dailyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  textGreen: {
    color: '#10B981',
  },
  textRed: {
    color: '#F43F5E',
  },
  dominantAmountContainer: {
    marginVertical: 10,
  },
  dominantAmountText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  allocationBarContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 10,
    gap: 2,
  },
  allocationSegment: {
    height: '100%',
    borderRadius: 4,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bentoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoLeftCol: {
    flex: 1.15,
  },
  investmentPodCard: {
    height: 220,
    justifyContent: 'space-between',
    padding: 16,
  },
  podIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  podLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  podMainValue: {
    fontSize: 19,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 4,
    marginBottom: 8,
  },
  pnlContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 8,
  },
  pnlTitle: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  pnlValue: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  pnlSubValue: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  inspectBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
  },
  bentoRightCol: {
    flex: 0.95,
    gap: 12,
  },
  cashPodCard: {
    height: 104,
    justifyContent: 'space-between',
    padding: 14,
  },
  cashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cashAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  cashSubtext: {
    fontSize: 9,
    color: '#64748B',
  },
  actionPodCard: {
    height: 104,
    justifyContent: 'center',
    padding: 10,
    gap: 6,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    paddingVertical: 7,
  },
  syncQuickBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  seeAllText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  moversList: {
    gap: 8,
  },
  moverCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  moverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moverIconBadge: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  idxBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  cryptoBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  moverBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textSky: {
    color: '#38BDF8',
  },
  textAmber: {
    color: '#F59E0B',
  },
  moverSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  moverName: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: 140,
  },
  moverRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  moverPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  changeChip: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  chipGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  chipRed: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  changeChipText: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
