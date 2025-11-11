import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface DailyPacing {
  day: number;
  actualCumulative: number;
  forecastCumulative: number;
  targetCumulative: number;
}

interface SpendPacingChartProps {
  data: DailyPacing[];
}

export function SpendPacingChart({ data }: SpendPacingChartProps) {
  // Process data to stop actual line at day 18
  const processedData = data.map(item => ({
    ...item,
    actualCumulative: item.actualCumulative === 0 ? null : item.actualCumulative
  }));

  return (
    <div className="p-7 border" style={{ backgroundColor: '#1A1C20', borderColor: '#2A2C30' }}>
      <div className="mb-6">
        <h3 className="mb-2" style={{ color: '#E6EDF3' }}>Monthly Spend Pacing Overview</h3>
        <p className="text-sm" style={{ color: '#CCCCCC' }}>Tracking actual spend against forecast and target pacing</p>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2125" strokeWidth={0.5} />
          <XAxis
            dataKey="day"
            stroke="#666668"
            ticks={[1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29]}
            tick={{ fontSize: 11, fill: '#CCCCCC' }}
            label={{ value: "Day of Month", position: "insideBottom", offset: -5, fontSize: 11, fill: '#CCCCCC' }}
          />
          <YAxis
            stroke="#666668"
            tick={{ fontSize: 11, fill: '#CCCCCC' }}
            label={{ value: "Cumulative Spend ($)", angle: -90, position: "insideLeft", fontSize: 11, fill: '#CCCCCC' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#141619",
              border: "1px solid #2A2C30",
              padding: '12px',
              color: '#E6EDF3'
            }}
            formatter={(value: number) =>
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
              }).format(value)
            }
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px', color: '#CCCCCC' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="targetCumulative"
            stroke="#666668"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Target Pacing"
            dot={false}
          />
          <Line
            type="natural"
            dataKey="forecastCumulative"
            stroke="#60A5FA"
            strokeWidth={2}
            strokeDasharray="3 3"
            name="Forecast"
            dot={false}
          />
          <Line
            type="natural"
            dataKey="actualCumulative"
            stroke="#FF0067"
            strokeWidth={3}
            name="Actual Spend"
            dot={{ fill: "#FF0067", r: 3 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}