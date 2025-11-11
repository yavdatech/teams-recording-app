import { 
  LayoutDashboard, 
  TrendingUp, 
  Target, 
  BarChart3,
  HelpCircle,
  Home
} from "lucide-react";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface LeftNavigationProps {
  activeView: string;
  onViewChange: (viewId: string) => void;
}

const navigationItems: NavigationItem[] = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "pacing", label: "Pacing Dashboard", icon: Target, badge: "Live" },
  { id: "marketing", label: "Marketing Performance", icon: TrendingUp },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const secondaryItems: NavigationItem[] = [
  { id: "help", label: "Help & Support", icon: HelpCircle },
];

export function LeftNavigation({ activeView, onViewChange }: LeftNavigationProps) {
  return (
    <div 
      className="h-screen flex flex-col border-r flex-shrink-0" 
      style={{ 
        width: '260px',
        backgroundColor: '#FFFFFF',
        borderColor: '#DDDDDE'
      }}
    >
      {/* Logo Area */}
      <div className="p-6 border-b" style={{ borderColor: '#DDDDDE' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-8" style={{ backgroundColor: '#1D5BEB' }}></div>
            <div className="w-2 h-8" style={{ backgroundColor: '#FF0067' }}></div>
          </div>
          <div>
            <div className="font-medium" style={{ color: '#1D5BEB' }}>Lamark Media</div>
            <div className="text-xs" style={{ color: '#75787B' }}>Analytics Platform</div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-6">
          <div className="text-xs uppercase tracking-wide mb-2 px-3" style={{ color: '#989A9C' }}>
            Dashboards
          </div>
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover-nav-item"
                  style={{
                    backgroundColor: isActive ? '#F0F6FF' : 'transparent',
                    borderLeft: isActive ? '3px solid #1D5BEB' : '3px solid transparent',
                    color: isActive ? '#1D5BEB' : '#53565A',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#FAFBFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span 
                      className="text-xs px-2 py-0.5" 
                      style={{ 
                        backgroundColor: '#dcfce7',
                        color: '#16a34a'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Bottom Navigation */}
      <div className="border-t p-3" style={{ borderColor: '#DDDDDE' }}>
        <nav className="space-y-1">
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm"
                style={{
                  color: '#75787B',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FAFBFC';
                  e.currentTarget.style.color = '#53565A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#75787B';
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        {/* User Info */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: '#DDDDDE' }}>
          <div className="flex items-center gap-2 px-3">
            <div 
              className="w-8 h-8 flex items-center justify-center" 
              style={{ backgroundColor: '#D2DEFB', color: '#1D5BEB' }}
            >
              JD
            </div>
            <div className="flex-1">
              <div className="text-sm" style={{ color: '#53565A' }}>John Doe</div>
              <div className="text-xs" style={{ color: '#75787B' }}>Admin</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
