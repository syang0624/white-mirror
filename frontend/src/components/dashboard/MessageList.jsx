const MessageList = ({
  timelineMessages,
  selectedMessage,
  setSelectedMessage,
  formatDate,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
      <h2 className="text-lg font-semibold mb-4">Manipulative Messages</h2>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {timelineMessages.length > 0 ? (
          timelineMessages.map((message) => (
            <div
              key={message.message_id}
              onClick={() => setSelectedMessage(message)}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                selectedMessage?.message_id === message.message_id
                  ? "bg-blue-50 border-blue-300"
                  : "hover:bg-gray-50"
              }`}
            >
              <p className="text-sm text-gray-500">
                {formatDate(message.timestamp)}
              </p>
              <p className="truncate">{message.content}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {message.techniques &&
                  message.techniques.map((technique) => (
                    <span
                      key={technique}
                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded"
                    >
                      {technique}
                    </span>
                  ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">No messages found</p>
        )}
      </div>
    </div>
  );
};

export default MessageList;
