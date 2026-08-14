import React from 'react';
import * as LucideIcons from 'lucide-react';

const ICON_MAP = {
  // Navigation & Chevrons
  'chevron-forward': 'ChevronRight',
  'chevron-back': 'ChevronLeft',
  'chevron-right': 'ChevronRight',
  'chevron-left': 'ChevronLeft',
  'chevron-down': 'ChevronDown',
  'chevron-up': 'ChevronUp',
  'arrow-back': 'ArrowLeft',
  'arrow-forward': 'ArrowRight',
  'arrow-up': 'ArrowUp',
  'arrow-down': 'ArrowDown',
  
  // Actions & Controls
  'add': 'Plus',
  'remove': 'Minus',
  'view-dashboard': 'LayoutDashboard',
  'view-dashboard-outline': 'LayoutDashboard',
  'calendar-blank': 'CalendarDays',
  'calendar-blank-outline': 'CalendarDays',
  'account-group': 'Users',
  'account-group-outline': 'Users',
  'hardware-chip': 'Cpu',
  'hardware-chip-outline': 'Cpu',
  'close': 'X',
  'x': 'X',
  'close-circle': 'XCircle',
  'close-circle-outline': 'XCircle',
  'checkmark': 'Check',
  'checkmark-circle': 'CheckCircle2',
  'checkmark-circle-outline': 'CheckCircle2',
  'checkmark-done-circle': 'CheckCheck',
  'checkmark-done-circle-outline': 'CheckCheck',
  'search': 'Search',
  'search-outline': 'Search',
  'filter': 'Filter',
  'funnel': 'Filter',
  'funnel-outline': 'Filter',
  'options': 'SlidersHorizontal',
  'options-outline': 'SlidersHorizontal',
  'refresh': 'RotateCw',
  'refresh-outline': 'RotateCw',
  'create': 'Pencil',
  'create-outline': 'Pencil',
  'trash': 'Trash2',
  'trash-outline': 'Trash2',
  'cloud-upload': 'UploadCloud',
  'cloud-upload-outline': 'UploadCloud',
  'send': 'Send',
  'send-outline': 'Send',
  'play': 'Play',
  'play-outline': 'Play',
  'play-circle': 'PlayCircle',
  
  // Status & Alerts
  'alert-circle': 'CircleAlert',
  'alert-circle-outline': 'CircleAlert',
  'information-circle': 'Info',
  'information-circle-outline': 'Info',
  'alert-triangle': 'AlertTriangle',
  'alert-decagram': 'AlertOctagon',
  'warning': 'AlertTriangle',
  'warning-outline': 'AlertTriangle',
  'shield-checkmark': 'ShieldCheck',
  'shield-checkmark-outline': 'ShieldCheck',
  
  // Communication & Social
  'chatbubble-ellipses': 'MessageSquare',
  'chatbubble-ellipses-outline': 'MessageSquare',
  'chatbubbles': 'MessagesSquare',
  'chatbubbles-outline': 'MessagesSquare',
  'mail': 'Mail',
  'mail-outline': 'Mail',
  'phone': 'Phone',
  'phone-outline': 'Phone',
  
  // User & Auth
  'person': 'User',
  'person-outline': 'User',
  'user': 'User',
  'users': 'Users',
  'people': 'Users',
  'people-outline': 'Users',
  'person-add': 'UserPlus',
  'person-add-outline': 'UserPlus',
  'lock-closed': 'Lock',
  'lock-closed-outline': 'Lock',
  'lock-open': 'Unlock',
  'lock-open-outline': 'Unlock',
  'log-out': 'LogOut',
  'log-out-outline': 'LogOut',
  'logout': 'LogOut',
  
  // Business & Analytics
  'calendar': 'Calendar',
  'calendar-outline': 'Calendar',
  'calendar-clear': 'CalendarDays',
  'calendar-clear-outline': 'CalendarDays',
  'calendar-clock': 'CalendarClock',
  'time': 'Clock',
  'time-outline': 'Clock',
  'hourglass': 'Hourglass',
  'hourglass-outline': 'Hourglass',
  'cash': 'DollarSign',
  'cash-outline': 'DollarSign',
  'calculator': 'Calculator',
  'calculator-outline': 'Calculator',
  'stats-chart': 'BarChart3',
  'stats-chart-outline': 'BarChart3',
  'pulse': 'Activity',
  'pulse-outline': 'Activity',
  'activity': 'Activity',
  'trophy': 'Trophy',
  'trophy-outline': 'Trophy',
  
  // Tech & Hardware
  'car': 'Car',
  'car-outline': 'Car',
  'flash': 'Zap',
  'flash-outline': 'Zap',
  'flash-sharp': 'Zap',
  'construct': 'Wrench',
  'construct-outline': 'Wrench',
  'hardware-chip': 'Cpu',
  'hardware-chip-outline': 'Cpu',
  'location': 'MapPin',
  'location-outline': 'MapPin',
  'navigate': 'Navigation',
  'navigate-outline': 'Navigation',
  'camera': 'Camera',
  'camera-outline': 'Camera',
  'sunny': 'Sun',
  'sunny-outline': 'Sun',
  'moon': 'Moon',
  'moon-outline': 'Moon',
  'eye': 'Eye',
  'eye-outline': 'Eye',
  'eye-off': 'EyeOff',
  'eye-off-outline': 'EyeOff',
};

function normalizeName(name) {
  if (!name) return 'Circle';
  const str = String(name).toLowerCase().trim();
  if (ICON_MAP[str]) return ICON_MAP[str];
  
  // Try removing suffix like -outline, -sharp
  const stripped = str.replace(/-(outline|sharp|fill)$/, '');
  if (ICON_MAP[stripped]) return ICON_MAP[stripped];
  
  // Convert kebab-case to PascalCase
  const pascal = str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  if (LucideIcons[pascal]) return pascal;

  return 'HelpCircle';
}

function createVectorIconComponent() {
  const IconComponent = React.forwardRef(({ name, size = 20, color = 'currentColor', style, ...rest }, ref) => {
    const lucideName = normalizeName(name);
    const Component = LucideIcons[lucideName] || LucideIcons.HelpCircle || LucideIcons.Circle;

    const computedStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      verticalAlign: 'middle',
      flexShrink: 0,
      ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
    };

    return (
      <span ref={ref} style={computedStyle} {...rest}>
        <Component size={size} color={color} strokeWidth={2} />
      </span>
    );
  });

  IconComponent.displayName = 'VectorIcon';
  return IconComponent;
}

export const Ionicons = createVectorIconComponent();
export const MaterialCommunityIcons = createVectorIconComponent();
export const MaterialIcons = createVectorIconComponent();
export const Feather = createVectorIconComponent();
export const FontAwesome = createVectorIconComponent();
export const FontAwesome5 = createVectorIconComponent();
export const AntDesign = createVectorIconComponent();
export const Entypo = createVectorIconComponent();
export const SimpleLineIcons = createVectorIconComponent();
export const Octicons = createVectorIconComponent();
export const Zocial = createVectorIconComponent();
export const Foundation = createVectorIconComponent();
export const EvilIcons = createVectorIconComponent();
export const createIconSet = () => createVectorIconComponent();
export const createIconSetFromIcoMoon = () => createVectorIconComponent();

export default {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
  FontAwesome,
  FontAwesome5,
  AntDesign,
  Entypo,
  SimpleLineIcons,
  Octicons,
  createIconSet,
  createIconSetFromIcoMoon,
};
