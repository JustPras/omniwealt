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
import { ScreenTransition } from '../../src/components/common/screen-transition';
import { AmbientBackground } from '../../src/components/common/ambient-background';
import { Sparkline, ScrubPoint } from '../../src/components/common/sparkline';
import { PrivacyValue } from '../../src/components/common/privacy-value';
import { CashMutationModal } from '../../src/components/modals/cash-mutation-modal';
import { LiabilityService } from '../../src/services/liability-service';
import { useWealth } from '../../src/store/wealth-context';
import { formatPercent, formatChangePercent, formatIDR } from '../../src/utils/format';
import { triggerHaptic } from '../../src/utils/haptics';
import { color, space, radius, shadow, motion, useTheme, themes, font } from '../../src/theme/tokens';

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
    const theme = useTheme();
    const isDark = theme.canvas === themes.dark.canvas;
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

    const waveTranslateX = waveAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-capsuleWidth * 0.8, capsuleWidth * 0.8],
    });

    const waveOpacity = waveAnim.interpolate({
      inputRange: [0, 0.25, 0.75, 1],
      outputRange: [0, 0.75, 0.75, 0],
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
        {/* Flowing Liquid Glass Water Capsule */}
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
            {/* Inner clipped liquid container */}
            <View
              style={[
                styles.timeframeLiquidInner,
                {
                  backgroundColor: isDark
                    ? 'rgba(0, 122, 255, 0.22)'
                    : 'rgba(0, 122, 255, 0.16)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.32)'
                    : 'rgba(0, 122, 255, 0.38)',
                },
              ]}
            >
              {/* Internal Radiant Water Tint Nucleus */}
              <View
                style={[
                  styles.timeframeLiquidNucleus,
                  {
                    backgroundColor: isDark
                      ? 'rgba(0, 140, 255, 0.18)'
                      : 'rgba(0, 122, 255, 0.12)',
                  },
                ]}
              />

              {/* Water Wave Shimmer Ribbon */}
              <Animated.View
                style={[
                  styles.timeframeWaveShimmer,
                  {
                    opacity: waveOpacity,
                    transform: [
                      { translateX: waveTranslateX },
                      { rotate: '25deg' },
                    ],
                  },
                ]}
              />

              {/* Specular Water Meniscus Arc */}
              <View style={styles.timeframeSpecularGlint} />
            </View>

            {/* Subtle Active Glow Dot at Bottom */}
            <View
              style={[
                styles.timeframeActiveDot,
                {
                  backgroundColor: color.accent,
                  shadowColor: color.accent,
                },
              ]}
            />
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

  const {
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

  // Handle Scrub interaction
  const handleScrub = useCallback(
    (point: ScrubPoint) => {
      setIsScrubbing(true);
      // Map normalized point to actual simulated portfolio value
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
    // Settle back to live
    setIsScrubbing(false);
    setScrubPoint(null);
    triggerHaptic('light');
  }, []);

  // Displayed Hero Values (live vs scrubbed)
  const displayNetWorth = isScrubbing && scrubPoint ? scrubPoint.val : totalNetWorth;
  const displayDeltaPct = isScrubbing && scrubPoint ? scrubPoint.changePct : currentChangePct;
  const displayDeltaLabel = isScrubbing && scrubPoint ? scrubPoint.label : currentTimeLabel;
  const isDisplayProfit = displayDeltaPct >= 0;

  // Asset Allocations
  const cashPct = totalNetWorth > 0 ? (totalCash / totalNetWorth) * 100 : 0;
  const stockPct = totalNetWorth > 0 ? (totalStocks / totalNetWorth) * 100 : 0;
  const cryptoPct = totalNetWorth > 0 ? (totalCryptos / totalNetWorth) * 100 : 0;

  // Top Movers: max 4 rows sorted by largest absolute change (memoized)
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
    <ScreenTransition style={styles.screenContainer}>
      {/* Background with subtle ambient lighting that shifts on allocation tap */}
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
            tintColor={color.accent}
            colors={[color.accent]}
          />
        }
      >
        {/* 1. HERO NET WORTH CARD (WITH LIVE SCRUBBING) */}
        <GlassCard level="base" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroLabelRow}>
              <Text style={styles.heroLabel}>Kekayaan bersih</Text>
              {isScrubbing ? (
                <View style={styles.scrubIndicatorPill}>
                  <Text style={styles.scrubIndicatorText}>{displayDeltaLabel}</Text>
                </View>
              ) : null}
            </View>

            {/* Delta pill with true minus and arrows */}
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
                { fontSize: isSmall ? 28 : width >= 414 ? 38 : 34 },
              ]}
            />
          </View>

          {/* True Net Worth Breakdown Sub-Row */}
          {totalLiabilities > 0 && !isScrubbing && (
            <View style={styles.netWorthBreakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownItemLabel}>Total Aset</Text>
                <PrivacyValue value={totalGrossAssets} style={styles.breakdownItemValGross} />
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownItemLabel}>Liabilitas / Utang</Text>
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

          {/* Timeframe Switcher with Liquid Glass Flowing Capsule */}
          <LiquidTimeframeSelector
            activeTimeframe={activeTimeframe}
            onSelectTimeframe={setActiveTimeframe}
          />
        </GlassCard>

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
                  topDueAlert.isOverdue && { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
                ]}
              >
                <Icon
                  name="Calendar"
                  size={15}
                  color={topDueAlert.isOverdue ? '#EF4444' : '#F59E0B'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.dueAlertTitle}>
                    {topDueAlert.isOverdue
                      ? `Tagihan ${topDueAlert.liability.name} Lewat Jatuh Tempo!`
                      : topDueAlert.isDueToday
                      ? `Tagihan ${topDueAlert.liability.name} Jatuh Tempo Hari Ini!`
                      : `Tagihan ${topDueAlert.liability.name} Jatuh Tempo dlm ${topDueAlert.daysLeft} Hari`}
                  </Text>
                  <View
                    style={[
                      styles.dueAlertBadge,
                      topDueAlert.isOverdue && { backgroundColor: 'rgba(239, 68, 68, 0.16)', borderColor: 'rgba(239, 68, 68, 0.3)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dueAlertBadgeText,
                        topDueAlert.isOverdue && { color: '#EF4444' },
                      ]}
                    >
                      {topDueAlert.isOverdue ? 'Jatuh Tempo' : `Tgl ${topDueAlert.dueDate}`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.dueAlertSub}>
                  Total tagihan: {formatIDR(topDueAlert.liability.outstandingAmount)} • Ketuk untuk bayar
                </Text>
              </View>
            </View>
            <Icon name="ChevronRight" size={15} color={color.textMuted} />
          </Pressable>
        )}

        {/* 2. INTERACTIVE ASSET ALLOCATION CARD */}
        <GlassCard level="base" style={styles.allocationCard}>
          <View style={styles.allocationHeader}>
            <Text style={styles.sectionHeadline}>Alokasi aset</Text>
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

          {/* Segmented Proportional Bar */}
          {totalNetWorth > 0 ? (
            <View style={styles.allocationBarTrack}>
              {/* Cash segment (perak / slate) */}
              <Pressable
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedAllocation(selectedAllocation === 'CASH' ? 'ALL' : 'CASH');
                }}
                style={[
                  styles.allocationSegment,
                  {
                    width: `${Math.max(3, cashPct)}%`,
                    backgroundColor: color.asset.cash,
                    opacity: selectedAllocation === 'ALL' || selectedAllocation === 'CASH' ? 1 : 0.4,
                    height: selectedAllocation === 'CASH' ? 12 : 8,
                  },
                ]}
              />

              {/* Stock segment (sky) */}
              <Pressable
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedAllocation(selectedAllocation === 'STOCKS' ? 'ALL' : 'STOCKS');
                }}
                style={[
                  styles.allocationSegment,
                  {
                    width: `${Math.max(3, stockPct)}%`,
                    backgroundColor: color.asset.stock,
                    opacity: selectedAllocation === 'ALL' || selectedAllocation === 'STOCKS' ? 1 : 0.4,
                    height: selectedAllocation === 'STOCKS' ? 12 : 8,
                  },
                ]}
              />

              {/* Crypto segment (violet) */}
              <Pressable
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedAllocation(selectedAllocation === 'CRYPTO' ? 'ALL' : 'CRYPTO');
                }}
                style={[
                  styles.allocationSegment,
                  {
                    width: `${Math.max(3, cryptoPct)}%`,
                    backgroundColor: color.asset.crypto,
                    opacity: selectedAllocation === 'ALL' || selectedAllocation === 'CRYPTO' ? 1 : 0.4,
                    height: selectedAllocation === 'CRYPTO' ? 12 : 8,
                  },
                ]}
              />
            </View>
          ) : (
            <View style={styles.emptyAllocationTrack}>
              <Text style={styles.emptyAllocationText}>Belum ada aset terdaftar</Text>
            </View>
          )}

          {/* Allocation Legend with Amounts */}
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
              <View style={[styles.legendDot, { backgroundColor: color.asset.cash }]} />
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
              <View style={[styles.legendDot, { backgroundColor: color.asset.stock }]} />
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
              <View style={[styles.legendDot, { backgroundColor: color.asset.crypto }]} />
              <View>
                <Text style={styles.legendLabel}>Kripto {cryptoPct.toFixed(0)}%</Text>
                {selectedAllocation === 'CRYPTO' && (
                  <PrivacyValue value={totalCryptos} style={styles.legendValue} />
                )}
              </View>
            </Pressable>
          </View>
        </GlassCard>

        {/* 3. ASYMMETRIC BENTO GRID */}
        <View style={styles.bentoGrid}>
          {/* Left Column: Active Investments (Double Height) */}
          <GlassCard
            level="base"
            style={styles.bentoLeftCard}
            onPress={() => {
              triggerHaptic('selection');
              router.push('/(tabs)/portfolio');
            }}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>Investasi aktif</Text>
              <Icon name="ArrowUpRight" size={15} color={color.accent} />
            </View>

            <View style={styles.bentoValueBlock}>
              <PrivacyValue value={totalInvestments} style={styles.bentoLargeValue} />
            </View>

            <View style={styles.bentoHairline} />

            <View style={styles.pnlSection}>
              <Text style={styles.pnlLabel}>Laba belum terealisasi</Text>
              <Text
                style={[
                  styles.pnlPercentText,
                  isPnLProfit ? styles.textGain : styles.textLoss,
                ]}
              >
                {formatChangePercent(totalUnrealizedPnLPercent)}
              </Text>
              <PrivacyValue
                value={totalUnrealizedPnL}
                prefix={isPnLProfit ? '▲ +' : '▼ −'}
                style={[
                  styles.pnlAmountText,
                  isPnLProfit ? styles.textGain : styles.textLoss,
                ]}
              />
            </View>
          </GlassCard>

          {/* Right Column: Stacked Cards */}
          <View style={styles.bentoRightCol}>
            {/* Top Right: Cash & RDN */}
            <GlassCard
              level="base"
              style={styles.bentoRightCard}
              onPress={() => {
                triggerHaptic('selection');
                router.push('/(tabs)/accounts');
              }}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Kas & RDN</Text>
                <Icon name="ArrowUpRight" size={14} color={color.accent} />
              </View>
              <PrivacyValue value={totalCash} style={styles.bentoMidValue} />
              <Text style={styles.bentoSubtext}>Saldo likuid</Text>
            </GlassCard>

            {/* Bottom Right: Quick Actions */}
            <GlassCard level="base" style={styles.bentoRightCard}>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  setMutationModalVisible(true);
                }}
                style={styles.quickActionRow}
              >
                <Icon name="Plus" size={14} color={color.accent} />
                <Text style={styles.quickActionText}>Catat mutasi</Text>
              </Pressable>

              <View style={styles.bentoHairline} />

              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  router.push('/(tabs)/sync');
                }}
                style={styles.quickActionRow}
              >
                <Icon name="UploadCloud" size={14} color={color.textMuted} />
                <Text style={styles.quickActionText}>Impor statement</Text>
              </Pressable>
            </GlassCard>
          </View>
        </View>

        {/* 4. PERGERAKAN TERBESAR (SINGLE CARD WITH ROWS SEPARATED BY HAIRLINE) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeadline}>Pergerakan terbesar</Text>
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
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  router.push('/(tabs)/accounts');
                }}
                style={styles.primaryActionButton}
              >
                <Text style={styles.primaryActionButtonText}>Tambah rekening</Text>
              </Pressable>
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
                    {/* Left: Ticker & Asset marker dot */}
                    <View style={styles.moverLeft}>
                      <View
                        style={[
                          styles.assetDot,
                          {
                            backgroundColor:
                              mover.type === 'IDX' ? color.asset.stock : color.asset.crypto,
                          },
                        ]}
                      />
                      <View>
                        <Text style={styles.moverSymbol}>{mover.symbol}</Text>
                        <Text style={styles.moverName} numberOfLines={1}>
                          {mover.name}
                        </Text>
                      </View>
                    </View>

                    {/* Right: Tabular price & change */}
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
    backgroundColor: color.obsidian,
  },
  scrollContent: {
    paddingBottom: 110,
    gap: space.lg,
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
    gap: space.sm,
  },
  heroLabel: {
    fontSize: 14,
    color: color.textMuted,
    fontWeight: '500',
  },
  scrubIndicatorPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: color.accentSoft,
    borderWidth: 1,
    borderColor: color.accentRim,
  },
  scrubIndicatorText: {
    fontSize: 11,
    color: color.accent,
    fontWeight: '600',
  },
  deltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeGain: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.24)',
  },
  badgeLoss: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.24)',
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  textGain: {
    color: color.gain,
  },
  textLoss: {
    color: color.loss,
  },
  heroValueContainer: {
    marginVertical: space.xs,
  },
  heroValueText: {
    fontWeight: '800',
    color: color.text,
    letterSpacing: -0.5,
  },
  heroSparkline: {
    marginTop: space.xs,
    marginBottom: space.xs,
  },
  timeframeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: color.glassFillInset,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline,
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
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.40,
    elevation: 4,
  },
  timeframeLiquidInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
    borderWidth: 1.2,
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
  timeframeWaveShimmer: {
    position: 'absolute',
    width: 24,
    height: '110%',
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 12,
  },
  timeframeSpecularGlint: {
    position: 'absolute',
    top: 1.5,
    left: '14%',
    right: '14%',
    height: 1.5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  timeframeActiveDot: {
    position: 'absolute',
    bottom: 2,
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
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
    color: color.textMuted,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  activeTimeframeText: {
    color: color.accent,
    fontWeight: '700',
  },

  // Allocation Card
  allocationCard: {
    padding: space.lg,
  },
  allocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  sectionHeadline: {
    fontSize: 17,
    fontWeight: '600',
    color: color.text,
  },
  resetAllocationText: {
    fontSize: 12,
    color: color.accent,
  },
  allocationBarTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: color.glassFillInset,
    overflow: 'hidden',
    gap: 2,
    marginBottom: space.md,
  },
  allocationSegment: {
    borderRadius: radius.pill,
  },
  emptyAllocationTrack: {
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: color.glassFillInset,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  emptyAllocationText: {
    fontSize: 12,
    color: color.textMuted,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.md,
  },
  legendChipActive: {
    backgroundColor: color.glassFillInset,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 12,
    color: color.textMuted,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '600',
    color: color.text,
  },

  // Bento Grid
  bentoGrid: {
    flexDirection: 'row',
    gap: space.md,
  },
  bentoLeftCard: {
    flex: 1.15,
    padding: space.md,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderTitle: {
    fontSize: 13,
    color: color.textMuted,
    fontWeight: '500',
  },
  bentoValueBlock: {
    marginVertical: space.sm,
  },
  bentoLargeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: color.text,
  },
  bentoHairline: {
    height: 1,
    backgroundColor: color.hairline,
    marginVertical: space.xs,
  },
  pnlSection: {
    marginTop: space.xs,
  },
  pnlLabel: {
    fontSize: 11,
    color: color.textMuted,
    marginBottom: 2,
  },
  pnlPercentText: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  pnlAmountText: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  bentoRightCol: {
    flex: 1,
    gap: space.md,
  },
  bentoRightCard: {
    padding: space.md,
    justifyContent: 'center',
  },
  bentoMidValue: {
    fontSize: 17,
    fontWeight: '700',
    color: color.text,
    marginVertical: 4,
  },
  bentoSubtext: {
    fontSize: 11,
    color: color.textMuted,
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    paddingVertical: 5,
  },
  quickActionText: {
    fontSize: 12,
    color: color.text,
    fontWeight: '500',
  },

  // Movers Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
  seeAllText: {
    fontSize: 13,
    color: color.accent,
    fontWeight: '500',
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
    backgroundColor: color.hairline,
    marginHorizontal: space.lg,
  },
  moverLeft: {
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
  moverSymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: color.text,
  },
  moverName: {
    fontSize: 12,
    color: color.textMuted,
    maxWidth: 160,
  },
  moverRight: {
    alignItems: 'flex-end',
  },
  moverPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: color.text,
    textAlign: 'right',
  },
  moverChangeText: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },

  // Empty state
  emptyMoversCard: {
    padding: space.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: color.text,
    marginBottom: space.xs,
  },
  emptyDesc: {
    fontSize: 13,
    color: color.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: space.md,
  },
  emptyActionRow: {
    flexDirection: 'row',
  },
  primaryActionButton: {
    backgroundColor: color.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    ...shadow.e1,
  },
  primaryActionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: color.onAccent,
  },
  netWorthBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xs,
    marginBottom: space.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignSelf: 'center',
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownItemLabel: {
    fontSize: 11,
    fontFamily: font.ui,
    color: color.textMuted,
  },
  breakdownItemValGross: {
    fontSize: 11,
    fontFamily: font.num,
    fontWeight: '700',
    color: color.text,
  },
  breakdownDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  breakdownMinus: {
    fontSize: 11,
    fontFamily: font.num,
    fontWeight: '700',
    color: '#F87171',
  },
  breakdownItemValDebt: {
    fontSize: 11,
    fontFamily: font.num,
    fontWeight: '700',
    color: '#F87171',
  },
  dueAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: space.md,
  },
  dueAlertCardOverdue: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueAlertTitle: {
    fontSize: 12,
    fontFamily: font.uiBold,
    fontWeight: '700',
    color: color.text,
  },
  dueAlertBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  dueAlertBadgeText: {
    fontSize: 9,
    fontFamily: font.uiBold,
    color: '#F59E0B',
  },
  dueAlertSub: {
    fontSize: 10,
    fontFamily: font.ui,
    color: color.textMuted,
    marginTop: 2,
  },
});
