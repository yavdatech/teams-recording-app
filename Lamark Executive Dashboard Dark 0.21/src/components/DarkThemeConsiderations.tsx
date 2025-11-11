import { Sun, Moon, Palette } from "lucide-react";

interface ColorTemperatureTheme {
  name: string;
  description: string;
  temperature: string;
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
}

interface BrightnessLevel {
  name: string;
  description: string;
  useCase: string;
  colors: {
    bg: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    gridLine: string;
  };
}

interface ChartPalette {
  name: string;
  background: string;
  colors: string[];
  description: string;
}

const temperatureThemes: ColorTemperatureTheme[] = [
  {
    name: "Neutral Gray",
    description: "Pure neutral - no color temperature bias",
    temperature: "neutral",
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
    }
  },
  {
    name: "Cool Blue Tint",
    description: "Subtle blue tint reduces eye strain, reinforces tech aesthetic",
    temperature: "cool",
    colors: {
      bg: "#0A0B0D",
      bgSecondary: "#141619",
      bgTertiary: "#1A1C20",
      textPrimary: "#E6EDF3",
      textSecondary: "#CCCCCC",
      border: "#2A2C30",
      gridLine: "#1F2125",
      accent: "#1D5BEB",
      accentSecondary: "#FF0067",
    }
  },
  {
    name: "Warm Sepia Tint",
    description: "Gentle warmth for extended viewing comfort",
    temperature: "warm",
    colors: {
      bg: "#0D0B0A",
      bgSecondary: "#181614",
      bgTertiary: "#1F1C1A",
      textPrimary: "#E6EDF3",
      textSecondary: "#CCCCCC",
      border: "#2E2B2A",
      gridLine: "#24211F",
      accent: "#1D5BEB",
      accentSecondary: "#FF0067",
    }
  }
];

const brightnessLevels: BrightnessLevel[] = [
  {
    name: "Ultra Dark",
    description: "Deepest blacks for OLED displays and very low light environments",
    useCase: "Night work, dark rooms, OLED screens",
    colors: {
      bg: "#000000",
      bgSecondary: "#0A0A0B",
      bgTertiary: "#141416",
      textPrimary: "#E6EDF3",
      textSecondary: "#CCCCCC",
      border: "#1F1F21",
      gridLine: "#0F0F10",
    }
  },
  {
    name: "Standard Dark",
    description: "Balanced darkness for typical office environments",
    useCase: "Standard office lighting, mixed environments",
    colors: {
      bg: "#0A0A0B",
      bgSecondary: "#141416",
      bgTertiary: "#1A1A1C",
      textPrimary: "#E6EDF3",
      textSecondary: "#CCCCCC",
      border: "#2A2A2C",
      gridLine: "#1F1F21",
    }
  },
  {
    name: "Elevated Dark",
    description: "Lighter dark mode for bright offices and daytime use",
    useCase: "Bright offices, windows, daytime work",
    colors: {
      bg: "#1A1A1C",
      bgSecondary: "#232326",
      bgTertiary: "#2D2D30",
      textPrimary: "#E6EDF3",
      textSecondary: "#CCCCCC",
      border: "#3E3E42",
      gridLine: "#2F2F32",
    }
  }
];

const chartPalettes: ChartPalette[] = [
  {
    name: "Deep Black Optimized",
    background: "#0A0A0B",
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"],
    description: "Vibrant colors with increased saturation for deep black backgrounds"
  },
  {
    name: "Navy Background Optimized",
    background: "#0D1117",
    colors: ["#60A5FA", "#34D399", "#FBBF24", "#F87171", "#A78BFA", "#F472B6"],
    description: "Slightly lighter tones to compensate for blue-tinted background"
  },
  {
    name: "Charcoal Optimized",
    background: "#1E1E1E",
    colors: ["#60A5FA", "#34D399", "#FBBF24", "#F87171", "#A78BFA", "#F472B6"],
    description: "Balanced brightness for mid-tone charcoal backgrounds"
  },
  {
    name: "High Contrast",
    background: "#000000",
    colors: ["#60A5FA", "#4ADE80", "#FCD34D", "#FCA5A5", "#C4B5FD", "#F9A8D4"],
    description: "Maximum brightness and saturation for pure black backgrounds"
  }
];

export function DarkThemeConsiderations() {
  return (
    <div style={{ 
      backgroundColor: '#F5F5F5', 
      minHeight: '100vh',
      padding: '48px 24px'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', marginBottom: '48px' }}>
        <h1 style={{ color: '#0A0A0B', marginBottom: '12px' }}>
          Dark Theme Considerations - Applied
        </h1>
        <p style={{ color: '#53565A', fontSize: '18px' }}>
          Practical implementations of color temperature, adaptive brightness, and chart palette optimization for dark themes.
        </p>
      </div>

      {/* Color Temperature Section */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', marginBottom: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Palette size={32} color="#1D5BEB" />
          <div>
            <h2 style={{ color: '#0A0A0B', marginBottom: '4px' }}>
              Color Temperature Variants
            </h2>
            <p style={{ color: '#53565A' }}>
              Subtle tints can reduce eye strain and reinforce brand aesthetics
            </p>
          </div>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          {temperatureThemes.map((theme, index) => (
            <TemperatureCard key={index} theme={theme} />
          ))}
        </div>
      </div>

      {/* Brightness Levels Section */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', marginBottom: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Sun size={32} color="#1D5BEB" />
          <div>
            <h2 style={{ color: '#0A0A0B', marginBottom: '4px' }}>
              Adaptive Brightness Levels
            </h2>
            <p style={{ color: '#53565A' }}>
              Different darkness levels for various lighting environments
            </p>
          </div>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          {brightnessLevels.map((level, index) => (
            <BrightnessCard key={index} level={level} />
          ))}
        </div>
      </div>

      {/* Chart Palettes Section */}
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Moon size={32} color="#1D5BEB" />
          <div>
            <h2 style={{ color: '#0A0A0B', marginBottom: '4px' }}>
              Chart Color Palettes by Background
            </h2>
            <p style={{ color: '#53565A' }}>
              Optimized data visualization colors for different dark backgrounds
            </p>
          </div>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px'
        }}>
          {chartPalettes.map((palette, index) => (
            <ChartPaletteCard key={index} palette={palette} />
          ))}
        </div>
      </div>

      {/* Best Practices */}
      <div style={{ 
        maxWidth: '1600px', 
        margin: '64px auto 0',
        padding: '32px',
        backgroundColor: '#FFFFFF',
        border: '2px solid #1D5BEB'
      }}>
        <h2 style={{ color: '#0A0A0B', marginBottom: '24px' }}>
          Implementation Best Practices
        </h2>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '32px'
        }}>
          <BestPracticeItem
            number="1"
            title="Choose Your Foundation"
            description="Start with either Neutral Gray or Cool Blue Tint as your base. Cool blue is recommended for tech/data products and aligns with Lamark's blue branding."
          />
          <BestPracticeItem
            number="2"
            title="Set Brightness Default"
            description="Use Standard Dark as the default, but offer Ultra Dark and Elevated Dark as user preferences or auto-switch based on time of day."
          />
          <BestPracticeItem
            number="3"
            title="Match Chart Colors"
            description="Always pair your background choice with its optimized chart palette. Darker backgrounds need more vibrant colors; lighter dark backgrounds need moderate saturation."
          />
          <BestPracticeItem
            number="4"
            title="Test in Context"
            description="View your dashboard in actual office lighting conditions - what looks good at night may be too dark during the day with natural light."
          />
        </div>

        <div style={{ 
          marginTop: '32px',
          padding: '20px',
          backgroundColor: '#F0F7FF',
          border: '1px solid #1D5BEB'
        }}>
          <h3 style={{ color: '#1D5BEB', marginBottom: '12px' }}>
            Recommended Combination for Lamark Media
          </h3>
          <p style={{ color: '#53565A', lineHeight: '1.6' }}>
            <strong>Base:</strong> Cool Blue Tint (#0A0B0D) + Standard Dark brightness<br/>
            <strong>Charts:</strong> Navy Background Optimized palette<br/>
            <strong>Rationale:</strong> Reinforces blue brand identity, works in typical office environments, and provides optimal contrast for data visualization without being overly stark.
          </p>
        </div>
      </div>
    </div>
  );
}

function TemperatureCard({ theme }: { theme: ColorTemperatureTheme }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #DDDDDE',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #DDDDDE' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          <h3 style={{ color: '#0A0A0B' }}>
            {theme.name}
          </h3>
          <div style={{
            padding: '2px 8px',
            backgroundColor: theme.temperature === 'cool' ? '#DBEAFE' : theme.temperature === 'warm' ? '#FEF3C7' : '#F3F4F6',
            color: theme.temperature === 'cool' ? '#1D4ED8' : theme.temperature === 'warm' ? '#B45309' : '#4B5563',
            fontSize: '11px'
          }}>
            {theme.temperature}
          </div>
        </div>
        <p style={{ color: '#53565A', fontSize: '13px' }}>
          {theme.description}
        </p>
      </div>

      {/* Color Swatches */}
      <div style={{ padding: '16px', backgroundColor: '#F9F9F9' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <div style={{ flex: 1, height: '32px', backgroundColor: theme.colors.bg, border: '1px solid #DDDDDE' }} />
          <div style={{ flex: 1, height: '32px', backgroundColor: theme.colors.bgSecondary, border: '1px solid #DDDDDE' }} />
          <div style={{ flex: 1, height: '32px', backgroundColor: theme.colors.bgTertiary, border: '1px solid #DDDDDE' }} />
        </div>
        <div style={{ fontSize: '10px', color: '#53565A', textAlign: 'center' }}>
          Background Layers
        </div>
      </div>

      {/* Preview */}
      <div style={{ 
        padding: '20px',
        backgroundColor: theme.colors.bg
      }}>
        <div style={{
          backgroundColor: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.border}`,
          padding: '16px'
        }}>
          <div style={{ color: theme.colors.textPrimary, fontSize: '14px', marginBottom: '8px' }}>
            Sample Dashboard Header
          </div>
          <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '12px' }}>
            Notice the subtle temperature shift in the background
          </div>
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <div style={{
              flex: 1,
              padding: '8px',
              backgroundColor: theme.colors.bgTertiary,
              border: `1px solid ${theme.colors.border}`
            }}>
              <div style={{ color: theme.colors.textSecondary, fontSize: '10px', marginBottom: '4px' }}>
                ROAS
              </div>
              <div style={{ color: theme.colors.textPrimary, fontSize: '16px' }}>
                4.2x
              </div>
            </div>
            <div style={{
              flex: 1,
              padding: '8px',
              backgroundColor: theme.colors.bgTertiary,
              border: `1px solid ${theme.colors.border}`
            }}>
              <div style={{ color: theme.colors.textSecondary, fontSize: '10px', marginBottom: '4px' }}>
                Spend
              </div>
              <div style={{ color: theme.colors.textPrimary, fontSize: '16px' }}>
                $45K
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrightnessCard({ level }: { level: BrightnessLevel }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #DDDDDE',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #DDDDDE' }}>
        <h3 style={{ color: '#0A0A0B', marginBottom: '8px' }}>
          {level.name}
        </h3>
        <p style={{ color: '#53565A', fontSize: '13px', marginBottom: '8px' }}>
          {level.description}
        </p>
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#F0F7FF',
          border: '1px solid #BFDBFE',
          fontSize: '12px',
          color: '#1D4ED8'
        }}>
          <strong>Use Case:</strong> {level.useCase}
        </div>
      </div>

      {/* Brightness Comparison */}
      <div style={{ padding: '16px', backgroundColor: '#F9F9F9' }}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: '#53565A', marginBottom: '4px' }}>
            Background Intensity
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ flex: 1, height: '24px', backgroundColor: level.colors.bg, border: '1px solid #DDDDDE' }} />
            <div style={{ flex: 1, height: '24px', backgroundColor: level.colors.bgSecondary, border: '1px solid #DDDDDE' }} />
            <div style={{ flex: 1, height: '24px', backgroundColor: level.colors.bgTertiary, border: '1px solid #DDDDDE' }} />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div style={{ 
        padding: '20px',
        backgroundColor: level.colors.bg,
        minHeight: '200px'
      }}>
        <div style={{
          backgroundColor: level.colors.bgSecondary,
          border: `1px solid ${level.colors.border}`,
          padding: '16px'
        }}>
          <div style={{ color: level.colors.textPrimary, fontSize: '14px', marginBottom: '4px' }}>
            Dashboard Title
          </div>
          <div style={{ color: level.colors.textSecondary, fontSize: '11px', marginBottom: '12px' }}>
            Subtitle and metadata
          </div>
          
          {/* Mini chart */}
          <div style={{
            backgroundColor: level.colors.bgTertiary,
            border: `1px solid ${level.colors.border}`,
            padding: '12px',
            height: '80px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: '12px',
              right: '12px',
              bottom: '12px',
              height: '1px',
              backgroundColor: level.colors.gridLine
            }} />
            <div style={{
              position: 'absolute',
              left: '12px',
              bottom: '12px',
              top: '12px',
              width: '1px',
              backgroundColor: level.colors.gridLine
            }} />
            
            {/* Bars */}
            <div style={{
              position: 'absolute',
              left: '20px',
              right: '12px',
              bottom: '12px',
              top: '12px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '6px'
            }}>
              {[50, 70, 60, 85, 65].map((height, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${height}%`,
                    backgroundColor: '#1D5BEB',
                    opacity: 0.8
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartPaletteCard({ palette }: { palette: ChartPalette }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #DDDDDE',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #DDDDDE' }}>
        <h3 style={{ color: '#0A0A0B', marginBottom: '8px' }}>
          {palette.name}
        </h3>
        <p style={{ color: '#53565A', fontSize: '13px' }}>
          {palette.description}
        </p>
      </div>

      {/* Color Swatches */}
      <div style={{ padding: '20px', backgroundColor: '#F9F9F9' }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
          marginBottom: '8px'
        }}>
          {palette.colors.map((color, i) => (
            <div key={i}>
              <div style={{
                width: '100%',
                height: '48px',
                backgroundColor: color,
                border: '1px solid #DDDDDE',
                marginBottom: '4px'
              }} />
              <div style={{
                fontSize: '9px',
                color: '#53565A',
                fontFamily: 'monospace',
                textAlign: 'center'
              }}>
                {color}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div style={{ 
        padding: '24px',
        backgroundColor: palette.background
      }}>
        {/* Bar Chart */}
        <div style={{
          height: '140px',
          position: 'relative',
          marginBottom: '20px'
        }}>
          <div style={{
            position: 'absolute',
            left: '0',
            right: '0',
            bottom: '0',
            height: '1px',
            backgroundColor: '#2A2A2C'
          }} />
          
          <div style={{
            position: 'absolute',
            left: '0',
            right: '0',
            bottom: '0',
            top: '0',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '4px'
          }}>
            {palette.colors.map((color, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${60 + (i * 8)}%`,
                  backgroundColor: color
                }}
              />
            ))}
          </div>
        </div>

        {/* Line Chart */}
        <div style={{
          height: '100px',
          position: 'relative',
          borderTop: '1px solid #2A2A2C'
        }}>
          <svg width="100%" height="100" style={{ display: 'block' }}>
            {/* Grid lines */}
            <line x1="0" y1="25" x2="100%" y2="25" stroke="#1F1F21" strokeWidth="1" />
            <line x1="0" y1="50" x2="100%" y2="50" stroke="#1F1F21" strokeWidth="1" />
            <line x1="0" y1="75" x2="100%" y2="75" stroke="#1F1F21" strokeWidth="1" />
            
            {/* Lines */}
            <polyline
              points="0,60 60,40 120,50 180,25 240,35 300,20"
              fill="none"
              stroke={palette.colors[0]}
              strokeWidth="2"
            />
            <polyline
              points="0,75 60,65 120,55 180,60 240,45 300,40"
              fill="none"
              stroke={palette.colors[2]}
              strokeWidth="2"
            />
            <polyline
              points="0,85 60,80 120,70 180,75 240,65 300,55"
              fill="none"
              stroke={palette.colors[4]}
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function BestPracticeItem({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{
        width: '40px',
        height: '40px',
        backgroundColor: '#1D5BEB',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        flexShrink: 0
      }}>
        {number}
      </div>
      <div>
        <h3 style={{ color: '#0A0A0B', marginBottom: '8px', fontSize: '16px' }}>
          {title}
        </h3>
        <p style={{ color: '#53565A', fontSize: '14px', lineHeight: '1.5' }}>
          {description}
        </p>
      </div>
    </div>
  );
}
