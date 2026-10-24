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
import { ScreenTransition } from '../../src/components/common/screen-transition';
import { Sparkline } from '../../src/components/common/sparkline';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { CashMutationModal } from '../../src/components/modals/cash-mutation-modal';
import { useWealth } from '../../src/store/wealth-context';
import { formatPercent } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';

type Timeframe = '1H' | '1M' | '1B' | '1T' | 'ALL';
type AllocationHighlight = 'ALL' | 'CASH' | 'STOCKS' | 'CRYPTO';

export default function OverviewScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 375;
  const isLarge = width >= 414;

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
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1H');
  const [selectedAllocation, setSelectedAllocation] = useState<AllocationHighlight>('ALL');

  // Dynamic timeframe multiplier simulation for responsive feedback
  const timeframeMultipliers: Record<Timeframe, { pct: number; label: string }> = {
    '1H': { pct: dailyChangePercent, label: 'hari ini' },
    '1M': { pct: dailyChangePercent * 2.8 + 0.012, label: '1 minggu' },
    '1B': { pct: dailyChangePercent * 5.4 + 0.038, label: '1 bulan' },
    '1T': { pct: totalUnrealizedPnLPercent, label: '1 tahun' },
    'ALL': { pct: totalUnrealizedPnLPercent * 1.35, label: 'sepanjang masa' },
  };

  const currentChangePct = timeframeMultipliers[activeTimeframe].pct;
  const currentTimeLabel = timeframeMultipliers[activeTimeframe].label;
  const isCurrentProfit = currentChangePct >= 0;

  // Dynamic sparkline series based on active timeframe
  const baseSparklines: Record<Timeframe, number[]> = {
    '1H': [98, 99.2, 98.8, 99.5, 100.1, 99.8, 100.4, 101.2, 100.9, 101.8, 102.1, 102.7, 103],
    '1M': [92, 93.8, 93.1, 95.2, 96.0, 95.5, 97.4, 98.1, 98.9, 99.6, 101.2, 102.4, 103.8],
    '1B': [88, 90.2, 91.5, 89.8, 92.4, 94.1, 93.5, 96.2, 97.5, 99.1, 98.6, 101.4, 104],
    '1T': [76, 79.5, 83.2, 81.0, 85.4, 88.0, 86.5, 90.1, 93.4, 96.2, 98.5, 101.0, 104.5],
    'ALL': [62, 67.0, 71.5, 76.0, 74.2, 81.0, 85.5, 89.2, 92.0, 96.4, 98.0, 102.1, 105],
  };

  const zeroSparkline = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50];

  const activeSparklineData = totalNetWorth === 0
    ? zeroSparkline
    : isCurrentProfit
    ? baseSparklines[activeTimeframe]
    : baseSparklines[activeTimeframe].slice().reverse();

  // Proportional multi-segment allocation calculation
  const cashPct = totalNetWorth > 0 ? (totalCash / totalNetWorth) * 100 : 0;
  const stockPct = totalNetWorth > 0 ? (totalStocks / totalNetWorth) * 100 : 0;
  const cryptoPct = totalNetWorth > 0 ? (totalCryptos / totalNetWorth) * 100 : 0;

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

  const isPnLProfit = totalUnrealizedPnL >= 0;

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
        {/* HERO NET WORTH POD */}
        <GlassCard
          style={styles.heroCard}
          borderTint="rgba(56, 189, 248, 0.25)"
          gradientColors={['rgba(56, 189, 248, 0.10)', 'rgba(15, 23, 42, 0.55)']}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroLabel}>TOTAL NET WORTH</Text>
              <View style={styles.livePulseDot} />
            </View>

            {/* Dynamic Growth Badge */}
            <View style={[styles.dailyBadge, isCurrentProfit ? styles.badgeGreen : styles.badgeRed]}>
              <Icon
                name={isCurrentProfit ? 'ArrowUpRight' : 'ArrowDownRight'}
                size={12}
                color={isCurrentProfit ? '#10B981' : '#F43F5E'}
              />
              <Text style={[styles.dailyBadgeText, isCurrentProfit ? styles.textGreen : styles.textRed]}>
                {formatPercent(currentChangePct)} ({currentTimeLabel})
              </Text>
            </View>
          </View>

          {/* Super Dominant Currency Display */}
          <View style={styles.dominantAmountContainer}>
            <PrivacyValue
              value={totalNetWorth}
              style={[
                styles.dominantAmountText,
                { fontSize: isSmall ? 28 : isLarge ? 36 : 32 },
              ]}
            />
          </View>

          {/* Luxury Micro Sparkline */}
          <Sparkline
            data={activeSparklineData}
            isPositive={isCurrentProfit}
            height={36}
            style={styles.sparklineContainer}
          />

          {/* Fluid Interactive Timeframe Switcher */}
          <View style={styles.timeframeRow}>
            {(['1H', '1M', '1B', '1T', 'ALL'] as Timeframe[]).map((tf) => {
              const isActive = activeTimeframe === tf;
              return (
                <TouchableOpacity
                  key={tf}
                  onPress={() => {
                    triggerHaptic('selection');
                    setActiveTimeframe(tf);
                  }}
                  activeOpacity={0.65}
                  style={[styles.timeframeChip, isActive && styles.activeTimeframeChip]}
                >
                  <Text style={[styles.timeframeChipText, isActive && styles.activeTimeframeChipText]}>
                    {tf}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dynamic Allocation Bar */}
          {totalNetWorth > 0 ? (
            <View style={styles.allocationBarContainer}>
              <View
                style={[
                  styles.allocationSegment,
                  {
                    width: `${Math.max(2, cashPct)}%`,
                    backgroundColor: '#10B981',
                    opacity: selectedAllocation === 'ALL' || selectedAllocation === 'CASH' ? 1 : 0.35,
                  },
                ]}
              />
              <View
                style={[
                  styles.allocationSegment,
                  {
                    width: `${Math.max(2, stockPct)}%`,
                    backgroundColor: '#38BDF8',
                    opacity: selectedAllocation === 'ALL' || selectedAllocation === 'STOCKS' ? 1 : 0.35,
                  },
                ]}
              />
              <View
                style={[
                  styles.allocationSegment,
                  {
                    width: `${Math.max(2, cryptoPct)}%`,
                    backgroundColor: '#F59E0B',
                    opacity: selectedAllocation === 'ALL' || selectedAllocation === 'CRYPTO' ? 1 : 0.35,
                  },
                ]}
              />
            </View>
          ) : (
            <View style={styles.emptyAllocationBar}>
              <Text style={styles.emptyAllocationText}>Belum ada aset terdaftar • Saldo Rp 0</Text>
            </View>
          )}

          {/* Interactive Legend Chips */}
          <View style={styles.legendRow}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setSelectedAllocation(selectedAllocation === 'CASH' ? 'ALL' : 'CASH');
              }}
              activeOpacity={0.7}
              style={[
                styles.legendItem,
                selectedAllocation === 'CASH' && styles.legendItemActive,
              ]}
            >
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendLabel}>Kas {cashPct.toFixed(0)}%</Text>
              {selectedAllocation === 'CASH' && (
                <PrivacyValue value={totalCash} style={styles.activeAllocationVal} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setSelectedAllocation(selectedAllocation === 'STOCKS' ? 'ALL' : 'STOCKS');
              }}
              activeOpacity={0.7}
              style={[
                styles.legendItem,
                selectedAllocation === 'STOCKS' && styles.legendItemActive,
              ]}
            >
              <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
              <Text style={styles.legendLabel}>Saham {stockPct.toFixed(0)}%</Text>
              {selectedAllocation === 'STOCKS' && (
                <PrivacyValue value={totalStocks} style={styles.activeAllocationVal} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setSelectedAllocation(selectedAllocation === 'CRYPTO' ? 'ALL' : 'CRYPTO');
              }}
              activeOpacity={0.7}
              style={[
                styles.legendItem,
                selectedAllocation === 'CRYPTO' && styles.legendItemActive,
              ]}
            >
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendLabel}>Kripto {cryptoPct.toFixed(0)}%</Text>
              {selectedAllocation === 'CRYPTO' && (
                <PrivacyValue value={totalCryptos} style={styles.activeAllocationVal} />
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* ASYMMETRIC 2-COLUMN BENTO GRID */}
        <View style={styles.bentoContainer}>
          {/* Left Column: Full Height Active Investment Pod */}
          <GlassCard
            style={styles.investmentPodCard}
            borderTint="rgba(56, 189, 248, 0.20)"
            gradientColors={['rgba(56, 189, 248, 0.08)', 'rgba(15, 23, 42, 0.50)']}
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/portfolio');
            }}
          >
            <View style={styles.podTopRow}>
              <View style={styles.podIconBadge}>
                <Icon name="TrendingUp" size={16} color="#38BDF8" />
              </View>
              <View style={styles.tapArrowBadge}>
                <Icon name="ArrowUpRight" size={13} color="#38BDF8" />
              </View>
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
          </GlassCard>

          {/* Right Column: 2 Stacked Cards */}
          <View style={styles.bentoRightCol}>
            {/* Top Right Card: Cash Liquidity */}
            <GlassCard
              style={styles.cashPodCard}
              borderTint="rgba(16, 185, 129, 0.22)"
              gradientColors={['rgba(16, 185, 129, 0.08)', 'rgba(15, 23, 42, 0.50)']}
              onPress={() => {
                triggerHaptic('selection');
                router.push('/(tabs)/accounts');
              }}
            >
              <View style={styles.cashHeader}>
                <View style={styles.cashIconMini}>
                  <Icon name="Wallet" size={13} color="#10B981" />
                </View>
                <Text style={styles.podLabel}>Kas & RDN</Text>
              </View>
              <PrivacyValue value={totalCash} style={styles.cashAmount} />
              <Text style={styles.cashSubtext}>Tersedia untuk transaksi &rarr;</Text>
            </GlassCard>

            {/* Bottom Right Card: Action Shortcuts */}
            <GlassCard
              style={styles.actionPodCard}
              borderTint="rgba(245, 158, 11, 0.22)"
              gradientColors={['rgba(245, 158, 11, 0.08)', 'rgba(15, 23, 42, 0.50)']}
            >
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  setMutationModalVisible(true);
                }}
                style={styles.quickActionBtn}
                activeOpacity={0.65}
              >
                <Icon name="Plus" size={13} color="#10B981" />
                <Text style={styles.quickActionText}>+ Catat Mutasi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  router.push('/(tabs)/sync');
                }}
                style={[styles.quickActionBtn, styles.syncQuickBtn]}
                activeOpacity={0.65}
              >
                <Icon name="RefreshCw" size={13} color="#F59E0B" />
                <Text style={[styles.quickActionText, { color: '#F59E0B' }]}>Sync SoA</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </View>

        {/* SMART AI WEALTH INTELLIGENCE POD */}
        <GlassCard
          style={styles.insightCard}
          borderTint="rgba(56, 189, 248, 0.22)"
          gradientColors={['rgba(56, 189, 248, 0.08)', 'rgba(15, 23, 42, 0.50)']}
        >
          <View style={styles.insightHeader}>
            <View style={styles.insightBadge}>
              <Icon name="Sparkles" size={13} color="#38BDF8" />
              <Text style={styles.insightBadgeText}>AI WEALTH INTELLIGENCE</Text>
            </View>
            <View style={styles.insightStatusPill}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: totalNetWorth === 0 ? '#38BDF8' : cashPct >= 25 ? '#10B981' : '#F59E0B' },
                ]}
              />
              <Text style={styles.insightHealthText}>
                {totalNetWorth === 0 ? 'Siap Memulai' : cashPct >= 25 ? 'Likuiditas Prima' : 'Agresif Terinvestasi'}
              </Text>
            </View>
          </View>
          <Text style={styles.insightBody}>
            {totalNetWorth === 0
              ? 'Selamat datang di OmniWealth! Mulai hubungkan rekening kas, catat transaksi mutasi, atau import Statement of Account (SoA) Stockbit untuk analisis portofolio otomatis.'
              : cashPct >= 25
              ? `Rasio kas Anda berada di level sehat (${cashPct.toFixed(0)}%). Anda memiliki likuiditas optimal untuk strategi Dollar Cost Averaging (DCA) atau akumulasi saham berkualitas saat IHSG koreksi.`
              : `Alokasi portofolio investasi mendominasi ${(stockPct + cryptoPct).toFixed(0)}%. Pertimbangkan menyisihkan kas likuid minimal 3 bulan pengeluaran rutin.`}
          </Text>
        </GlassCard>

        {/* HIGH-DENSITY TOP MOVERS */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="Sparkles" size={15} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Top Movers Hari Ini</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/portfolio');
            }}
            activeOpacity={0.65}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>Semua Aset &rarr;</Text>
          </TouchableOpacity>
        </View>

        {allMovers.length === 0 ? (
          <GlassCard style={styles.welcomeCard} borderTint="rgba(56, 189, 248, 0.22)">
            <View style={styles.welcomeTop}>
              <View style={styles.welcomeIconCircle}>
                <Icon name="Sparkles" size={20} color="#38BDF8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeTitle}>Mulai Catat Kekayaan Anda</Text>
                <Text style={styles.welcomeDesc}>
                  Pantau rekening bank, mutasi otomatis, serta portofolio saham IDX & kripto dalam satu aplikasi.
                </Text>
              </View>
            </View>
            <View style={styles.welcomeActions}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  router.push('/(tabs)/accounts');
                }}
                style={styles.welcomeBtnPrimary}
                activeOpacity={0.75}
              >
                <Icon name="Plus" size={12} color="#080C14" />
                <Text style={styles.welcomeBtnPrimaryText}>+ Tambah Kas / Akun</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  router.push('/(tabs)/sync');
                }}
                style={styles.welcomeBtnSecondary}
                activeOpacity={0.75}
              >
                <Icon name="UploadCloud" size={12} color="#38BDF8" />
                <Text style={styles.welcomeBtnSecondaryText}>Sync SoA Stockbit</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ) : (
          <View style={styles.moversList}>
            {allMovers.map((mover) => {
              const isUp = mover.change24h >= 0;
              return (
                <GlassCard
                  key={mover.id}
                  style={styles.moverCard}
                  borderTint="rgba(255, 255, 255, 0.09)"
                  onPress={() => {
                    triggerHaptic('selection');
                    router.push('/(tabs)/portfolio');
                  }}
                  activeOpacity={0.7}
                >
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
                    <View style={styles.moverInfo}>
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
        )}
      </ScrollView>

      {/* Cash Mutation Quick Modal */}
      <CashMutationModal
        visible={mutationModalVisible}
        onClose={() => setMutationModalVisible(false)}
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
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  badgeRed: {
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
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
    marginVertical: 4,
  },
  dominantAmountText: {
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.6,
  },
  sparklineContainer: {
    marginVertical: 6,
    paddingHorizontal: 2,
  },
  insightCard: {
    borderRadius: 20,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  insightBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  insightStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  insightHealthText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  insightBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#94A3B8',
    fontWeight: '400',
  },
  timeframeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
  },
  timeframeChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeTimeframeChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: 'rgba(56, 189, 248, 0.40)',
  },
  timeframeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTimeframeChipText: {
    color: '#38BDF8',
  },
  allocationBarContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
    gap: 2,
  },
  emptyAllocationBar: {
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  emptyAllocationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  allocationSegment: {
    height: '100%',
    borderRadius: 4,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  legendItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  activeAllocationVal: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '700',
    marginLeft: 2,
  },
  bentoContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  investmentPodCard: {
    flex: 1.15,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  podTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  podIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tapArrowBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  podMainValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 3,
    marginBottom: 6,
  },
  pnlContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  pnlSubValue: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  bentoRightCol: {
    flex: 0.95,
    gap: 10,
  },
  cashPodCard: {
    flex: 1,
    minHeight: 94,
    justifyContent: 'space-between',
  },
  cashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cashIconMini: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
    marginVertical: 2,
  },
  cashSubtext: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  actionPodCard: {
    flex: 1,
    minHeight: 94,
    justifyContent: 'center',
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
    marginTop: 6,
    marginBottom: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  seeAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  seeAllText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  moversList: {
    gap: 8,
  },
  moverCard: {
    borderRadius: 18,
  },
  moverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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
  moverInfo: {
    flex: 1,
  },
  moverSymbol: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  moverName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  moverRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  moverPrice: {
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  welcomeCard: {
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  welcomeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  welcomeDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: '#94A3B8',
  },
  welcomeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  welcomeBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  welcomeBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#080C14',
  },
  welcomeBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  welcomeBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
