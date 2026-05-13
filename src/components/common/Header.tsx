import { useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, RefreshCw } from 'lucide-react';
import PageNotifications from '@/components/common/PageNotifications';

interface Props {
  title:      string;
  subtitle?:  string;
  onRefresh?: () => void;
}

export default function Header({ title, subtitle, onRefresh }: Props) {
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem('iq-sidebar-collapsed') === '1');

  useEffect(() => {
    const onSidebarStateChanged = (event: Event) => {
      const custom = event as CustomEvent<{ collapsed?: boolean }>;
      if (typeof custom.detail?.collapsed === 'boolean') {
        setCollapsed(custom.detail.collapsed);
      }
    };
    window.addEventListener('iq-sidebar-state-changed', onSidebarStateChanged);
    return () => window.removeEventListener('iq-sidebar-state-changed', onSidebarStateChanged);
  }, []);

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('iq-sidebar-toggle'));
  };

  return (
    <div className="iq-page-header">
      <div className="w-full flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleSidebar}
            className="iq-btn-ghost"
            aria-label={collapsed ? 'Agrandir la sidebar' : 'Réduire la sidebar'}
            title={collapsed ? 'Agrandir la sidebar' : 'Réduire la sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          <div className="min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--iq-text-1)', fontFamily: 'var(--iq-font-display)' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--iq-text-2)' }}>
              {subtitle}
            </p>
          )}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <PageNotifications />
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="iq-btn-ghost text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}