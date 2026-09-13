import React from 'react';
import {
  Coffee,
  Banknote,
  DoorOpen,
  DoorClosed,
  Package,
  ShieldCheck,
  Sparkles,
  HeartHandshake,
  Wrench,
  BookOpenCheck,
  Megaphone,
  Truck,
  GraduationCap,
  Calendar,
  BarChart3,
  Award,
  Star,
  Flame,
  Trophy,
  Zap,
  Lock,
  User,
  Users,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sprout,
  LucideIcon,
} from 'lucide-react';

interface RenderIconProps {
  icon?: string;
  className?: string;
  size?: number;
}

export function getCareerIcon(iconKey?: string): LucideIcon {
  if (!iconKey) return Layers;

  switch (iconKey.trim()) {
    // Levels
    case '🌱':
    case 'trial':
    case 'level-trial':
      return Sprout;
    case '☕':
    case 'coffee':
    case 'level-staff':
    case 'skill-brewing':
      return Coffee;
    case '⭐':
    case 'star':
    case 'level-leader':
      return Award;
    case '👔':
    case 'manager':
    case 'level-manager':
      return Briefcase;

    // Skills
    case '💰':
    case 'cashier':
    case 'skill-cashier':
      return Banknote;
    case '🔓':
    case 'open':
    case 'skill-open':
      return DoorOpen;
    case '🔒':
    case 'close':
    case 'skill-close':
    case 'locked':
      return DoorClosed;
    case '📦':
    case 'inventory':
    case 'skill-inventory':
      return Package;
    case '✅':
    case 'quality':
    case 'skill-quality':
      return ShieldCheck;
    case '🧹':
    case 'hygiene':
    case 'skill-hygiene':
      return Sparkles;
    case '🤝':
    case 'customer':
    case 'skill-customer':
      return HeartHandshake;
    case '🔧':
    case 'equipment':
    case 'skill-equipment':
      return Wrench;
    case '📝':
    case 'menu-dev':
    case 'skill-menu-dev':
      return BookOpenCheck;
    case '📱':
    case 'social':
    case 'skill-social':
      return Megaphone;
    case '🛵':
    case 'delivery':
    case 'skill-delivery':
      return Truck;
    case '🎓':
    case 'training':
    case 'skill-training':
      return GraduationCap;
    case '📅':
    case 'scheduling':
    case 'skill-scheduling':
      return Calendar;
    case '📊':
    case 'reporting':
    case 'skill-reporting':
      return BarChart3;

    // Achievements & Badges
    case '🎖️':
    case 'badge':
      return Award;
    case '🔥':
    case 'streak':
      return Flame;
    case '🏆':
    case 'trophy':
      return Trophy;
    case '⚡':
    case 'zap':
      return Zap;

    default:
      return Layers;
  }
}

export function CareerIcon({ icon, className = '', size = 18 }: RenderIconProps) {
  const IconComponent = getCareerIcon(icon);
  return <IconComponent size={size} className={className} />;
}
