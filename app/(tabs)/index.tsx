import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Animated,
  useWindowDimensions,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../../src/components/common/icon';
import { HeaderBar } from '../../src/components/layout/header-bar';
import { GlassCard } from '../../src/components/common/glass-card';
import { LiquidButton } from '../../src/components/common/liquid-button';
import { ScreenTransition } from '../../src/components/common/screen-transition';
import { AmbientBackground } from '../../src/components/common/ambient-background';
import { Sparkline, ScrubPoint } from '../../src/components/common/sparkline';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { CashMutationModal } from '../../src/components/modals/cash-mutation-modal';
import { LiabilityService } from '../../src/services/liability-service';
import { useWealth } from '../../src/store/wealth-context';
import { formatPercent, formatChangePercent, formatIDR } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { color, space, radius, shadow, motion, useTheme, themes, font, isDarkTheme, Colors } from '../../src/theme/tokens';

type Timeframe = '1H' | '1M' | '1B' | '1T' | 'Semua';
type AllocationType = 'ALL' | 'CASH' | 'STOCKS' | 'CRYPTO';

const ZERO_POINTS = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50];
const ZERO_LABELS = ['Live', 'Live', 'Live', 'Live', 'Live', 'Live', 'Live', 'Live', 'Live', 'Live', 'Live', 'Live'];

const BASE_SPARKLINES: Record<Timeframe, { points: number[]; labels: string[] }> = {
  '1H': {
    points: [98.5, 99.0, 98.8, 99.4, 100.2, 99.9, 100.5, 101.2, 101.0, 101.8, 102.3, 103.0],
    labels: ['09:00', '10:00', '11:00', '11:30', '13:30', '14:00', '14:30', '15:00', '15:30', '15:45', '15:55', 'Live'],
  },
  '1M': {
    points: [93.0, 94.2, 93.8, 95.5, 96.2, 95.8, 97.4, 98.6, 99.2, 100.5, 101.8, 103.5],
    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Kemarin', 'Hari ini'],
  },
  '1B': {
    points: [89.0, 90.5, 91.2, 89.8, 92.4, 94.0, 93.5, 96.0, 97.5, 99.0, 101.2, 104.0],
    labels: ['Mgg 1', 'Mgg 1', 'Mgg 2', 'Mgg 2', 'Mgg 3', 'Mgg 3', 'Mgg 4', 'Mgg 4', 'Kemarin', 'Hari ini', 'Hari ini', 'Live'],
  },
  '1T': {
    points: [78.0, 81.0, 84.5, 82.0, 86.0, 89.0, 87.5, 91.0, 94.5, 98.0, 101.0, 105.0],
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  },
  'Semua': {
    points: [65.0, 70.0, 74.0, 78.5, 76.0, 83.0, 87.0, 90.5, 93.0, 97.5, 101.0, 105.5],
    labels: ['Awal', '2023', '2023', '2024', '2024', '2025', '2025', '2026 Q1', '2026 Q2', '2026 Q3', 'Kemarin', 'Live'],
  },
};

const TIMEFRAMES: Timeframe[] = ['1H', '1M', '1B', '1T', 'Semua'];

const TimeframeButton: React.FC<{
  tf: Timeframe;
  isActive: boolean;
  onPress: () => void;
}> = React.memo(({ tf, isActive, onPress }) => {
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 0.9,
      tension: 260,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 1,
      tension: motion.spring.settle.tension,
      friction: motion.spring.settle.friction,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={styles.timeframeButton}
    >
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <Text
          style={[
            styles.timeframeText,
            isActive && styles.activeTimeframeText,
          ]}
        >
          {tf}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

interface LiquidTimeframeSelectorProps {
  activeTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
}

const LiquidTimeframeSelector: React.FC<LiquidTimeframeSelectorProps> = React.memo(
  ({ activeTimeframe, onSelectTimeframe }) => {
    const [rowWidth, setRowWidth] = useState(0);

    const tfIndex = TIMEFRAMES.indexOf(activeTimeframe);
    const currentPosition = useRef(new Animated.Value(tfIndex)).current;
    const flowSurge = useRef(new Animated.Value(0)).current;
    const waveAnim = useRef(new Animated.Value(0)).current;
    const prevIndexRef = useRef(tfIndex);

    const numItems = TIMEFRAMES.length; // 5
    const rowPadding = 3;
    const innerWidth = rowWidth > 0 ? rowWidth - rowPadding * 2 : 0;
    const itemWidth = innerWidth > 0 ? innerWidth / numItems : 60;
    const capsuleWidth = itemWidth;
    const capsuleHeight = 28;

    const getCenterPos = useCallback(
      (idx: number) => rowPadding + idx * itemWidth,
      [itemWidth]
    );

    useEffect(() => {
      const fromIndex = prevIndexRef.current;
      const toIndex = TIMEFRAMES.indexOf(activeTimeframe);

      if (fromIndex !== toIndex) {
        prevIndexRef.current = toIndex;
        const distance = Math.abs(toIndex - fromIndex);
        const maxStretch = Math.min(1.0 + distance * 0.28, 1.85);

        waveAnim.setValue(0);

        Animated.parallel([
          Animated.spring(currentPosition, {
            toValue: toIndex,
            tension: 175,
            friction: 14,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(flowSurge, {
              toValue: maxStretch,
              duration: 120,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.spring(flowSurge, {
              toValue: 0,
              tension: 185,
              friction: 13,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.bezier(0.2, 0.0, 0.2, 1),
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [activeTimeframe, currentPosition, flowSurge, waveAnim]);

    const inputRange = [0, 1, 2, 3, 4];
    const outputRange = [
      getCenterPos(0),
      getCenterPos(1),
      getCenterPos(2),
      getCenterPos(3),
      getCenterPos(4),
    ];

    const translateX = currentPosition.interpolate({
      inputRange,
      outputRange,
      extrapolate: 'clamp',
    });

    const scaleX = flowSurge.interpolate({
      inputRange: [0, 1],
      outputRange: [1.0, 1.28],
    });

    const scaleY = flowSurge.interpolate({
      inputRange: [0, 1],
      outputRange: [1.0, 0.86],
    });

    return (
      <View
        style={styles.timeframeRow}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - rowWidth) > 1) {
            setRowWidth(w);
          }
        }}
      >
        {/* Flowing Champagne Gold Liquid Capsule */}
        {rowWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.timeframeLiquidCapsule,
              {
                width: capsuleWidth,
                height: capsuleHeight,
                transform: [{ translateX }, { scaleX }, { scaleY }],
              },
            ]}
          >
            <View style={styles.timeframeLiquidInner}>
              <View style={styles.timeframeLiquidNucleus} />
              <View style={styles.timeframeSpecularGlint} />
            </View>
            <View style={styles.timeframeActiveDot} />
          </Animated.View>
        )}

        {/* 5 Timeframe Buttons */}
        {TIMEFRAMES.map((tf) => {
          const isActive = activeTimeframe === tf;
          return (
            <TimeframeButton
              key={tf}
              tf={tf}
              isActive={isActive}
              onPress={() => {
                triggerHaptic('selection');
                onSelectTimeframe(tf);
              }}
            />
          );
        })}
      </View>
    );
  }
);

export default function OverviewScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 375;
  const theme = useTheme();

  const {
    accounts,
    totalNetWorth,
    totalCash,
    totalStocks,
    totalCryptos,
    totalGrossAssets,
    totalLiabilities,
    liabilities,
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
  const [selectedAllocation, setSelectedAllocation] = useState<AllocationType>('ALL');

  // Breakdown for 2x2 Bento Grid
  const rdnCash = useMemo(() => {
    return accounts
      .filter((a) => a.type === 'RDN')
      .reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  }, [accounts]);

  const bankCash = useMemo(() => {
    return accounts
      .filter((a) => a.type === 'BANK' || a.type === 'E-WALLET')
      .reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  }, [accounts]);

  // Upcoming Due Date Alerts for liabilities
  const upcomingBills = useMemo(() => {
    return LiabilityService.getDueAlerts(liabilities);
  }, [liabilities]);
  const topDueAlert = upcomingBills.length > 0 ? upcomingBills[0] : null;

  // Hero Scrubber State: When user drags across the chart
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPoint, setScrubPoint] = useState<ScrubPoint | null>(null);

  // Parallax scroll tracking for AmbientBackground
  const scrollY = useRef(new Animated.Value(0)).current;

  // Timeframe labels and dynamic mock historical points
  const timeframeLabels: Record<Timeframe, { pct: number; label: string }> = useMemo(
    () => ({
      '1H': { pct: dailyChangePercent, label: 'hari ini' },
      '1M': { pct: dailyChangePercent * 2.4 + 0.012, label: '1 minggu' },
      '1B': { pct: dailyChangePercent * 4.8 + 0.028, label: '1 bulan' },
      '1T': { pct: totalUnrealizedPnLPercent, label: '1 tahun' },
      'Semua': { pct: totalUnrealizedPnLPercent * 1.25, label: 'sepanjang masa' },
    }),
    [dailyChangePercent, totalUnrealizedPnLPercent]
  );

  const currentChangePct = timeframeLabels[activeTimeframe].pct;
  const currentTimeLabel = timeframeLabels[activeTimeframe].label;
  const isCurrentProfit = currentChangePct >= 0;

  const { activePoints, activeLabels } = useMemo(() => {
    if (totalNetWorth === 0) {
      return {
        activePoints: ZERO_POINTS,
        activeLabels: ZERO_LABELS,
      };
    }
    return {
      activePoints: isCurrentProfit
        ? BASE_SPARKLINES[activeTimeframe].points
        : BASE_SPARKLINES[activeTimeframe].points.slice().reverse(),
      activeLabels: BASE_SPARKLINES[activeTimeframe].labels,
    };
  }, [totalNetWorth, isCurrentProfit, activeTimeframe]);

  const handleScrub = useCallback(
    (point: ScrubPoint) => {
      setIsScrubbing(true);
      const latestPoint = activePoints[activePoints.length - 1] || 1;
      const ratio = point.val / latestPoint;
      const simulatedVal = Math.round(totalNetWorth * ratio);

      setScrubPoint({
        val: simulatedVal,
        label: point.label,
        changePct: point.changePct,
      });
    },
    [activePoints, totalNetWorth]
  );

  const handleScrubEnd = useCallback(() => {
    setIsScrubbing(false);
    setScrubPoint(null);
    triggerHaptic('light');
  }, []);

  const displayNetWorth = isScrubbing && scrubPoint ? scrubPoint.val : totalNetWorth;
  const displayDeltaPct = isScrubbing && scrubPoint ? scrubPoint.changePct : currentChangePct;
  const displayDeltaLabel = isScrubbing && scrubPoint ? scrubPoint.label : currentTimeLabel;
  const isDisplayProfit = displayDeltaPct >= 0;

  // Proportional Asset Allocations
  const cashPct = totalNetWorth > 0 ? (totalCash / totalNetWorth) * 100 : 0;
  const stockPct = totalNetWorth > 0 ? (totalStocks / totalNetWorth) * 100 : 0;
  const cryptoPct = totalNetWorth > 0 ? (totalCryptos / totalNetWorth) * 100 : 0;

  // Top Movers: max 4 rows sorted by largest absolute change
  const allMovers = useMemo(() => {
    return [
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
    ]
      .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
      .slice(0, 4);
  }, [stocks, cryptos]);

  const isPnLProfit = totalUnrealizedPnL >= 0;

  return (
    <ScreenTransition style={[styles.screenContainer, { backgroundColor: Colors.palette.canvas }]}>
      <AmbientBackground
        scrollY={scrollY}
        activeAssetClass={selectedAllocation}
      />

      <HeaderBar />

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isSmall ? space.md : space.lg },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshMarketPrices}
            tintColor={Colors.palette.champagneGold}
            colors={[Colors.palette.champagneGold]}
          />
        }
      >
        {/* SOVEREIGN RECONCILIATION STRIP */}
        <Pressable
          onPress={() => {
            triggerHaptic('selection');
            router.push('/(tabs)/sync');
          }}
          style={styles.ledgerSyncBar}
        >
          <View style={styles.syncLeftGroup}>
            <View style={styles.syncStatusDot} />
            <Text style={styles.syncTitleText}>Buku Besar Rekonsiliasi Otomatis</Text>
          </View>
          <View style={styles.syncRightGroup}>
            <Text style={styles.syncSubText}>Impor e-Statement</Text>
            <Icon name="ChevronRight" size={12} color={Colors.palette.naturalTitanium} />
          </View>
        </Pressable>

        {/* 1. HERO BALANCE SHEET TAPE */}
        <GlassCard level="base" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroLabelRow}>
              <Text style={styles.heroLabel}>AKTIVA BERSIH (TRUE NET WORTH)</Text>
              {isScrubbing ? (
                <View style={styles.scrubIndicatorPill}>
                  <Text style={styles.scrubIndicatorText}>{displayDeltaLabel}</Text>
                </View>
              ) : null}
            </View>

            {/* Delta pill with Sovereign Jade (Profit) / Terracotta Rose (Loss) */}
            <View
              style={[
                styles.deltaBadge,
                isDisplayProfit ? styles.badgeGain : styles.badgeLoss,
              ]}
            >
              <Text
                style={[
                  styles.deltaText,
                  isDisplayProfit ? styles.textGain : styles.textLoss,
                ]}
              >
                {formatChangePercent(displayDeltaPct)} ({displayDeltaLabel})
              </Text>
            </View>
          </View>

          {/* Hero Scannable Net Worth Value */}
          <View style={styles.heroValueContainer}>
            <PrivacyValue
              value={displayNetWorth}
              style={[
                styles.heroValueText,
                { fontSize: isSmall ? 26 : width >= 414 ? 36 : 32 },
              ]}
            />
          </View>

          {/* True Net Worth Balance Equation Tape */}
          {totalLiabilities > 0 && !isScrubbing && (
            <View style={styles.netWorthBreakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownItemLabel}>Total Aset Bruto</Text>
                <PrivacyValue value={totalGrossAssets} style={styles.breakdownItemValGross} />
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownItemLabel}>Liabilitas & Utang</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={styles.breakdownMinus}>-</Text>
                  <PrivacyValue value={totalLiabilities} style={styles.breakdownItemValDebt} />
                </View>
              </View>
            </View>
          )}

          {/* Interactive Scrubbable Sparkline */}
          <Sparkline
            data={activePoints}
            labels={activeLabels}
            isPositive={isDisplayProfit}
            height={46}
            interactive
            onScrub={handleScrub}
            onScrubEnd={handleScrubEnd}
            style={styles.heroSparkline}
          />

          {/* Timeframe Switcher with Champagne Gold Liquid Capsule */}
          <LiquidTimeframeSelector
            activeTimeframe={activeTimeframe}
            onSelectTimeframe={setActiveTimeframe}
          />

          {/* 1px Dashed Perforation Line Separator */}
          <View style={styles.perforationLine} />

          {/* Segmented Proportional Asset Allocation Bar */}
          <View style={styles.allocationSection}>
            <View style={styles.allocationHeaderRow}>
              <Text style={styles.allocationSectionTitle}>ALOKASI ASET // PORTFOLIO RATIO</Text>
              {selectedAllocation !== 'ALL' && (
                <Pressable
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedAllocation('ALL');
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.resetAllocationText}>Tampilkan semua</Text>
                </Pressable>
              )}
            </View>

            {totalNetWorth > 0 ? (
              <View style={styles.allocationBarTrack}>
                <Pressable
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedAllocation(selectedAllocation === 'CASH' ? 'ALL' : 'CASH');
                  }}
                  style={[
                    styles.allocationSegment,
                    {
                      width: `${Math.max(4, cashPct)}%`,
                      backgroundColor: Colors.palette.titaniumSilver,
                      opacity: selectedAllocation === 'ALL' || selectedAllocation === 'CASH' ? 1 : 0.35,
                      height: selectedAllocation === 'CASH' ? 10 : 7,
                    },
                  ]}
                />
                <Pressable
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedAllocation(selectedAllocation === 'STOCKS' ? 'ALL' : 'STOCKS');
                  }}
                  style={[
                    styles.allocationSegment,
                    {
                      width: `${Math.max(4, stockPct)}%`,
                      backgroundColor: Colors.palette.champagneGold,
                      opacity: selectedAllocation === 'ALL' || selectedAllocation === 'STOCKS' ? 1 : 0.35,
                      height: selectedAllocation === 'STOCKS' ? 10 : 7,
                    },
                  ]}
                />
                <Pressable
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedAllocation(selectedAllocation === 'CRYPTO' ? 'ALL' : 'CRYPTO');
                  }}
                  style={[
                    styles.allocationSegment,
                    {
                      width: `${Math.max(4, cryptoPct)}%`,
                      backgroundColor: Colors.palette.burnishedCopper,
                      opacity: selectedAllocation === 'ALL' || selectedAllocation === 'CRYPTO' ? 1 : 0.35,
                      height: selectedAllocation === 'CRYPTO' ? 10 : 7,
                    },
                  ]}
                />
              </View>
            ) : (
              <View style={styles.emptyAllocationTrack}>
                <Text style={styles.emptyAllocationText}>Belum ada aset terdaftar</Text>
              </View>
            )}

            {/* Allocation Legend Chips */}
            <View style={styles.legendContainer}>
              <Pressable
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedAllocation(selectedAllocation === 'CASH' ? 'ALL' : 'CASH');
                }}
                style={[
                  styles.legendChip,
                  selectedAllocation === 'CASH' && styles.legendChipActive,
                ]}
              >
                <View style={[styles.legendDot, { backgroundColor: Colors.palette.titaniumSilver }]} />
                <View>
                  <Text style={styles.legendLabel}>Kas {cashPct.toFixed(0)}%</Text>
                  {selectedAllocation === 'CASH' && (
                    <PrivacyValue value={totalCash} style={styles.legendValue} />
                  )}
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedAllocation(selectedAllocation === 'STOCKS' ? 'ALL' : 'STOCKS');
                }}
                style={[
                  styles.legendChip,
                  selectedAllocation === 'STOCKS' && styles.legendChipActive,
                ]}
              >
                <View style={[styles.legendDot, { backgroundColor: Colors.palette.champagneGold }]} />
                <View>
                  <Text style={styles.legendLabel}>Saham {stockPct.toFixed(0)}%</Text>
                  {selectedAllocation === 'STOCKS' && (
                    <PrivacyValue value={totalStocks} style={styles.legendValue} />
                  )}
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedAllocation(selectedAllocation === 'CRYPTO' ? 'ALL' : 'CRYPTO');
                }}
                style={[
                  styles.legendChip,
                  selectedAllocation === 'CRYPTO' && styles.legendChipActive,
                ]}
              >
                <View style={[styles.legendDot, { backgroundColor: Colors.palette.burnishedCopper }]} />
                <View>
                  <Text style={styles.legendLabel}>Kripto {cryptoPct.toFixed(0)}%</Text>
                  {selectedAllocation === 'CRYPTO' && (
                    <PrivacyValue value={totalCryptos} style={styles.legendValue} />
                  )}
                </View>
              </Pressable>
            </View>
          </View>
        </GlassCard>

        {/* QUIET ESSENTIAL ACTION BAR */}
        <View style={styles.quickActionBar}>
          <Pressable
            onPress={() => {
              triggerHaptic('medium');
              setMutationModalVisible(true);
            }}
            style={styles.quickPrimaryBtn}
          >
            <Icon name="Plus" size={14} color="#0A0A09" />
            <Text style={styles.quickPrimaryBtnText}>Catat Mutasi</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/sync');
            }}
            style={styles.quickSecondaryBtn}
          >
            <Icon name="FileText" size={13} color={Colors.palette.alabasterWhite} />
            <Text style={styles.quickSecondaryBtnText}>Impor Statement</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/accounts');
            }}
            style={styles.quickSecondaryBtn}
          >
            <Icon name="Landmark" size={13} color={Colors.palette.alabasterWhite} />
            <Text style={styles.quickSecondaryBtnText}>Kelola Akun</Text>
          </Pressable>
        </View>

        {/* UPCOMING DUE DATE ALERT CARD */}
        {topDueAlert && (
          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/accounts');
            }}
            style={[
              styles.dueAlertCard,
              topDueAlert.isOverdue && styles.dueAlertCardOverdue,
            ]}
          >
            <View style={styles.dueAlertLeft}>
              <View
                style={[
                  styles.dueAlertIconCircle,
                  topDueAlert.isOverdue && { backgroundColor: 'rgba(225, 82, 65, 0.16)' },
                ]}
              >
                <Icon
                  name="Calendar"
                  size={14}
                  color={topDueAlert.isOverdue ? Colors.palette.terracottaRose : Colors.palette.champagneGold}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.dueAlertTitle} numberOfLines={1}>
                    {topDueAlert.isOverdue
                      ? `Tagihan ${topDueAlert.liability.name} Lewat Jatuh Tempo`
                      : topDueAlert.isDueToday
                      ? `Tagihan ${topDueAlert.liability.name} Jatuh Tempo Hari Ini`
                      : `Tagihan ${topDueAlert.liability.name} Jatuh Tempo dlm ${topDueAlert.daysLeft} Hari`}
                  </Text>
                  <View
                    style={[
                      styles.dueAlertBadge,
                      topDueAlert.isOverdue && { backgroundColor: 'rgba(225, 82, 65, 0.14)', borderColor: 'rgba(225, 82, 65, 0.28)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dueAlertBadgeText,
                        topDueAlert.isOverdue && { color: Colors.palette.terracottaRose },
                      ]}
                    >
                      {topDueAlert.isOverdue ? 'Jatuh Tempo' : `Tgl ${topDueAlert.dueDate}`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.dueAlertSub} numberOfLines={1}>
                  Total tagihan: {formatIDR(topDueAlert.liability.outstandingAmount)} • Ketuk untuk bayar
                </Text>
              </View>
            </View>
            <Icon name="ChevronRight" size={14} color={Colors.palette.naturalTitanium} />
          </Pressable>
        )}

        {/* 2. RINGKASAN PORTOFOLIO // INSTITUTIONAL DIVIDED LEDGER */}
        <View style={styles.ledgerSection}>
          <View style={styles.ledgerSectionHeader}>
            <Text style={styles.ledgerSectionHeadline}>RINGKASAN BUKU BESAR</Text>
            <Pressable
              onPress={() => {
                triggerHaptic('selection');
                router.push('/(tabs)/accounts');
              }}
              hitSlop={8}
            >
              <Text style={styles.ledgerSectionAction}>Detail buku kas &rarr;</Text>
            </Pressable>
          </View>

          {/* Monolithic Divided Ledger Card (No icons in boxes, label over value, right-aligned numbers) */}
          <GlassCard level="base" noPadding style={styles.institutionalLedgerCard}>
            {/* Row 1: Bank & Kas */}
            <Pressable
              onPress={() => {
                triggerHaptic('selection');
                router.push('/(tabs)/accounts');
              }}
              style={styles.ledgerRow}
            >
              <View style={styles.ledgerRowLeft}>
                <Text style={styles.ledgerRowTitle}>Kas & Rekening Giro</Text>
                <Text style={styles.ledgerRowMeta}>Bank BCA, Mandiri • 5 Akun</Text>
              </View>
              <View style={styles.ledgerRowRight}>
                <PrivacyValue value={bankCash} style={styles.ledgerRowValue} />
                <Text style={styles.ledgerRowSub}>Saldo Likuid Utama</Text>
              </View>
            </Pressable>

            {/* Row 2: Saham IDX */}
            <Pressable
              onPress={() => {
                triggerHaptic('selection');
                router.push('/(tabs)/portfolio');
              }}
              style={styles.ledgerRow}
            >
              <View style={styles.ledgerRowLeft}>
                <Text style={styles.ledgerRowTitle}>Efek Saham KSEI</Text>
                <Text style={styles.ledgerRowMeta}>120 Lot • IHSG Listed</Text>
              </View>
              <View style={styles.ledgerRowRight}>
                <PrivacyValue value={totalStocks} style={styles.ledgerRowValue} />
                <Text
                  style={[
                    styles.ledgerRowSub,
                    isPnLProfit ? styles.textGain : styles.textLoss,
                  ]}
                >
                  {formatChangePercent(totalUnrealizedPnLPercent)} PnL
                </Text>
              </View>
            </Pressable>

            {/* Row 3: Kas RDN */}
            <Pressable
              onPress={() => {
                triggerHaptic('selection');
                router.push('/(tabs)/accounts');
              }}
              style={styles.ledgerRow}
            >
              <View style={styles.ledgerRowLeft}>
                <Text style={styles.ledgerRowTitle}>Saldo Kas RDN</Text>
                <Text style={styles.ledgerRowMeta}>Dana Siap Beli Sekuritas</Text>
              </View>
              <View style={styles.ledgerRowRight}>
                <PrivacyValue value={rdnCash} style={styles.ledgerRowValue} />
                <Text style={styles.ledgerRowSub}>Siap Investasi</Text>
              </View>
            </Pressable>

            {/* Row 4: Kripto & Web3 */}
            <Pressable
              onPress={() => {
                triggerHaptic('selection');
                router.push('/(tabs)/portfolio');
              }}
              style={[styles.ledgerRow, styles.ledgerRowLast]}
            >
              <View style={styles.ledgerRowLeft}>
                <Text style={styles.ledgerRowTitle}>Aset Kripto Terverifikasi</Text>
                <Text style={styles.ledgerRowMeta}>BTC, ETH • Cold Storage</Text>
              </View>
              <View style={styles.ledgerRowRight}>
                <PrivacyValue value={totalCryptos} style={styles.ledgerRowValue} />
                <Text style={styles.ledgerRowSub}>Multi-Chain Vault</Text>
              </View>
            </Pressable>
          </GlassCard>
        </View>

        {/* 3. PERGERAKAN TERBESAR (TOP MOVERS WITH QUARTZ CARD) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeadline}>PERGERAKAN TERBESAR</Text>
          <Pressable
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/portfolio');
            }}
            hitSlop={8}
          >
            <Text style={styles.seeAllText}>Lihat portofolio &rarr;</Text>
          </Pressable>
        </View>

        {allMovers.length === 0 ? (
          <GlassCard level="base" style={styles.emptyMoversCard}>
            <Text style={styles.emptyTitle}>Mulai pantau aset Anda</Text>
            <Text style={styles.emptyDesc}>
              Hubungkan rekening bank, reksa dana, saham IDX, atau kripto untuk melihat pergerakan harga live.
            </Text>
            <View style={styles.emptyActionRow}>
              <LiquidButton
                title="Tambah rekening"
                icon="Plus"
                variant="azure"
                size="md"
                onPress={() => {
                  router.push('/(tabs)/accounts');
                }}
              />
            </View>
          </GlassCard>
        ) : (
          <GlassCard level="base" noPadding style={styles.moversCard}>
            {allMovers.map((mover, index) => {
              const isUp = mover.change24h >= 0;
              const isLast = index === allMovers.length - 1;
              return (
                <View key={mover.id}>
                  <Pressable
                    onPress={() => {
                      triggerHaptic('selection');
                      router.push('/(tabs)/portfolio');
                    }}
                    style={styles.moverRow}
                  >
                    <View style={styles.moverLeft}>
                      <View
                        style={[
                          styles.assetDot,
                          {
                            backgroundColor:
                              mover.type === 'IDX'
                                ? Colors.palette.champagneGold
                                : Colors.palette.burnishedCopper,
                          },
                        ]}
                      />
                      <View style={{ minWidth: 0, flexShrink: 1 }}>
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
                      <Text
                        style={[
                          styles.moverChangeText,
                          isUp ? styles.textGain : styles.textLoss,
                        ]}
                      >
                        {formatChangePercent(mover.change24h)}
                      </Text>
                    </View>
                  </Pressable>
                  {!isLast && <View style={styles.rowHairline} />}
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* ALTERNATIVE HOLDINGS ROW: PHYSICAL GOLD & BULLION */}
        <View style={styles.physicalGoldCard}>
          <View style={styles.goldCardLeft}>
            <View style={styles.goldIconCircle}>
              <Icon name="Sparkles" size={20} color={Colors.palette.champagneGold} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.goldCardTitle}>PHYSICAL GOLD &amp; BULLION</Text>
                <View style={styles.goldWeightBadge}>
                  <Text style={styles.goldWeightText}>250g Antam</Text>
                </View>
              </View>
              <Text style={styles.goldCardSub} numberOfLines={1}>
                Safe Deposit Box #204 • Bank Mandiri Thamrin
              </Text>
            </View>
          </View>

          <View style={styles.goldCardRight}>
            <Text style={styles.goldCardAmount}>Rp 342.500.000</Text>
            <Text style={styles.goldCardRoi}>+14.2% YTD</Text>
          </View>
        </View>

        {/* PRIMARY WEALTH ACTIONS PILL ARRAY */}
        <View style={styles.primaryActionsGrid}>
          <Pressable
            onPress={() => {
              triggerHaptic('medium');
              setMutationModalVisible(true);
            }}
            style={styles.primaryActionBtnGold}
          >
            <Icon name="PlusCircle" size={18} color="#0A0A09" />
            <Text style={styles.primaryActionTextGold}>+ Log Asset</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('medium');
              router.push('/(tabs)/sync');
            }}
            style={styles.primaryActionBtnTitanium}
          >
            <Icon name="FileText" size={18} color={Colors.palette.champagneGold} />
            <Text style={styles.primaryActionTextTitanium}>Import e-Statement</Text>
          </Pressable>
        </View>
      </Animated.ScrollView>

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
    backgroundColor: Colors.palette.canvas,
  },
  physicalGoldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  goldCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  goldIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.palette.champagneGold,
  },
  goldWeightBadge: {
    backgroundColor: '#2A2A28',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  goldWeightText: {
    fontSize: 9,
    color: Colors.palette.naturalTitanium,
  },
  goldCardSub: {
    fontSize: 11,
    color: Colors.palette.darkPewter,
    marginTop: 2,
  },
  goldCardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  goldCardAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
  },
  goldCardRoi: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.palette.sovereignJade,
  },
  primaryActionsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
    marginBottom: 8,
  },
  primaryActionBtnGold: {
    flex: 1,
    height: 48,
    borderRadius: 9999,
    backgroundColor: Colors.palette.champagneGold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryActionTextGold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A0A09',
  },
  primaryActionBtnTitanium: {
    flex: 1,
    height: 48,
    borderRadius: 9999,
    backgroundColor: '#20201D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryActionTextTitanium: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
  },
  scrollContent: {
    paddingBottom: 110,
    gap: space.md,
  },
  ledgerSyncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#1e1e22',
  },
  syncLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.palette.sovereignJade,
  },
  syncTitleText: {
    fontSize: 11,
    fontFamily: font.ui,
    fontWeight: '600',
    color: Colors.palette.alabasterWhite,
  },
  syncRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncSubText: {
    fontSize: 11,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
  },
  heroCard: {
    padding: space.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLabel: {
    fontSize: 11,
    fontFamily: font.mono,
    color: Colors.palette.naturalTitanium,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  athPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  athPillText: {
    fontSize: 9,
    fontFamily: font.mono,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.palette.champagneGold,
  },
  scrubIndicatorPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.30)',
  },
  scrubIndicatorText: {
    fontSize: 10,
    fontFamily: font.mono,
    color: Colors.palette.champagneGold,
    fontWeight: '600',
  },
  deltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeGain: {
    backgroundColor: 'rgba(46, 189, 133, 0.12)',
    borderColor: 'rgba(46, 189, 133, 0.30)',
  },
  badgeLoss: {
    backgroundColor: 'rgba(225, 82, 65, 0.12)',
    borderColor: 'rgba(225, 82, 65, 0.30)',
  },
  deltaText: {
    fontSize: 11,
    fontFamily: font.mono,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  textGain: {
    color: Colors.palette.sovereignJade,
  },
  textLoss: {
    color: Colors.palette.terracottaRose,
  },
  heroValueContainer: {
    marginVertical: space.xs,
  },
  heroValueText: {
    fontFamily: font.num,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  quickActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    marginTop: -space.xs,
  },
  quickPrimaryBtn: {
    flex: 1.2,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: Colors.palette.alabasterWhite,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  quickPrimaryBtnText: {
    fontSize: 12,
    fontFamily: font.ui,
    fontWeight: '700',
    color: '#0A0A09',
  },
  quickSecondaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: '#141416',
    borderWidth: 1,
    borderColor: '#222226',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
  },
  quickSecondaryBtnText: {
    fontSize: 11.5,
    fontFamily: font.ui,
    fontWeight: '600',
    color: Colors.palette.alabasterWhite,
  },
  heroSparkline: {
    marginTop: space.xs,
    marginBottom: space.xs,
  },
  timeframeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(10, 10, 9, 0.70)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 3,
    marginTop: space.xs,
    height: 36,
  },
  timeframeLiquidCapsule: {
    position: 'absolute',
    top: 3,
    left: 0,
    borderRadius: radius.pill,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.palette.champagneGold,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.35,
    elevation: 4,
  },
  timeframeLiquidInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderColor: 'rgba(212, 175, 55, 0.45)',
    overflow: 'hidden',
  },
  timeframeLiquidNucleus: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 4,
    right: 4,
    borderRadius: radius.pill,
  },
  timeframeSpecularGlint: {
    position: 'absolute',
    top: 1,
    left: '12%',
    right: '12%',
    height: 1.5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(212, 175, 55, 0.75)',
  },
  timeframeActiveDot: {
    position: 'absolute',
    bottom: 2,
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: Colors.palette.champagneGold,
    shadowColor: Colors.palette.champagneGold,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    elevation: 2,
  },
  timeframeButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timeframeText: {
    fontSize: 11,
    fontFamily: font.mono,
    color: Colors.palette.naturalTitanium,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  activeTimeframeText: {
    color: Colors.palette.champagneGold,
    fontWeight: '700',
  },
  perforationLine: {
    height: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    borderStyle: 'dashed',
    marginVertical: space.md,
  },
  allocationSection: {
    marginTop: space.xs,
  },
  allocationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  allocationSectionTitle: {
    fontSize: 10,
    fontFamily: font.mono,
    fontWeight: '700',
    color: Colors.palette.naturalTitanium,
    letterSpacing: 0.6,
  },
  resetAllocationText: {
    fontSize: 11,
    color: Colors.palette.champagneGold,
    fontWeight: '600',
  },
  allocationBarTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(10, 10, 9, 0.70)',
    overflow: 'hidden',
    gap: 2,
    marginBottom: space.sm,
  },
  allocationSegment: {
    borderRadius: radius.pill,
  },
  emptyAllocationTrack: {
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(10, 10, 9, 0.60)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  emptyAllocationText: {
    fontSize: 11,
    color: Colors.palette.naturalTitanium,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
  },
  legendChipActive: {
    backgroundColor: 'rgba(245, 243, 239, 0.06)',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: font.mono,
    color: Colors.palette.naturalTitanium,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 11,
    fontFamily: font.num,
    fontWeight: '600',
    color: Colors.palette.alabasterWhite,
  },
  ledgerSection: {
    gap: space.xs,
  },
  ledgerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  ledgerSectionHeadline: {
    fontSize: 10.5,
    fontFamily: font.mono,
    fontWeight: '700',
    color: Colors.palette.naturalTitanium,
    letterSpacing: 0.8,
  },
  ledgerSectionAction: {
    fontSize: 11,
    color: Colors.palette.champagneGold,
    fontWeight: '600',
  },
  institutionalLedgerCard: {
    borderRadius: radius.lg,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#1e1e22',
    overflow: 'hidden',
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e22',
  },
  ledgerRowLast: {
    borderBottomWidth: 0,
  },
  ledgerRowLeft: {
    flex: 1,
    minWidth: 0,
  },
  ledgerRowTitle: {
    fontSize: 13,
    fontFamily: font.ui,
    fontWeight: '600',
    color: Colors.palette.alabasterWhite,
  },
  ledgerRowMeta: {
    fontSize: 10.5,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
    marginTop: 2,
  },
  ledgerRowRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 12,
  },
  ledgerRowValue: {
    fontSize: 14,
    fontFamily: font.num,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
    fontVariant: ['tabular-nums'],
  },
  ledgerRowSub: {
    fontSize: 10.5,
    fontFamily: font.mono,
    color: Colors.palette.naturalTitanium,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
    paddingHorizontal: 2,
  },
  sectionHeadline: {
    fontSize: 11,
    fontFamily: font.mono,
    fontWeight: '700',
    color: Colors.palette.naturalTitanium,
    letterSpacing: 0.8,
  },
  seeAllText: {
    fontSize: 11,
    color: Colors.palette.champagneGold,
    fontWeight: '600',
  },
  moversCard: {
    borderRadius: radius.lg,
  },
  moverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  rowHairline: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: space.lg,
  },
  moverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  assetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moverSymbol: {
    fontSize: 14,
    fontFamily: font.mono,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
  },
  moverName: {
    fontSize: 11,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
  },
  moverRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  moverPrice: {
    fontSize: 13,
    fontFamily: font.num,
    fontWeight: '600',
    color: Colors.palette.alabasterWhite,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  moverChangeText: {
    fontSize: 11,
    fontFamily: font.mono,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  emptyMoversCard: {
    padding: space.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: font.ui,
    fontWeight: '600',
    color: Colors.palette.alabasterWhite,
    marginBottom: space.xs,
  },
  emptyDesc: {
    fontSize: 12,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: space.md,
  },
  emptyActionRow: {
    flexDirection: 'row',
  },
  netWorthBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xs,
    marginBottom: space.sm,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'center',
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownItemLabel: {
    fontSize: 10.5,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
  },
  breakdownItemValGross: {
    fontSize: 11,
    fontFamily: font.num,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
    fontVariant: ['tabular-nums'],
  },
  breakdownDivider: {
    width: 1,
    height: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  breakdownMinus: {
    fontSize: 11,
    fontFamily: font.num,
    fontWeight: '700',
    color: Colors.palette.terracottaRose,
  },
  breakdownItemValDebt: {
    fontSize: 11,
    fontFamily: font.num,
    fontWeight: '700',
    color: Colors.palette.terracottaRose,
    fontVariant: ['tabular-nums'],
  },
  dueAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    marginBottom: space.sm,
  },
  dueAlertCardOverdue: {
    backgroundColor: 'rgba(225, 82, 65, 0.10)',
    borderColor: 'rgba(225, 82, 65, 0.35)',
  },
  dueAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  dueAlertIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueAlertTitle: {
    fontSize: 12,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: Colors.palette.alabasterWhite,
  },
  dueAlertBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  dueAlertBadgeText: {
    fontSize: 9,
    fontFamily: font.mono,
    fontWeight: '700',
    color: Colors.palette.champagneGold,
  },
  dueAlertSub: {
    fontSize: 10,
    fontFamily: font.ui,
    color: Colors.palette.naturalTitanium,
    marginTop: 2,
  },
});
