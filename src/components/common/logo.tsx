import React from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';

export type LogoVariant = 'app-icon' | 'mark' | 'white' | 'black';

export interface LogoIconProps {
  size?: number;
  variant?: LogoVariant;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

const SOURCES: Record<LogoVariant, any> = {
  'app-icon': require('../../../assets/icon.png'),
  'mark': require('../../../assets/logo-mark.png'),
  'white': require('../../../assets/logo-mark-white.png'),
  'black': require('../../../assets/logo-mark-black.png'),
};

/**
 * OmniWealth Asset Convergence Nexus Logo
 * Renders the new production-grade brand icon.
 */
export const LogoIcon: React.FC<LogoIconProps> = ({
  size = 48,
  variant = 'app-icon',
  style,
  imageStyle,
}) => {
  const isAppIcon = variant === 'app-icon';
  const source = SOURCES[variant] || SOURCES['app-icon'];

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: isAppIcon ? size * 0.22 : 0,
          overflow: isAppIcon ? 'hidden' : 'visible',
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={[{ width: size, height: size }, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
};

export default LogoIcon;
