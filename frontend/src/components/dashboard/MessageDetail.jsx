const MessageDetail = ({ selectedMessage, formatDate }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Message Details</h2>
      {selectedMessage ? (
        <>
          <p className="text-sm text-gray-500 mb-2">
            {formatDate(selectedMessage.timestamp)}
          </p>
          <p className="mb-4 p-3 bg-gray-50 border rounded">
            {selectedMessage.content}
          </p>

          <div className="mb-4">
            <h3 className="font-medium mb-1">Manipulation Techniques:</h3>
            <div className="flex flex-wrap gap-1">
              {selectedMessage.techniques &&
              selectedMessage.techniques.length > 0 ? (
                selectedMessage.techniques.map((technique) => (
                  <span
                    key={technique}
                    className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded"
                  >
                    {technique}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">None detected</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-1">Vulnerabilities Targeted:</h3>
            <div className="flex flex-wrap gap-1">
              {selectedMessage.vulnerabilities &&
              selectedMessage.vulnerabilities.length > 0 ? (
                selectedMessage.vulnerabilities.map((vulnerability) => (
                  <span
                    key={vulnerability}
                    className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
                  >
                    {vulnerability}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">None detected</span>
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-500">Select a message to view details</p>
      )}
    </div>
  );
};

export default MessageDetail;
