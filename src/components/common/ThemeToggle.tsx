import { Sun, Moon } from 'lucide-react';
import { useTheme }  from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      className={`
        relative flex items-center w-14 h-7 p-1 rounded-full
        cursor-pointer transition-colors duration-300
        ${isDark ? 'bg-primary-600' : 'bg-gray-300'}
      `}
    >
      {/* Thumb */}
      <span className={`
        absolute flex items-center justify-center
        w-5 h-5 bg-white rounded-full shadow-md
        transition-transform duration-300
        ${isDark ? 'translate-x-7' : 'translate-x-0'}
      `}>
        {isDark
          ? <Moon className="w-3 h-3 text-primary-600" />
          : <Sun  className="w-3 h-3 text-yellow-500"  />
        }
      </span>
    </button>
  );
}