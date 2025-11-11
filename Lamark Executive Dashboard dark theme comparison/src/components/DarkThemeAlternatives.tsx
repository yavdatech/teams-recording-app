import { Check } from "lucide-react";

interface ThemeOption {
  name: string;
  description: string;
  colors: {
    bg: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    gridLine: string;
    accent: string;
    accentSecondary: string;
  };
  benefits: string[];
  considerations: string[];
}

const themeOptions: ThemeOption[] = [
  {
    name: "Current Deep Black",
    description: "Ultra-dark, modern aesthetic with maximum OLED optimization",
    colors: {
      bg: "#0A0A0B",
      bgSecondary: "#141416",
      bgTertiary: "#1A1A1C",
      textPrimary: "#E6EDF3",
      textSecondary: "#CCCCCC",
      border: "#2A2A2C",
      gridLine: "#1F1F21",
      accent: "#1D5BEB",
      accentSecondary: "#FF0067",
    },
    benefits: [
      "Maximum contrast for OLED displays",
      "Modern, sleek aesthetic",
      "Excellent for dark mode enthusiasts",
      "Reduces eye strain in low light"
    ],
    considerations: [
      "Can feel heavy in bright environments",
      "May be too dark for some users",
      "Requires careful contrast management"
    ]
  },
  {
    name: "Navy Midnight",
    description: "Blue-tinted dark theme that reinforces Lamark brand identity",
    colors: {
      bg: "#0D1117",
      bgSecondary: "#161B22",
      bgTertiary: "#1F2937",
      textPrimary: "#E6EDF3",
      textSecondary: "#CCCCCC",
      border: "#30363D",
      gridLine: "#21262D",
      accent: "#2563EB",
      accentSecondary: "#FF0067",
    },
    benefits: [
      "Reinforces blue brand identity",
      "Softer than pure black",
      "Popular in data analytics tools",
      "Better depth perception"
    ],
    considerations: [
      "Blue tint may not suit all content",
      "Less neutral than gray-based themes",
      "Can affect color perception slightly"
    ]
  },
  {
    name: "Charcoal Pro",
    description: "Professional charcoal with warmer tones for extended viewing comfort",
    colors: {
      bg: "#1E1E1E",
      bgSecondary: "#252526",
      bgTertiary: "#2D2D30",
      textPrimary: "#E6EDF3",
      textSecondary: "#CCCCCC",
      border: "#3E3E42",
      gridLine: "#2F2F32",
      accent: "#1D5BEB",
      accentSecondary: "#FF0067",
    },
    benefits: [
      "Proven in professional IDEs (VS Code)",
      "Excellent long-term readability",
      "Balanced contrast levels",
      "Warmer, less harsh on eyes"
    ],
    considerations: [
      "Less dramatic than pure black",
      "May feel less 'premium'",
      "Slightly less contrast"
    ]
  },
  {
    name: "High Contrast Minimal",
    description: "Maximum contrast with minimal backgrounds for data-first approach",
    colors: {
      bg: "#000000",
      bgSecondary: "#0F0F0F",
      bgTertiary: "#1A1A1A",
      textPrimary: "#E6EDF3",
      textSecondary: "#CCCCCC",
      border: "#333333",
      gridLine: "#262626",
      accent: "#3B82F6",
      accentSecondary: "#FF0067",
    },
    benefits: [
      "Maximum possible contrast",
      "Best for accessibility (WCAG AAA)",
      "Data stands out prominently",
      "Clean, minimal aesthetic"
    ],
    considerations: [
      "Can cause eye strain for some",
      "Very stark appearance",
      "Less subtle visual hierarchy"
    ]
  }
];

export function DarkThemeAlternatives() {
  return (
    <div style={{ 
      backgroundColor: '#F5F5F5', 
      minHeight: '100vh',
      padding: '48px 24px'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '48px' }}>
        <h1 style={{ color: '#0A0A0B', marginBottom: '12px' }}>
          Dark Theme Alternatives
        </h1>
        <p style={{ color: '#53565A', fontSize: '18px' }}>
          Explore different approaches to dark mode design for your Tableau dashboards. Each theme maintains Tableau compatibility while offering unique benefits.
        </p>
      </div>

      {/* Theme Grid */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '32px'
      }}>
        {themeOptions.map((theme, index) => (
          <ThemeCard key={index} theme={theme} isCurrentTheme={index === 0} />
        ))}
      </div>

      {/* Additional Recommendations */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '64px auto 0',
        padding: '32px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #DDDDDE'
      }}>
        <h2 style={{ color: '#0A0A0B', marginBottom: '24px' }}>
          Additional Dark Theme Considerations
        </h2>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          <RecommendationCard
            title="Color Temperature"
            description="Consider adding a warm or cool tint (subtle blue or orange) to reduce eye strain during extended use."
          />
          <RecommendationCard
            title="Adaptive Brightness"
            description="Design for multiple brightness levels - what works in a dark room may be too dark in office lighting."
          />
          <RecommendationCard
            title="Chart Color Palettes"
            description="Adjust your data visualization colors for each theme - colors that work on pure black may look different on charcoal or navy."
          />
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ theme, isCurrentTheme }: { theme: ThemeOption; isCurrentTheme: boolean }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: isCurrentTheme ? '2px solid #1D5BEB' : '1px solid #DDDDDE',
      position: 'relative'
    }}>
      {/* Current Theme Badge */}
      {isCurrentTheme && (
        <div style={{
          position: 'absolute',
          top: '-12px',
          right: '24px',
          backgroundColor: '#1D5BEB',
          color: '#FFFFFF',
          padding: '4px 12px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Check size={14} />
          CURRENT
        </div>
      )}

      {/* Theme Header */}
      <div style={{ padding: '24px', borderBottom: '1px solid #DDDDDE' }}>
        <h3 style={{ color: '#0A0A0B', marginBottom: '8px' }}>
          {theme.name}
        </h3>
        <p style={{ color: '#53565A', fontSize: '14px' }}>
          {theme.description}
        </p>
      </div>

      {/* Color Swatches */}
      <div style={{ padding: '24px', backgroundColor: '#F9F9F9' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <ColorSwatch label="Background" color={theme.colors.bg} />
          <ColorSwatch label="Secondary" color={theme.colors.bgSecondary} />
          <ColorSwatch label="Tertiary" color={theme.colors.bgTertiary} />
          <ColorSwatch label="Text Primary" color={theme.colors.textPrimary} />
          <ColorSwatch label="Text Secondary" color={theme.colors.textSecondary} />
          <ColorSwatch label="Border" color={theme.colors.border} />
          <ColorSwatch label="Grid Line" color={theme.colors.gridLine} />
          <ColorSwatch label="Accent" color={theme.colors.accent} />
          <ColorSwatch label="Accent 2" color={theme.colors.accentSecondary} />
        </div>
      </div>

      {/* Dashboard Preview */}
      <div style={{ 
        padding: '24px',
        backgroundColor: theme.colors.bg
      }}>
        <MiniDashboardPreview colors={theme.colors} />
      </div>

      {/* Benefits & Considerations */}
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#0A0A0B', marginBottom: '12px', fontSize: '14px' }}>
            Benefits
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {theme.benefits.map((benefit, i) => (
              <li key={i} style={{ color: '#53565A', fontSize: '13px', marginBottom: '6px' }}>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#0A0A0B', marginBottom: '12px', fontSize: '14px' }}>
            Considerations
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {theme.considerations.map((consideration, i) => (
              <li key={i} style={{ color: '#53565A', fontSize: '13px', marginBottom: '6px' }}>
                {consideration}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div>
      <div style={{
        width: '100%',
        height: '48px',
        backgroundColor: color,
        border: '1px solid #DDDDDE',
        marginBottom: '6px'
      }} />
      <div style={{ fontSize: '10px', color: '#53565A', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '11px', color: '#0A0A0B', fontFamily: 'monospace' }}>
        {color}
      </div>
    </div>
  );
}

function MiniDashboardPreview({ colors }: { colors: ThemeOption['colors'] }) {
  return (
    <div style={{ width: '100%' }}>
      {/* Mini Header */}
      <div style={{ 
        padding: '12px',
        borderBottom: `1px solid ${colors.border}`,
        marginBottom: '16px'
      }}>
        <div style={{ color: colors.textPrimary, fontSize: '14px', marginBottom: '4px' }}>
          Dashboard Preview
        </div>
        <div style={{ color: colors.textSecondary, fontSize: '11px' }}>
          Sample visualization layout
        </div>
      </div>

      {/* Mini KPI Cards */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '16px'
      }}>
        {[
          { label: 'ROAS', value: '4.2x', change: '+12%' },
          { label: 'Spend', value: '$45K', change: '+8%' },
          { label: 'CPL', value: '$12.50', change: '-5%' }
        ].map((kpi, i) => (
          <div 
            key={i}
            style={{
              backgroundColor: colors.bgSecondary,
              border: `1px solid ${colors.border}`,
              padding: '10px'
            }}
          >
            <div style={{ color: colors.textSecondary, fontSize: '9px', marginBottom: '4px' }}>
              {kpi.label}
            </div>
            <div style={{ color: colors.textPrimary, fontSize: '16px', marginBottom: '2px' }}>
              {kpi.value}
            </div>
            <div style={{ color: colors.accent, fontSize: '9px' }}>
              {kpi.change}
            </div>
          </div>
        ))}
      </div>

      {/* Mini Chart */}
      <div style={{
        backgroundColor: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        padding: '12px',
        height: '120px',
        position: 'relative'
      }}>
        {/* Y-axis */}
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '12px',
          bottom: '20px',
          width: '1px',
          backgroundColor: colors.gridLine
        }} />
        
        {/* X-axis */}
        <div style={{
          position: 'absolute',
          left: '12px',
          right: '12px',
          bottom: '20px',
          height: '1px',
          backgroundColor: colors.gridLine
        }} />

        {/* Grid lines */}
        {[25, 50, 75].map((percent) => (
          <div
            key={percent}
            style={{
              position: 'absolute',
              left: '12px',
              right: '12px',
              bottom: `${20 + percent}px`,
              height: '1px',
              backgroundColor: colors.gridLine,
              opacity: 0.3
            }}
          />
        ))}

        {/* Sample bars */}
        <div style={{
          position: 'absolute',
          left: '24px',
          right: '12px',
          bottom: '20px',
          top: '12px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
          paddingLeft: '8px'
        }}>
          {[60, 75, 55, 85, 70, 90].map((height, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${height}%`,
                backgroundColor: i === 3 ? colors.accentSecondary : colors.accent,
                opacity: i === 3 ? 1 : 0.8
              }}
            />
          ))}
        </div>

        {/* Axis labels */}
        <div style={{
          position: 'absolute',
          bottom: '4px',
          left: '24px',
          color: colors.textSecondary,
          fontSize: '8px'
        }}>
          Jan - Jun
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 style={{ color: '#1D5BEB', marginBottom: '8px', fontSize: '16px' }}>
        {title}
      </h3>
      <p style={{ color: '#53565A', fontSize: '14px', lineHeight: '1.5' }}>
        {description}
      </p>
    </div>
  );
}