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
    <div className="bg-white p-7 border" style={{ borderColor: '#DDDDDE' }}>
      <div className="mb-6">
        <h3 className="mb-2" style={{ color: '#53565A' }}>Monthly Spend Pacing Overview</h3>
        <p className="text-sm" style={{ color: '#75787B' }}>Tracking actual spend against forecast and target pacing</p>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#DDDDDE" strokeWidth={0.5} />
          <XAxis
            dataKey="day"
            stroke="#75787B"
            ticks={[1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29]}
            tick={{ fontSize: 11, fill: '#75787B' }}
            label={{ value: "Day of Month", position: "insideBottom", offset: -5, fontSize: 11, fill: '#75787B' }}
          />
          <YAxis
            stroke="#75787B"
            tick={{ fontSize: 11, fill: '#75787B' }}
            label={{ value: "Cumulative Spend ($)", angle: -90, position: "insideLeft", fontSize: 11, fill: '#75787B' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #DDDDDE",
              padding: '12px'
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
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="targetCumulative"
            stroke="#989A9C"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Target Pacing"
            dot={false}
          />
          <Line
            type="natural"
            dataKey="forecastCumulative"
            stroke="#1D5BEB"
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
