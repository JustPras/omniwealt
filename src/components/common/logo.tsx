import React from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';

interface LogoIconProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

/**
 * OmniWealth brand icon — uses the app icon asset.
 * Safe for React Native (no SVG native dependency needed).
 */
export const LogoIcon: React.FC<LogoIconProps> = ({ size = 48, style, imageStyle }) => {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Image
        source={require('../../../assets/icon.png')}
        style={[{ width: size, height: size }, imageStyle]}
        resizeMode="cover"
      />
    </View>
  );
};

export default LogoIcon;
