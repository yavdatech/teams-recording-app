import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ZAxis,
  ReferenceLine,
  Label,
} from "recharts";

interface Account {
  accountName: string;
  clientType: string;
  actualSpend: number;
  actualROAS: number;
  deltaSpend: number;
  deltaROAS: number;
}

interface AccountPerformanceBubbleChartProps {
  accounts: Account[];
}

export function AccountPerformanceBubbleChart({
  accounts,
}: AccountPerformanceBubbleChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-4 border" style={{ backgroundColor: '#1A1A1C', borderColor: '#2A2A2C' }}>
          <p className="mb-3" style={{ color: '#E5E5E5' }}>{data.accountName}</p>
          <div className="space-y-2 text-sm">
            <p style={{ color: '#B8B8B8' }}>
              <span className="font-medium">Type:</span> {data.clientType}
            </p>
            <p style={{ color: '#B8B8B8' }}>
              <span className="font-medium">Spend:</span> {formatCurrency(data.actualSpend)}
            </p>
            <p style={{ color: '#B8B8B8' }}>
              <span className="font-medium">Δ Spend:</span>{" "}
              <span
                style={{
                  color: data.deltaSpend > 0 ? "#4ade80" : "#FF0067"
                }}
              >
                {formatPercent(data.deltaSpend)}
              </span>
            </p>
            <p style={{ color: '#B8B8B8' }}>
              <span className="font-medium">Δ ROAS:</span>{" "}
              <span
                style={{
                  color: data.deltaROAS > 0 ? "#4ade80" : "#FF0067"
                }}
              >
                {formatPercent(data.deltaROAS)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Determine bubble color based on quadrant using Lamark colors
  const getBubbleColor = (deltaSpend: number, deltaROAS: number) => {
    if (deltaSpend > 0 && deltaROAS > 0) return "#4ade80"; // Green - Good performance
    if (deltaSpend < 0 && deltaROAS > 0) return "#1D5BEB"; // Lamark Blue - Efficient
    if (deltaSpend > 0 && deltaROAS < 0) return "#FF0067"; // Lamark Pink - Concerning
    return "#4A7CEF"; // Light Blue - Reducing spend and ROAS
  };

  return (
    <div className="p-7 border" style={{ backgroundColor: '#1A1A1C', borderColor: '#2A2A2C' }}>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="mb-2" style={{ color: '#E5E5E5' }}>
              Account Performance Analysis
            </h3>
            <p className="text-sm" style={{ color: '#B8B8B8' }}>Quadrant analysis of spend and ROAS changes</p>
          </div>
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3" style={{ backgroundColor: '#4ade80' }}></div>
              <span style={{ color: '#B8B8B8' }}>Growing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3" style={{ backgroundColor: '#1D5BEB' }}></div>
              <span style={{ color: '#B8B8B8' }}>Efficient</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3" style={{ backgroundColor: '#FF0067' }}></div>
              <span style={{ color: '#B8B8B8' }}>At Risk</span>
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart
          margin={{ top: 10, right: 10, bottom: 40, left: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2C" strokeWidth={0.5} />
          <XAxis
            type="number"
            dataKey="deltaSpend"
            name="Δ Spend"
            stroke="#666668"
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 11, fill: '#B8B8B8' }}
          >
            <Label
              value="Δ Spend vs Prior Period (%)"
              position="bottom"
              offset={15}
              style={{ fill: "#B8B8B8", fontSize: 11 }}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="deltaROAS"
            name="Δ ROAS"
            stroke="#666668"
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 11, fill: '#B8B8B8' }}
          >
            <Label
              value="Δ ROAS vs Prior Period (%)"
              angle={-90}
              position="insideLeft"
              style={{ fill: "#B8B8B8", textAnchor: "middle", fontSize: 11 }}
            />
          </YAxis>
          <ZAxis
            type="number"
            dataKey="actualSpend"
            range={[100, 2000]}
            name="Spend"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
          <ReferenceLine x={0} stroke="#666668" strokeWidth={1} />
          <ReferenceLine y={0} stroke="#666668" strokeWidth={1} />
          <Scatter data={accounts} fill="#1D5BEB">
            {accounts.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBubbleColor(entry.deltaSpend, entry.deltaROAS)}
                fillOpacity={0.7}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
