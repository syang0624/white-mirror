import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { Phone, Video, MoreVertical, SendHorizontal } from "lucide-react";

import ChatHeader from "./ChatHeader";

function ChatArea({
  currentContact,
  currentMessages,
  input,
  setInput,
  handleSend,
  handleKeyDown,
  isLoading,
}) {
  return (
    <main className="flex-1 flex flex-col">
      <ChatHeader currentContact={currentContact} />
      

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="flex flex-col space-y-4">
          {currentMessages.map((message) => {
            console.log("message", message.sender);
            return (
            
            <ChatBubble
              key={message.id}
              variant={message.sender === "me" ? "sent" : "received"}
              className="max-w-[60%]"
            >
              <div className="flex flex-col">
                <ChatBubbleMessage>{message.content}</ChatBubbleMessage>
                <ChatBubbleTimestamp timestamp={message.timestamp} />
              </div>
            </ChatBubble>
          )})}

          {isLoading && (
            <ChatBubble variant="received" className="max-w-[60%]">
              <div className="flex flex-col">
                <ChatBubbleMessage isLoading />
              </div>
            </ChatBubble>
          )}
        </div>
      </div>

      {/* Chat input */}
      <footer className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <ChatInput
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
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
    </main>
  );
}

export default ChatArea;
