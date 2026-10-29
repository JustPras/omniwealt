import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg, { Path, Circle, Mask, G, Defs } from 'react-native-svg';
import { Colors } from '../../theme/tokens';

export interface LogoLoaderProps {
  size?: number;
  label?: string;
  showHalo?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * OmniWealth Fluid Circular Arc Draw-On Loading Component (Pure SVG Masking)
 * Preserves the original draw-on sweep choreography:
 * 1. Center Donut sweeps 360° circularly from top (Phase 0% - 35%)
 * 2. Outer Left & Right Arcs sweep symmetrically upward from bottom base to top (Phase 20% - 85%)
 * 3. Subtle breathing champagne gold halo
 * 4. Colors updated to Warm Titanium (#F5F3EF / #A39E93) and Champagne Gold (#D4AF37)
 */
export const LogoLoader: React.FC<LogoLoaderProps> = ({
  size = 48,
  label,
  showHalo = true,
  style,
}) => {
  const [progressVal, setProgressVal] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const auraAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Continuous 2400ms loop of the original draw-on sequence
    const listenerId = progressAnim.addListener(({ value }) => {
      setProgressVal(value);
    });

    const masterLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );

    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraAnim, {
          toValue: 0.85,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(auraAnim, {
          toValue: 0.35,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    masterLoop.start();
    auraLoop.start();

    return () => {
      progressAnim.removeListener(listenerId);
      masterLoop.stop();
      auraLoop.stop();
    };
  }, [progressAnim, auraAnim]);

  // Original fluid circular draw-on math
  // 1. Center Donut: sweeps circularly 360 deg (0.0 to 0.35)
  const pDonut = Math.min(1, progressVal / 0.35);
  const easedDonut = 1 - Math.pow(1 - pDonut, 3);
  const donutDashOffset = 1 - easedDonut;

  // 2. Outer Ring: sweeps symmetrically from bottom base up to top slit (0.20 to 0.85)
  const pOuter = Math.max(0, Math.min(1, (progressVal - 0.20) / 0.65));
  const easedOuter =
    pOuter < 0.5
      ? 4 * pOuter * pOuter * pOuter
      : 1 - Math.pow(-2 * pOuter + 2, 3) / 2;
  const outerDashOffset = 1 - easedOuter;

  // Fade out slightly near end of loop (0.90 to 1.0)
  const fadeAlpha = progressVal > 0.9 ? (1 - progressVal) / 0.1 : 1;

  return (
    <View style={[styles.wrapper, style]}>
      {/* Ambient Champagne Halo Aura */}
      {showHalo && (
        <Animated.View
          style={[
            styles.haloGlow,
            {
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: (size * 1.5) / 2,
              opacity: auraAnim,
            },
          ]}
        />
      )}

      {/* Fluid Circular Draw-On SVG Stage */}
      <View style={{ width: size, height: size, opacity: Math.max(0.1, fadeAlpha) }}>
        <Svg viewBox="0 0 1024 1024" width={size} height={size}>
          <Defs>
            {/* Circular Mask 1: Center Donut (Circular 360 Sweep from Top) */}
            <Mask id="logoLoaderDonutMask">
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

            {/* Circular Mask 2: Outer Ring Left Arc (Bottom up to Top) */}
            <Mask id="logoLoaderOuterMaskLeft">
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

            {/* Circular Mask 3: Outer Ring Right Arc (Bottom up to Top) */}
            <Mask id="logoLoaderOuterMaskRight">
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

          {/* ACTOR 1: Core Gold Nexus Ring revealed smoothly by circular mask */}
          <G mask="url(#logoLoaderDonutMask)">
            <Path
              d="M 511.5 439.5 A 72 72 0 1 0 511.5 583.5 A 72 72 0 1 0 511.5 439.5 Z M 511.5 476.5 A 35 35 0 1 1 511.5 546.5 A 35 35 0 1 1 511.5 476.5 Z"
              fill="#D4AF37"
              fillRule="evenodd"
            />
          </G>

          {/* ACTOR 2: Left Half (Bottom Champagne Arc + Natural Titanium Left Arc) */}
          <G mask="url(#logoLoaderOuterMaskLeft)">
            <Path
              d="M 647.2 728.6 A 256 256 0 0 1 375.8 728.6 L 413.7 667.9 A 184.5 184.5 0 0 0 609.3 667.9 Z"
              fill="#D4AF37"
            />
            <Path
              d="M 482 257.2 L 482 329.4 A 184.5 184.5 0 0 0 384.5 645.3 L 335.3 697.2 A 256 256 0 0 1 482 257.2 Z"
              fill="#F5F3EF"
            />
          </G>

          {/* ACTOR 3: Right Half (Bottom Champagne Arc + Titanium Right Arc) */}
          <G mask="url(#logoLoaderOuterMaskRight)">
            <Path
              d="M 647.2 728.6 A 256 256 0 0 1 375.8 728.6 L 413.7 667.9 A 184.5 184.5 0 0 0 609.3 667.9 Z"
              fill="#D4AF37"
            />
            <Path
              d="M 541 329.4 L 541 257.2 A 256 256 0 0 1 687.7 697.2 L 638.5 645.3 A 184.5 184.5 0 0 0 541 329.4 Z"
              fill="#A39E93"
            />
          </G>
        </Svg>
      </View>

      {/* Optional Monospace Status Label */}
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  haloGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(212, 175, 55, 0.22)',
    shadowColor: '#D4AF37',
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 4,
  },
  label: {
    marginTop: 10,
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.palette.champagneGold,
    textAlign: 'center',
  },
});

export default LogoLoader;
