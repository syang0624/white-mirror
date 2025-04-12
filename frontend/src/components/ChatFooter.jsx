import { ChatInput } from "@/components/ui/chat/chat-input";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";

function ChatFooter({ input, setInput, handleSend, handleKeyDown, isLoading }) {
  return (
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
  );
}

export default ChatFooter;