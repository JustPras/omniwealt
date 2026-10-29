import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Svg, { Path, Circle, Mask, G, Defs } from 'react-native-svg';
import { space } from '../../theme/tokens';

export interface LuxuryLoaderProps {
  title?: string;
  subtitle?: string;
  fullscreen?: boolean;
  isHydrated?: boolean;
  onFinish?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const LuxuryLoader: React.FC<LuxuryLoaderProps> = ({
  title = 'OMNIWEALTH',
  subtitle,
  fullscreen = false,
  isHydrated = true,
  onFinish,
  style,
}) => {
  const [progressVal, setProgressVal] = useState(0);
  const [statusMsg, setStatusMsg] = useState(
    subtitle || 'Memverifikasi Kunci Biometrik...'
  );

  // Master progress animated value: 0.0 to 1.0
  const progressAnim = useRef(new Animated.Value(0)).current;
  const auraAnim = useRef(new Animated.Value(0)).current;
  const isFinishedRef = useRef(false);

  useEffect(() => {
    // Dynamic progress state listener for fluid SVG circular draw-on
    const listenerId = progressAnim.addListener(({ value }) => {
      setProgressVal(value);

      if (subtitle) {
        setStatusMsg(subtitle);
        return;
      }
      if (value < 0.25) {
        setStatusMsg('Memverifikasi Kunci Biometrik...');
      } else if (value < 0.60) {
        setStatusMsg('Sinkronisasi Kas RDN & Broker Saham...');
      } else if (value < 0.95) {
        setStatusMsg('Menghitung True Net Worth Real-Time...');
      } else {
        setStatusMsg('Menyiapkan Portofolio...');
      }
    });

    // Staggered Milestones (0% to 100%)
    const animSequence = Animated.sequence([
      Animated.timing(progressAnim, {
        toValue: 0.20,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.delay(100),
      Animated.timing(progressAnim, {
        toValue: 0.60,
        duration: 550,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.delay(100),
      Animated.timing(progressAnim, {
        toValue: 0.88,
        duration: 500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.delay(80),
      Animated.timing(progressAnim, {
        toValue: 1.0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);

    // Breathing aura loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(auraAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(auraAnim, {
          toValue: 0.4,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    animSequence.start(() => {
      if (!isFinishedRef.current) {
        isFinishedRef.current = true;
        setTimeout(() => {
          if (onFinish) {
            onFinish();
          }
        }, 300);
      }
    });

    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [progressAnim, auraAnim, onFinish, subtitle]);

  // =========================================================================
  // FLUID CIRCULAR DRAW-ON MATH (Zero stiffness, 100% natural arc curve)
  // =========================================================================

  // 1. Center Donut: sweeps circularly 360 deg (0.0 to 0.35)
  const pDonut = Math.min(1, progressVal / 0.35);
  const easedDonut = 1 - Math.pow(1 - pDonut, 3);
  const donutDashOffset = 1 - easedDonut;

  // 2. Outer Ring: sweeps symmetrically from bottom base up to top slit (0.25 to 0.95)
  const pOuter = Math.max(0, Math.min(1, (progressVal - 0.25) / 0.70));
  const easedOuter =
    pOuter < 0.5
      ? 4 * pOuter * pOuter * pOuter
      : 1 - Math.pow(-2 * pOuter + 2, 3) / 2;
  const outerDashOffset = 1 - easedOuter;

  // 3. Aura opacity follows progress
  const auraAlpha = Math.min(0.75, progressVal * 0.8);

  return (
    <View style={[styles.container, fullscreen && styles.fullscreen, style]}>
      <View style={styles.contentWrapper}>
        {/* Soft Apple Blue Ambient Halo Aura */}
        <Animated.View
          style={[
            styles.haloGlow,
            {
              opacity: auraAnim,
            },
          ]}
        />

        {/* Master Logo Motion Stage (Fluid Circular Arc Draw-On) */}
        <View style={styles.logoStage}>
          <Svg viewBox="0 0 1024 1024" style={styles.svg}>
            <Defs>
              {/* Circular Mask 1: Center Donut (Circular 360 Sweep) */}
              <Mask id="rnDonutMask">
                <Circle
                  cx="511.5"
                  cy="511.5"
                  r="53.5"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="50"
                  strokeDasharray="336.15, 336.15"
                  strokeDashoffset={336.15 * donutDashOffset}
                  rotation={-90}
                  origin="511.5, 511.5"
                  strokeLinecap="round"
                />
              </Mask>

              {/* Circular Mask 2: Outer Ring Left Arc (Bottom 6 o'clock up to Top 12 o'clock) */}
              <Mask id="rnOuterMaskLeft">
                <Path
                  d="M 512 732.25 A 220.25 220.25 0 0 1 512 291.75"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="90"
                  strokeDasharray="691.94, 691.94"
                  strokeDashoffset={691.94 * outerDashOffset}
                  strokeLinecap="round"
                />
              </Mask>

              {/* Circular Mask 3: Outer Ring Right Arc (Bottom 6 o'clock up to Top 12 o'clock) */}
              <Mask id="rnOuterMaskRight">
                <Path
                  d="M 512 732.25 A 220.25 220.25 0 0 0 512 291.75"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="90"
                  strokeDasharray="691.94, 691.94"
                  strokeDashoffset={691.94 * outerDashOffset}
                  strokeLinecap="round"
                />
              </Mask>
            </Defs>

            {/* ACTOR 1: Core Blue Donut revealed smoothly by circular mask */}
            <G mask="url(#rnDonutMask)">
              <Path
                d="M 511.5 439.5 A 72 72 0 1 0 511.5 583.5 A 72 72 0 1 0 511.5 439.5 Z M 511.5 476.5 A 35 35 0 1 1 511.5 546.5 A 35 35 0 1 1 511.5 476.5 Z"
                fill="#D4AF37"
                fillRule="evenodd"
              />
            </G>

            {/* ACTOR 2 & 3: Left Half (Bottom Blue Left + White Left Arc) */}
            <G mask="url(#rnOuterMaskLeft)">
              <Path
                d="M 647.2 728.6 A 256 256 0 0 1 375.8 728.6 L 413.7 667.9 A 184.5 184.5 0 0 0 609.3 667.9 Z"
                fill="#D4AF37"
              />
              <Path
                d="M 482 257.2 L 482 329.4 A 184.5 184.5 0 0 0 384.5 645.3 L 335.3 697.2 A 256 256 0 0 1 482 257.2 Z"
                fill="#F5F3EF"
              />
            </G>

            {/* ACTOR 2 & 4: Right Half (Bottom Blue Right + White Right Arc) */}
            <G mask="url(#rnOuterMaskRight)">
              <Path
                d="M 647.2 728.6 A 256 256 0 0 1 375.8 728.6 L 413.7 667.9 A 184.5 184.5 0 0 0 609.3 667.9 Z"
                fill="#D4AF37"
              />
              <Path
                d="M 541 329.4 L 541 257.2 A 256 256 0 0 1 687.7 697.2 L 638.5 645.3 A 184.5 184.5 0 0 0 541 329.4 Z"
                fill="#F5F3EF"
              />
            </G>
          </Svg>
        </View>

        {/* Brand Typography */}
        <Text style={styles.brandTitle}>{title}</Text>
        <Text style={styles.brandSub}>TRUE NET WORTH INTELLIGENCE</Text>

        {/* Milestone Status Subtitle */}
        <Text style={styles.statusText}>{statusMsg}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  haloGlow: {
    position: 'absolute',
    top: 10,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    shadowColor: '#D4AF37',
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 8,
  },
  logoStage: {
    width: 160,
    height: 160,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  svg: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2.2,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.2,
    marginBottom: space.lg,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.78)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
