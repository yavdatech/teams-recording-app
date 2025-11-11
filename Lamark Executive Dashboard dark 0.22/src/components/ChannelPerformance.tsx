import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Line,
  ComposedChart,
} from "recharts";

interface Channel {
  channel: string;
  actualSpend: number;
  targetSpend: number;
  actualROAS: number;
  targetROAS: number;
  variance: number;
}

interface ChannelPerformanceProps {
  data: Channel[];
}

export function ChannelPerformance({ data }: ChannelPerformanceProps) {
  const getROASBarColor = (variance: number) => {
    if (variance >= 0) return "#4ade80"; // lighter green
    if (variance >= -10) return "#FFB3D9"; // lighter Lamark pink
    return "#FF66A3"; // lighter Lamark hot pink
  };

  const getSpendBarColor = (actualSpend: number, targetSpend: number) => {
    const spendVariance = ((actualSpend - targetSpend) / targetSpend) * 100;
    if (spendVariance >= -10 && spendVariance <= 10) return "#4ade80"; // lighter green - on track
    if (spendVariance < -10) return "#FF66A3"; // lighter hot pink - under spending
    return "#FFB3D9"; // lighter pink - over spending
  };

  return (
    <div className="p-7 border" style={{ backgroundColor: '#1A1A1C', borderColor: '#2A2A2C' }}>
      <div className="mb-6">
        <h3 className="mb-2" style={{ color: '#E5E5E5' }}>Channel Performance Breakdown</h3>
        <p className="text-sm" style={{ color: '#B8B8B8' }}>
          Identify which channels are driving performance changes
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROAS by Channel - NOW FIRST */}
        <div className="p-4" style={{ backgroundColor: '#141416' }}>
          <h4 className="mb-4" style={{ color: '#E5E5E5' }}>ROAS Performance by Channel</h4>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2C" />
              <XAxis dataKey="channel" stroke="#666668" tick={{ fill: '#B8B8B8', fontSize: 11 }} />
              <YAxis stroke="#666668" tick={{ fill: '#B8B8B8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1A1C",
                  border: "1px solid #2A2A2C",
                  color: "#E5E5E5"
                }}
                formatter={(value: number) => value.toFixed(2) + "x"}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="actualROAS" name="Actual ROAS">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getROASBarColor(entry.variance)} />
                ))}
              </Bar>
              <Line 
                dataKey="targetROAS" 
                stroke="transparent"
                strokeWidth={0}
                dot={{ fill: '#B8B8B8', r: 5, strokeWidth: 2, stroke: '#2A2A2C' }}
                name="Target ROAS" 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Spend by Channel - NOW SECOND */}
        <div className="p-4" style={{ backgroundColor: '#141416' }}>
          <h4 className="mb-4" style={{ color: '#E5E5E5' }}>Spend Performance by Channel</h4>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2C" />
              <XAxis dataKey="channel" stroke="#666668" tick={{ fill: '#B8B8B8', fontSize: 11 }} />
              <YAxis stroke="#666668" tick={{ fill: '#B8B8B8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1A1C",
                  border: "1px solid #2A2A2C",
                  color: "#E5E5E5"
                }}
                formatter={(value: number) =>
                  new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                  }).format(value)
                }
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="actualSpend" name="Actual Spend">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getSpendBarColor(entry.actualSpend, entry.targetSpend)} />
                ))}
              </Bar>
              <Line 
                dataKey="targetSpend" 
                stroke="transparent"
                strokeWidth={0}
                dot={{ fill: '#B8B8B8', r: 5, strokeWidth: 2, stroke: '#2A2A2C' }}
                name="Target Spend" 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
