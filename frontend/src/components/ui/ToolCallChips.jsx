import React, { useState } from 'react';

/**
 * ToolCallChips component displays agent tool calls as colored chips
 * similar to how AI models show their analysis steps or sources
 */
const ToolCallChips = ({ tool_calls }) => {
  const [expandedChip, setExpandedChip] = useState(null);

  if (!tool_calls || tool_calls.length === 0) {
    return null;
  }

  // Get a color based on the tool name
  const getToolColor = (toolName) => {
    const colors = {
      'analyze_all_users_with_user': 'bg-blue-100 text-blue-800 border-blue-300',
      'find_messages_with_technique_with_user': 'bg-purple-100 text-purple-800 border-purple-300',
      'default': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    
    return colors[toolName] || colors.default;
  };

  const toggleChip = (index) => {
    if (expandedChip === index) {
      setExpandedChip(null);
    } else {
      setExpandedChip(index);
    }
  };

  return (
    <div className="tool-chips flex flex-wrap gap-2 mt-2 mb-3">
      {tool_calls.map((tool, index) => (
        <div key={tool.id || index} className="tool-chip-container">
          <div 
            className={`tool-chip cursor-pointer px-3 py-1 rounded-full border text-xs font-medium ${getToolColor(tool.name)}`}
            onClick={() => toggleChip(index)}
          >
            {tool.name}
          </div>
          
          {expandedChip === index && (
            <div className="tool-details mt-2 p-3 bg-gray-50 rounded-md border border-gray-200 text-xs max-w-lg overflow-auto">
              <div className="mb-2">
                <span className="font-semibold">Parameters:</span> 
                <pre className="whitespace-pre-wrap">{tool.args}</pre>
              </div>
              {tool.result && (
                <div className="result">
                  <span className="font-semibold">Result:</span>
                  <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
                    {typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ToolCallChips;
