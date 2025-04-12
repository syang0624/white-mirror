import { ChatBubble, ChatBubbleMessage, ChatBubbleTimestamp } from "@/components/ui/chat/chat-bubble";

function ChatMessages({ currentMessages, isLoading }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      <div className="flex flex-col space-y-4">
        {currentMessages.map((message) => (
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
        ))}

        {isLoading && (
          <ChatBubble variant="received" className="max-w-[60%]">
            <div className="flex flex-col">
              <ChatBubbleMessage isLoading />
            </div>
          </ChatBubble>
        )}
      </div>
    </div>
  );
}

export default ChatMessages;