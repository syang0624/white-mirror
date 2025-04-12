import { ChartPieIcon, ClockIcon } from "@heroicons/react/outline";

const DashboardTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center">
              <ChartPieIcon className="h-5 w-5 mr-2" />
              <span>Overview</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "timeline"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              <span>Timeline</span>
            </div>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default DashboardTabs;
