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
          Manipulation Techniques Over Time
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
        Manipulation Techniques Over Time
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={timelineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            label={{ value: "Count", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Legend />
          {Object.keys(timelineData[0] || {})
            .filter((key) => key !== "date")
            .map((technique, index) => (
              <Line
                key={technique}
                type="monotone"
                dataKey={technique}
                stroke={`hsl(${
                  (index * 360) / Object.keys(timelineData[0] || {}).length
                }, 70%, 50%)`}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimelineChart;
