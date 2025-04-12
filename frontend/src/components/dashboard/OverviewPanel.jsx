import { Transition } from "@headlessui/react";
import { ChartPieIcon, LockClosedIcon, ChartBarIcon } from "@heroicons/react/outline";
import { 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";

const OverviewPanel = ({ aggregatedStats, getColor }) => {
  // Prepare radar data for techniques and vulnerabilities
  const techniqueRadarData = aggregatedStats.techniques?.map(technique => ({
    subject: technique.name,
    A: technique.percentage * 100, // Convert to percentage for display
    fullMark: 100
  })) || [];

  const vulnerabilityRadarData = aggregatedStats.vulnerabilities?.map(vulnerability => ({
    subject: vulnerability.name,
    A: vulnerability.percentage * 100, // Convert to percentage for display
    fullMark: 100
  })) || [];

  // Prepare manipulation comparison data per person
  const manipulationData = 
    [
      {
        name: aggregatedStats.person_name || "Overall",
        manipulative: (aggregatedStats.manipulative_percentage || 0) * 100,
        nonManipulative: 100 - ((aggregatedStats.manipulative_percentage || 0) * 100)
      }
    ];

  return (
    <div className="space-y-8">
      {/* Radar Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Manipulation Techniques - Radar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <ChartPieIcon className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Manipulation Techniques
            </h2>
          </div>

          <div className="relative h-64">
            {aggregatedStats.techniques &&
            aggregatedStats.techniques.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={techniqueRadarData}>
                  <PolarGrid stroke="#e0e0e0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#666' }} />
                  <Radar
                    name="Techniques"
                    dataKey="A"
                    stroke="var(--chart-1, #0088FE)"
                    fill="var(--chart-1, #0088FE)"
                    fillOpacity={0.6}
                  />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No manipulation techniques detected
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {aggregatedStats.techniques &&
              aggregatedStats.techniques.map((technique) => (
                <div key={technique.name} className="flex items-center">
                  <div
                    className={`${getColor(
                      technique.percentage
                    )} w-3 h-3 rounded-full mr-2`}
                  ></div>
                  <span className="text-sm text-gray-700 truncate">
                    {technique.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({technique.count})
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Vulnerabilities - Radar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <LockClosedIcon className="h-6 w-6 text-orange-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Targeted Vulnerabilities
            </h2>
          </div>

          <div className="relative h-64">
            {aggregatedStats.vulnerabilities &&
            aggregatedStats.vulnerabilities.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={vulnerabilityRadarData}>
                  <PolarGrid stroke="#e0e0e0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#666' }} />
                  <Radar
                    name="Vulnerabilities"
                    dataKey="A"
                    stroke="var(--chart-2, #FF8042)"
                    fill="var(--chart-2, #FF8042)"
                    fillOpacity={0.6}
                  />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No vulnerabilities detected
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {aggregatedStats.vulnerabilities &&
              aggregatedStats.vulnerabilities.map((vulnerability) => (
                <div key={vulnerability.name} className="flex items-center">
                  <div
                    className={`${getColor(
                      vulnerability.percentage
                    )} w-3 h-3 rounded-full mr-2`}
                  ></div>
                  <span className="text-sm text-gray-700 truncate">
                    {vulnerability.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({vulnerability.count})
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Manipulation Percentage Comparison */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-6">
          <ChartBarIcon className="h-6 w-6 text-green-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">
            Manipulation Percentage
          </h2>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={manipulationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
            <Legend />
            <Bar dataKey="manipulative" name="Manipulative" fill="#ff6b6b" />
            <Bar dataKey="nonManipulative" name="Non-Manipulative" fill="#4ecdc4" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OverviewPanel;
