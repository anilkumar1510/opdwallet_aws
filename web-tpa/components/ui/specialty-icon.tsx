import React from 'react';
import { getSpecialtyIcon } from '@/lib/utils/specialty-icon-mapper';
import { type LucideIcon } from 'lucide-react';

interface SpecialtyIconProps {
  icon?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4 text-base',
  md: 'w-6 h-6 text-2xl',
  lg: 'w-8 h-8 text-3xl',
};

export function SpecialtyIcon({
  icon,
  name,
  size = 'md',
  className = '',
}: SpecialtyIconProps) {
  const iconData = getSpecialtyIcon(icon);

  const baseClasses = SIZE_CLASSES[size];
  const combinedClasses = `${baseClasses} ${className}`.trim();

  if (iconData.type === 'component') {
    const IconComponent = iconData.value as LucideIcon;
    return (
      <IconComponent
        className={combinedClasses.replace(/text-\S+/, '')} // Remove text-* classes for SVG
        aria-label={`${name} icon`}
      />
    );
  }

  if (iconData.type === 'emoji') {
    return (
      <span className={combinedClasses} aria-label={`${name} icon`}>
        {iconData.value}
      </span>
    );
  }

  // No icon available - return null or a default icon
  return null;
}
