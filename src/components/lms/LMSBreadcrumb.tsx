import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function LMSBreadcrumb({ items }: Props) {
  return (
    <nav className="flex items-center flex-wrap gap-1 text-xs text-gray-500 dark:text-gray-400">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-1">
            {item.to && !isLast ? (
              <Link to={item.to} className="hover:text-primary-600 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-gray-700 dark:text-gray-200 font-semibold' : ''}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        );
      })}
    </nav>
  );
}
