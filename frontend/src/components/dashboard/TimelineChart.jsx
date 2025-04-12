import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const TimelineChart = ({ timelineData }) => {
  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">
          Manipulation Techniques By Hour
        </h2>
        <div className="h-[300px] flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">No data available for timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">
        Manipulation Techniques By Hour
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={timelineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="formattedTime"
            label={{
              value: "Date & Hour",
              position: "insideBottomRight",
              offset: -5,
            }}
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            label={{ value: "Count", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            labelFormatter={(label) => `Time: ${label}`}
            formatter={(value, name) => [`${value} messages`, name]}
          />
          <Legend verticalAlign="top" height={36} />
          {Object.keys(timelineData[0] || {})
            .filter(
              (key) =>
                key !== "time" && key !== "formattedTime" && key !== "dateObj"
            )
            .map((technique, index) => {
              // Use CSS variables for chart colors from theme
              const colorVar = `var(--chart-${(index % 5) + 1}, hsl(${
                (index * 60) % 360
              }, 70%, 50%))`;
              return (
                <Line
                  key={technique}
                  type="monotone"
                  dataKey={technique}
                  name={technique}
                  stroke={colorVar}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              );
            })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimelineChart;
