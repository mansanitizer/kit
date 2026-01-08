import React from 'react';
import * as LucideIcons from 'lucide-react';

interface Win98IconProps {
  name: string;
  size?: number;
  className?: string;
}

// Convert kebab-case to PascalCase (e.g. "message-square" -> "MessageSquare")
const toPascalCase = (str: string) => {
  return str.split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
};

const iconMap: Record<string, string> = {
  // Aliases to specific Lucide icons (using their exported names)
  'run': 'Play',
  'logout': 'LogOut',
  'shutdown': 'Power',
  'document': 'FileText',
  'spreadsheet': 'BarChart3',
  'folder-open': 'FolderOpen',
  'clean': 'Sparkles',

  // Explicit mappings for Win98 concepts if needed, 
  // though most map directly if named correctly (e.g. Folder -> Folder)
};

export const Win98Icon: React.FC<Win98IconProps> = ({
  name,
  size = 16,
  className = ''
}) => {
  const normalizedName = name.toLowerCase();

  // 0. Check for custom image icons
  const customIcons: Record<string, string> = {
    'tools': '/icons/toolbox.png',
    'toolbox': '/icons/toolbox.png',
  };

  const customSrc = customIcons[normalizedName];
  if (customSrc) {
    return (
      <img
        src={customSrc}
        alt={name}
        width={size}
        height={size}
        className={`win98-icon ${className}`}
        style={{
          imageRendering: 'pixelated', // Crucial for pixel art
          objectFit: 'contain'
        }}
      />
    );
  }

  // 1. Check aliases first
  let iconName = iconMap[normalizedName];

  // 2. If no alias, try PascalCase conversion (e.g. "message-square" -> "MessageSquare")
  if (!iconName) {
    iconName = toPascalCase(name);
  }

  // 3. Resolve component
  // @ts-ignore - Dynamic lookup on module export
  let IconComponent = LucideIcons[iconName];

  // 4. Fallback: Try exact match if PascalCase didn't work (e.g. if input was already PascalCase)
  if (!IconComponent) {
    // @ts-ignore
    IconComponent = LucideIcons[name];
  }

  // 5. Final Fallback
  if (!IconComponent) {
    IconComponent = LucideIcons.File;
  }

  return (
    <IconComponent
      size={size}
      className={`win98-icon ${className}`}
      style={{
        strokeWidth: 1.5,
        color: 'inherit'
      }}
    />
  );
};

export default Win98Icon;
