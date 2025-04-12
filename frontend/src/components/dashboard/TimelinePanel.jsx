import TimelineChart from "./TimelineChart";
import MessageList from "./MessageList";
import MessageDetail from "./MessageDetail";

const TimelinePanel = ({
  timelineData,
  timelineMessages,
  selectedMessage,
  setSelectedMessage,
  formatDate,
  loading,
}) => {
  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Message Timeline Analysis
      </h1>

      {timelineData.length > 0 ? (
        <>
          <TimelineChart timelineData={timelineData} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MessageList
              timelineMessages={timelineMessages}
              selectedMessage={selectedMessage}
              setSelectedMessage={setSelectedMessage}
              formatDate={formatDate}
            />

            <MessageDetail
              selectedMessage={selectedMessage}
              formatDate={formatDate}
            />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
          <div className="text-center p-6">
            <p className="text-xl text-gray-500 mb-2">
              No manipulative messages found
            </p>
            <p className="text-gray-400">
              {loading
                ? "Loading messages..."
                : "Try selecting a different user or returning to the overview tab"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePanel;
