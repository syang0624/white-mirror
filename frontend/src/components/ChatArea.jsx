import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
} from "@/components/ui/chat/chat-bubble";

import { ChatInput } from "@/components/ui/chat/chat-input";
import { Phone, Video, MoreVertical, SendHorizontal, AlertTriangle } from "lucide-react";

import ChatHeader from "./ChatHeader";
import { useEffect, useRef } from "react";

function ChatArea({
  currentContact,
  currentMessages,
  input,
  setInput,
  handleSend,
  handleKeyDown,
  isLoading,
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  return (
    <main className="flex-1 flex flex-col">
      <ChatHeader currentContact={currentContact} />
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="flex flex-col space-y-4">
          {currentMessages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 my-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}

          {currentMessages.map((message) => (
            <div key={message.id} className="flex flex-col">
              <ChatBubble
                variant={message.sender === "me" ? "sent" : "received"}
                className={`max-w-[60%]`}
              >
                <div className="flex flex-col">
                  <ChatBubbleMessage 
                    className={`${message.is_manipulative ? 'border-2 border-amber-400' : ''}`}
                    variant={message.sender === "me" ? "sent" : "received"}
                  >{message.content}

                  </ChatBubbleMessage>
                  <ChatBubbleTimestamp timestamp={message.timestamp} />
                </div>
              </ChatBubble>
              
              {message.is_manipulative && (
                <div className="mt-1 mb-2 py-2 px-3 max-w-[80%] ml-auto mr-auto bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p className="text-xs font-medium text-amber-700">Potentially manipulative message</p>
                  </div>
                  {message.techniques && message.techniques.length > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Techniques: {message.techniques.join(', ')}
                    </p>
                  )}
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

      {/* Chat input - Using our enhanced ChatFooter component */}
      <ChatFooter
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleKeyDown={handleKeyDown}
        isLoading={isLoading}
        currentContact={currentContact}
      />
    </main>
  );
}

export default ChatArea;