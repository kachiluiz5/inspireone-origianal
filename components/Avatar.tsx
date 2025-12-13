import React, { useState } from 'react';

interface AvatarProps {
  handle: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'giant';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ handle, name, size = 'md', className = '' }) => {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    giant: 'w-32 h-32 md:w-40 md:h-40'
  };

  // Prioritize handle for unavatar, fallback to UI Avatars if it fails
  const src = error 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
    : `https://unavatar.io/twitter/${handle}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

  return (
    <div className={`relative rounded-full overflow-hidden flex-shrink-0 bg-gray-200 border-4 border-white shadow-lg ${sizeClasses[size]} ${className}`}>
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
};

export default Avatar;