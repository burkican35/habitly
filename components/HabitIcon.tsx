
import React from 'react';
import * as Icons from 'lucide-react';

interface HabitIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const HabitIcon: React.FC<HabitIconProps> = ({ name, className, size = 24 }) => {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent className={className} size={size} />;
};
