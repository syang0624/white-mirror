import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, MoreVertical } from "lucide-react";

const ChatHeader = ({ currentContact }) => {
  if (!currentContact) return null;

  return (
    <header className="p-4 border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center">
        <Avatar className="h-10 w-10">
          {currentContact.avatar ? (
            <AvatarImage
              src={currentContact.avatar}
              alt={currentContact.name}
            />
          ) : (
            <AvatarFallback>
              {currentContact.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="ml-3">
          <h2 className="font-medium">{currentContact.name}</h2>
          <p className="text-xs text-gray-500">
            {currentContact.status === "online" ? "Online" : "Offline"}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon">
          <Phone size={20} />
        </Button>
        <Button variant="ghost" size="icon">
          <Video size={20} />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical size={20} />
        </Button>
      </div>
    </header>
  );
}

export default ChatHeader;
