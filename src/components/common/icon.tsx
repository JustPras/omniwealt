/**
 * Centralized icon component using @expo/vector-icons.
 * Replaces lucide-react-native to avoid react-native-svg native build issues.
 * Maps all icon names used in this app to Ionicons / MaterialCommunityIcons.
 */
import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export type IconName =
  | 'TrendingUp'
  | 'ArrowUpRight'
  | 'ArrowDownRight'
  | 'ArrowDownLeft'
  | 'ArrowRight'
  | 'Wallet'
  | 'Plus'
  | 'RefreshCw'
  | 'Sparkles'
  | 'Landmark'
  | 'Smartphone'
  | 'CheckCircle2'
  | 'BellRing'
  | 'History'
  | 'FileText'
  | 'Lock'
  | 'UploadCloud'
  | 'AlertCircle'
  | 'Zap'
  | 'LayoutDashboard'
  | 'Coins'
  | 'Edit2'
  | 'Eye'
  | 'EyeOff'
  | 'X'
  | 'Search'
  | 'Filter'
  | 'Trash2'
  | 'PieChart'
  | 'ShieldCheck'
  | 'ChevronRight'
  | 'Info'
  | 'Link'
  | 'Link2';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Icons that use MaterialCommunityIcons
const MCI_ICONS: Partial<Record<IconName, MCIName>> = {
  ArrowUpRight: 'arrow-top-right',
  ArrowDownRight: 'arrow-bottom-right',
  ArrowDownLeft: 'arrow-bottom-left',
  Landmark: 'bank',
  Coins: 'cash-multiple',
};

// Icons that use Ionicons
const IONICONS_MAP: Partial<Record<IconName, IoniconsName>> = {
  TrendingUp: 'trending-up',
  Wallet: 'wallet',
  Plus: 'add',
  RefreshCw: 'refresh',
  Sparkles: 'sparkles',
  Smartphone: 'phone-portrait',
  CheckCircle2: 'checkmark-circle',
  BellRing: 'notifications',
  History: 'time',
  FileText: 'document-text',
  Lock: 'lock-closed',
  UploadCloud: 'cloud-upload',
  AlertCircle: 'alert-circle',
  Zap: 'flash',
  LayoutDashboard: 'grid',
  Edit2: 'pencil',
  Eye: 'eye',
  EyeOff: 'eye-off',
  X: 'close',
  Search: 'search',
  Filter: 'filter',
  Trash2: 'trash-outline',
  PieChart: 'pie-chart',
  ShieldCheck: 'shield-checkmark',
  ChevronRight: 'chevron-forward',
  Info: 'information-circle',
  ArrowRight: 'arrow-forward',
  Link: 'link',
  Link2: 'link',
};

export function Icon({ name, size = 20, color = '#FFFFFF' }: IconProps) {
  const mciName = MCI_ICONS[name];
  if (mciName) {
    return <MaterialCommunityIcons name={mciName} size={size} color={color} />;
  }
  const ionName = IONICONS_MAP[name];
  if (ionName) {
    return <Ionicons name={ionName} size={size} color={color} />;
  }
  // Fallback to a generic circle
  return <Ionicons name="ellipse" size={size} color={color} />;
}
