import { useState } from "react";
import { LeftNavigation } from "./components/LeftNavigation";
import { PacingDashboard } from "./components/PacingDashboard";
import { MarketingDashboard } from "./components/MarketingDashboard";
import { DarkThemeAlternatives } from "./components/DarkThemeAlternatives";
import { DarkThemeConsiderations } from "./components/DarkThemeConsiderations";
import { Home, BarChart3, Settings, HelpCircle } from "lucide-react";

export default function App() {
  const [activeView, setActiveView] = useState("pacing");

  const renderContent = () => {
    switch (activeView) {
      case "considerations":
        return <DarkThemeConsiderations />;
      case "theme-compare":
        return <DarkThemeAlternatives />;
      case "overview":
        return <OverviewPlaceholder />;
      case "pacing":
        return <PacingDashboard />;
      case "marketing":
        return <MarketingDashboard />;
      case "analytics":
        return <AnalyticsPlaceholder />;
      case "settings":
        return <SettingsPlaceholder />;
      case "help":
        return <HelpPlaceholder />;
      default:
        return <PacingDashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0A0B0D', width: '1920px' }}>
      <LeftNavigation activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}

// Placeholder components for non-implemented views
function OverviewPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0B0D' }}>
      <div className="text-center">
        <Home className="w-16 h-16 mx-auto mb-4" style={{ color: '#1D5BEB' }} />
        <h2 className="mb-2" style={{ color: '#E6EDF3' }}>Overview Dashboard</h2>
        <p style={{ color: '#CCCCCC' }}>Coming soon - High-level performance summary</p>
      </div>
    </div>
  );
}

function AnalyticsPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0B0D' }}>
      <div className="text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4" style={{ color: '#1D5BEB' }} />
        <h2 className="mb-2" style={{ color: '#E6EDF3' }}>Analytics Dashboard</h2>
        <p style={{ color: '#CCCCCC' }}>Coming soon - Deep dive analytics and insights</p>
      </div>
    </div>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0B0D' }}>
      <div className="text-center">
        <Settings className="w-16 h-16 mx-auto mb-4" style={{ color: '#CCCCCC' }} />
        <h2 className="mb-2" style={{ color: '#E6EDF3' }}>Settings</h2>
        <p style={{ color: '#CCCCCC' }}>Dashboard configuration and preferences</p>
      </div>
    </div>
  );
}

function HelpPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0B0D' }}>
      <div className="text-center">
        <HelpCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#CCCCCC' }} />
        <h2 className="mb-2" style={{ color: '#E6EDF3' }}>Help & Support</h2>
        <p style={{ color: '#CCCCCC' }}>Documentation and support resources</p>
      </div>
    </div>
  );
}