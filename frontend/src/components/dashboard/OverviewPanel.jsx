import { Transition } from "@headlessui/react";
import { ChartPieIcon, LockClosedIcon, ChartBarIcon, UserIcon } from "@heroicons/react/outline";
import { 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const OverviewPanel = ({
  aggregatedStats,
  getColor,
  allUserStats,
  isAllView,
}) => {
  // Prepare radar data for techniques and vulnerabilities
  const techniqueRadarData =
    aggregatedStats.techniques?.map((technique) => ({
      subject: technique.name,
      A: technique.percentage * 100, // Convert to percentage for display
      fullMark: 100,
    })) || [];

  const vulnerabilityRadarData =
    aggregatedStats.vulnerabilities?.map((vulnerability) => ({
      subject: vulnerability.name,
      A: vulnerability.percentage * 100, // Convert to percentage for display
      fullMark: 100,
    })) || [];

  // Prepare manipulation comparison data per person
  const manipulationData = [
    {
      name: aggregatedStats.person_name || "Overall",
      manipulative: (aggregatedStats.manipulative_percentage || 0) * 100,
      nonManipulative:
        100 - (aggregatedStats.manipulative_percentage || 0) * 100,
    },
  ];

  // Determine manipulation status based on percentage
  const getManipulationStatus = (percentage) => {
    if (percentage < 0.2)
      return { text: "Healthy", className: "text-green-700 bg-green-100" };
    if (percentage < 0.4)
      return { text: "Moderate", className: "text-yellow-700 bg-yellow-100" };
    if (percentage < 0.6)
      return { text: "Concerning", className: "text-orange-700 bg-orange-100" };
    return { text: "Severe", className: "text-red-700 bg-red-100" };
  };

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
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#666", fontSize: 11 }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#666" }} />
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
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#666", fontSize: 11 }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#666" }} />
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

      {/* User Manipulation Status Table - Only show when viewing all users */}
      {isAllView && allUserStats && allUserStats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center mb-6">
            <UserIcon className="h-6 w-6 text-purple-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Relationship Status
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total Messages
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Manipulative
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Percentage
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allUserStats.map((user) => {
                  const status = getManipulationStatus(
                    user.manipulative_percentage
                  );
                  return (
                    <tr key={user.person_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.person_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.total_messages}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.manipulative_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(user.manipulative_percentage * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}
                        >
                          {status.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manipulation Percentage Comparison */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-6">
          <ChartPieIcon className="h-6 w-6 text-green-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">
            Manipulation Percentage
          </h2>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: "Manipulative", value: (aggregatedStats.manipulative_percentage || 0) * 100 },
                { name: "Non-Manipulative", value: 100 - ((aggregatedStats.manipulative_percentage || 0) * 100) }
              ]}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
              labelLine={false}
            >
              <Cell fill="#ff6b6b" />
              <Cell fill="#4ecdc4" />
            </Pie>
            <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OverviewPanel;
