import { UsersIcon, ExclamationCircleIcon } from "@heroicons/react/outline";

const UserSelector = ({
  allUsers,
  selectedUserId,
  setSelectedUserId,
  aggregatedStats,
}) => {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-4">
      <div className="w-full sm:w-64">
        <label
          htmlFor="user-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select User
        </label>
        <select
          id="user-select"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="all">All Users</option>
          {allUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {aggregatedStats && (
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center space-x-2 text-gray-700">
            <UsersIcon className="h-5 w-5" />
            <span className="text-sm">
              Total Messages:{" "}
              <span className="font-semibold">
                {aggregatedStats.total_messages}
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-700">
            <ExclamationCircleIcon className="h-5 w-5" />
            <span className="text-sm">
              Manipulative Messages:{" "}
              <span className="font-semibold">
                {aggregatedStats.manipulative_count}
              </span>
              <span className="ml-1 text-xs text-gray-500">
                ({(aggregatedStats.manipulative_percentage * 100).toFixed(1)}
                %)
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
