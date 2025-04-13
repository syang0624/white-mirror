import {
  ChatBubble,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
} from "@/components/ui/chat/chat-bubble";
import ToolCallChips from "@/components/ui/ToolCallChips";
import { useRef, useEffect } from "react";

function ChatMessages({ currentMessages, isLoading }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      <div className="flex flex-col space-y-4">
        {currentMessages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <ChatBubble
              variant={message.sender === "me" ? "sent" : "received"}
              className="max-w-[85%]"
            >
              <div className="flex flex-col">
                <ChatBubbleMessage>
                  {message.content}
                </ChatBubbleMessage>

                <ChatBubbleTimestamp timestamp={message.timestamp} />
              </div>
            </ChatBubble>
            
            {message.tool_calls && message.tool_calls.length > 0 && (
              <div className={`mt-1 ${message.sender === "me" ? "self-end" : "self-start"}`} style={{maxWidth: "85%"}}>
                <ToolCallChips tool_calls={message.tool_calls} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <ChatBubble variant="received" className="max-w-[60%]">
            <div className="flex flex-col">
              <ChatBubbleMessage isLoading />
            </div>
          </ChatBubble>
        )}
        
        {/* Empty div for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default ChatMessages;