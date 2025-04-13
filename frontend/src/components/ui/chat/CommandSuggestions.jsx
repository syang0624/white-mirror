import React from 'react';

const CommandSuggestions = ({ 
  isVisible,
  commands, 
  activeIndex, 
  onSelectCommand 
}) => {
  if (!isVisible || commands.length === 0) {
    return null;
  }

  // Check if we're showing options (techniques or vulnerabilities)
  const showingOptions = commands.length > 0 && commands[0].isOption;
  const headerText = showingOptions 
    ? `Available ${commands[0].forCommand === 'technique' ? 'techniques' : 'vulnerabilities'}`
    : 'Available commands';

  return (
    <div className="absolute bottom-full mb-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
      <div className="sticky top-0 bg-gray-100 px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">
        {headerText}
      </div>
      <ul className="py-1">
        {commands.map((command, index) => (
          <li 
            key={command.name}
            className={`px-3 py-2 flex items-start cursor-pointer hover:bg-gray-50 ${index === activeIndex ? 'bg-blue-50' : ''}`}
            onClick={() => onSelectCommand(command)}
          >
            {showingOptions ? (
              // Display for techniques or vulnerabilities
              <div className="flex flex-col w-full">
                <div className="font-medium text-blue-600">{command.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{command.description}</div>
              </div>
            ) : (
              // Display for regular commands
              <>
                <div className="flex-shrink-0 text-blue-500 font-mono mr-2">
                  /{command.name}
                </div>
                <div className="flex-1">
                  <div className="text-sm">{command.description}</div>
                  {command.usage && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      Usage: /{command.usage}
                    </div>
                  )}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommandSuggestions;