import { motion } from 'framer-motion';
import { getInitials, getImageUrl } from '../../utils/helpers';

const sizeMap = { xs: 'w-7 h-7 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-base', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl', '2xl': 'w-28 h-28 text-3xl' };

export default function Avatar({ src, name, size = 'md', online = false, className = '' }) {
  const url = getImageUrl(src);
  const sz = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {url ? (
        <img src={url} alt={name} className={`${sz} rounded-full object-cover ring-2 ring-purple-500/20`} />
      ) : (
        <div className={`${sz} rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white ring-2 ring-purple-500/20`}>
          {getInitials(name)}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-900" />
      )}
    </div>
  );
}
