import { useState, useEffect, useRef } from "react";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import CommandSuggestions from "@/components/ui/chat/CommandSuggestions";
import { ManipulativeTechniques, Vulnerabilities } from "@/lib/statistics_api";

function ChatFooter({ 
  input, 
  setInput, 
  handleSend, 
  handleKeyDown, 
  isLoading,
  currentContact 
}) {
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [currentInputType, setCurrentInputType] = useState('command'); // 'command', 'technique', or 'vulnerability'
  const inputRef = useRef(null);
  const isStatsBot = currentContact?.id === 'statsbot';

  // Define all available commands
  const allCommands = [
    {
      name: 'help',
      description: 'Show all available commands',
      usage: 'help'
    },
    {
      name: 'all',
      description: 'Get statistics for all users who communicated with you',
      usage: 'all'
    },
    {
      name: 'user',
      description: 'Get statistics for a specific user',
      usage: 'user [user_id]'
    },
    {
      name: 'technique',
      description: 'Get messages using a specific manipulation technique',
      usage: 'technique [technique_name] [optional: user_name]',
      hasOptions: true,
      optionType: 'technique'
    },
    {
      name: 'vulnerability',
      description: 'Get messages targeting a specific vulnerability',
      usage: 'vulnerability [vulnerability_name] [optional: user_name]',
      hasOptions: true,
      optionType: 'vulnerability'
    }
  ];

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // Skip suggestions for non-StatsBot conversations
    if (!isStatsBot) {
      return;
    }
    
    if (value.startsWith('/')) {
      const parts = value.slice(1).split(' '); // Remove the '/' prefix and split by space
      const command = parts[0].toLowerCase();
      
      // New input with just '/' - show all commands
      if (value === '/') {
        setCurrentInputType('command');
        setFilteredCommands(allCommands);
        setShowCommandSuggestions(true);
        return;
      }
      
      // Filter commands if we're just typing the command name (no space yet)
      if (parts.length === 1) {
        setCurrentInputType('command');
        const filtered = allCommands.filter(cmd => 
          cmd.name.toLowerCase().startsWith(command.toLowerCase())
        );
        
        setFilteredCommands(filtered);
        setShowCommandSuggestions(filtered.length > 0);
        setActiveCommandIndex(0);
        return;
      }
      
      // Handle sub-suggestions for techniques and vulnerabilities
      const fullCommand = allCommands.find(cmd => cmd.name === command);
      if (fullCommand && fullCommand.hasOptions && parts.length >= 2) {
        // Get the partial parameter (what user is typing after the command)
        const partialParam = parts.length > 1 ? parts.slice(1).join(' ') : '';
        
        if (fullCommand.optionType === 'technique') {
          setCurrentInputType('technique');
          const techniques = Object.values(ManipulativeTechniques);
          const filteredTechniques = techniques
            .filter(tech => tech.toLowerCase().includes(partialParam.toLowerCase()))
            .map(tech => ({
              name: tech,
              description: `Manipulation technique: ${tech}`,
              isOption: true,
              forCommand: command
            }));
          
          setFilteredCommands(filteredTechniques);
          setShowCommandSuggestions(filteredTechniques.length > 0);
          setActiveCommandIndex(0);
        } 
        else if (fullCommand.optionType === 'vulnerability') {
          setCurrentInputType('vulnerability');
          const vulnerabilities = Object.values(Vulnerabilities);
          const filteredVulnerabilities = vulnerabilities
            .filter(vuln => vuln.toLowerCase().includes(partialParam.toLowerCase()))
            .map(vuln => ({
              name: vuln,
              description: `Vulnerability: ${vuln}`,
              isOption: true,
              forCommand: command
            }));
          
          setFilteredCommands(filteredVulnerabilities);
          setShowCommandSuggestions(filteredVulnerabilities.length > 0);
          setActiveCommandIndex(0);
        }
        return;
      }
    } else {
      setShowCommandSuggestions(false);
    }
  };

  const handleCustomKeyDown = (e) => {
    // Handle command selection with arrow keys and enter
    if (showCommandSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveCommandIndex((prevIndex) => 
          prevIndex < filteredCommands.length - 1 ? prevIndex + 1 : prevIndex
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveCommandIndex((prevIndex) => 
          prevIndex > 0 ? prevIndex - 1 : prevIndex
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        // Select the command on tab or enter
        e.preventDefault();
        if (filteredCommands.length > 0) {
          selectCommand(filteredCommands[activeCommandIndex]);
        }
        return;
      } else if (e.key === 'Escape') {
        // Close suggestions on escape
        e.preventDefault();
        setShowCommandSuggestions(false);
        return;
      }
    }

    // Pass the event to the original handler for other keys
    if (handleKeyDown) {
      handleKeyDown(e);
    }
  };

  const selectCommand = (command) => {
    if (command.isOption) {
      // Get current input and replace just the parameter part
      const currentParts = input.split(' ');
      const commandPart = currentParts[0]; // Keep the /command part
      
      // Replace with the selected option value
      setInput(`${commandPart} ${command.name} `);
    } else {
      // Regular command selection
      setInput(`/${command.name} `);
    }
    
    setShowCommandSuggestions(false);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowCommandSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <footer className="p-4 border-t border-gray-200">
      <div className="flex items-center space-x-2 relative" ref={inputRef}>
        <CommandSuggestions 
          isVisible={showCommandSuggestions}
          commands={filteredCommands}
          activeIndex={activeCommandIndex}
          onSelectCommand={selectCommand}
        />
        
        <ChatInput
          placeholder={isStatsBot ? "Type / to view available commands..." : "Type a message..."}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleCustomKeyDown}
        />
        
        <Button
          variant="default"
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </footer>
  );
}

export default ChatFooter;