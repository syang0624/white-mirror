// import { useState } from "react";
import {
    MessageSquare,
    SendHorizontal,
    Settings,
    Search,
    Phone,
    Video,
    MoreVertical,
    User,
} from "lucide-react";
import "./App.css";
import Auth from "./pages/Auth";

import { ChatInput } from "./components/ui/chat/chat-input";
import {
    ChatBubble,
    ChatBubbleMessage,
    ChatBubbleTimestamp,
} from "./components/ui/chat/chat-bubble";
import { Button } from "./components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";

function App() {
    // const [selectedContact, setSelectedContact] = useState("ai-assistant");
    // const [searchQuery, setSearchQuery] = useState("");
    // const [contacts, setContacts] = useState([
    //     {
    //         id: "ai-assistant",
    //         name: "WhiteMirror AI",
    //         avatar: "/vite.svg",
    //         status: "online",
    //         lastMessage: "How can I help you today?",
    //         time: "10:00 AM",
    //     },
    //     {
    //         id: "john-doe",
    //         name: "John Doe",
    //         avatar: "",
    //         status: "offline",
    //         lastMessage: "See you tomorrow!",
    //         time: "Yesterday",
    //     },
    //     {
    //         id: "jane-smith",
    //         name: "Jane Smith",
    //         avatar: "",
    //         status: "online",
    //         lastMessage: "That sounds great!",
    //         time: "11:30 AM",
    //     },
    // ]);

    // const [conversations, setConversations] = useState({
    //     "ai-assistant": [
    //         {
    //             id: 1,
    //             content: "Hello! How can I help you today?",
    //             sender: "contact",
    //             timestamp: "10:00 AM",
    //         },
    //     ],
    //     "john-doe": [
    //         {
    //             id: 1,
    //             content: "Hey, how are you?",
    //             sender: "me",
    //             timestamp: "9:30 AM",
    //         },
    //         {
    //             id: 2,
    //             content: "I'm good, thanks! How about you?",
    //             sender: "contact",
    //             timestamp: "9:32 AM",
    //         },
    //         {
    //             id: 3,
    //             content: "See you tomorrow!",
    //             sender: "contact",
    //             timestamp: "9:35 AM",
    //         },
    //     ],
    //     "jane-smith": [
    //         {
    //             id: 1,
    //             content: "Would you like to join us for dinner?",
    //             sender: "me",
    //             timestamp: "11:20 AM",
    //         },
    //         {
    //             id: 2,
    //             content: "That sounds great!",
    //             sender: "contact",
    //             timestamp: "11:30 AM",
    //         },
    //     ],
    // });

    // const [input, setInput] = useState("");
    // const [isLoading, setIsLoading] = useState(false);

    // // Get current conversation messages
    // const currentMessages = conversations[selectedContact] || [];
    // // Get selected contact info
    // const currentContact = contacts.find(
    //     (contact) => contact.id === selectedContact
    // );

    // const handleSend = async () => {
    //     if (!input.trim()) return;

    //     // Add user message to chat
    //     const userMessage = {
    //         id: currentMessages.length + 1,
    //         content: input,
    //         sender: "me",
    //         timestamp: new Date().toLocaleTimeString([], {
    //             hour: "2-digit",
    //             minute: "2-digit",
    //         }),
    //     };

    //     // Update conversations with new message
    //     setConversations((prev) => ({
    //         ...prev,
    //         [selectedContact]: [...prev[selectedContact], userMessage],
    //     }));

    //     setInput("");
    //     setIsLoading(true);

    //     // Only generate AI response for the AI assistant contact
    //     if (selectedContact === "ai-assistant") {
    //         // Simulate AI response (this would connect to your backend in a real app)
    //         setTimeout(() => {
    //             const aiMessage = {
    //                 id: currentMessages.length + 2,
    //                 content:
    //                     "This is a simulated response. In a real app, this would come from your backend service.",
    //                 sender: "contact",
    //                 timestamp: new Date().toLocaleTimeString([], {
    //                     hour: "2-digit",
    //                     minute: "2-digit",
    //                 }),
    //             };
    //             setConversations((prev) => ({
    //                 ...prev,
    //                 [selectedContact]: [...prev[selectedContact], aiMessage],
    //             }));
    //             setIsLoading(false);
    //         }, 1500);
    //     } else {
    //         // For regular contacts, no auto-response
    //         setIsLoading(false);
    //     }

    //     // Update last message and time in contacts list
    //     setContacts((prev) =>
    //         prev.map((contact) =>
    //             contact.id === selectedContact
    //                 ? {
    //                       ...contact,
    //                       lastMessage: input,
    //                       time: new Date().toLocaleTimeString([], {
    //                           hour: "2-digit",
    //                           minute: "2-digit",
    //                       }),
    //                   }
    //                 : contact
    //         )
    //     );
    // };

    // const handleKeyDown = (e) => {
    //     if (e.key === "Enter" && !e.shiftKey) {
    //         e.preventDefault();
    //         handleSend();
    //     }
    // };

    // // Filter contacts based on search query
    // const filteredContacts = contacts.filter((contact) =>
    //     contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    // );

    return (
        // <div className="h-screen flex">
        //     {/* Sidebar with contacts */}
        //     <aside className="w-1/4 border-r border-gray-200 bg-gray-50 flex flex-col">
        //         <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        //             <h1 className="font-bold text-xl">Messages</h1>
        //             <Button variant="ghost" size="icon">
        //                 <Settings size={20} />
        //             </Button>
        //         </div>

        //         {/* Search */}
        //         <div className="p-4">
        //             <div className="relative">
        //                 <Search
        //                     className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        //                     size={18}
        //                 />
        //                 <input
        //                     type="text"
        //                     placeholder="Search contacts"
        //                     className="w-full bg-white rounded-full pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-blue-500"
        //                     value={searchQuery}
        //                     onChange={(e) => setSearchQuery(e.target.value)}
        //                 />
        //             </div>
        //         </div>

        //         {/* Contact list */}
        //         <div className="flex-1 overflow-y-auto">
        //             {filteredContacts.map((contact) => (
        //                 <div
        //                     key={contact.id}
        //                     className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 ${
        //                         selectedContact === contact.id
        //                             ? "bg-blue-50"
        //                             : ""
        //                     }`}
        //                     onClick={() => setSelectedContact(contact.id)}
        //                 >
        //                     <div className="relative">
        //                         <Avatar className="h-12 w-12">
        //                             {contact.avatar ? (
        //                                 <AvatarImage
        //                                     src={contact.avatar}
        //                                     alt={contact.name}
        //                                 />
        //                             ) : (
        //                                 <AvatarFallback>
        //                                     {contact.name
        //                                         .split(" ")
        //                                         .map((n) => n[0])
        //                                         .join("")}
        //                                 </AvatarFallback>
        //                             )}
        //                         </Avatar>
        //                         <span
        //                             className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
        //                                 contact.status === "online"
        //                                     ? "bg-green-500"
        //                                     : "bg-gray-400"
        //                             }`}
        //                         />
        //                     </div>

        //                     <div className="ml-3 flex-1">
        //                         <div className="flex justify-between">
        //                             <p className="font-medium">
        //                                 {contact.name}
        //                             </p>
        //                             <span className="text-xs text-gray-500">
        //                                 {contact.time}
        //                             </span>
        //                         </div>
        //                         <p className="text-sm text-gray-500 truncate">
        //                             {contact.lastMessage}
        //                         </p>
        //                     </div>
        //                 </div>
        //             ))}
        //         </div>

        //         {/* User profile */}
        //         <div className="p-4 border-t border-gray-200 flex items-center">
        //             <Avatar className="h-10 w-10">
        //                 <AvatarFallback>
        //                     <User size={20} />
        //                 </AvatarFallback>
        //             </Avatar>
        //             <div className="ml-3">
        //                 <p className="font-medium">You</p>
        //                 <p className="text-xs text-gray-500">Available</p>
        //             </div>
        //         </div>
        //     </aside>
        //     {/* Main chat area */}
        //     <main className="flex-1 flex flex-col">
        //         {/* Chat header */}
        //         {currentContact && (
        //             <header className="p-4 border-b border-gray-200 flex items-center justify-between">
        //                 <div className="flex items-center">
        //                     <Avatar className="h-10 w-10">
        //                         {currentContact.avatar ? (
        //                             <AvatarImage
        //                                 src={currentContact.avatar}
        //                                 alt={currentContact.name}
        //                             />
        //                         ) : (
        //                             <AvatarFallback>
        //                                 {currentContact.name
        //                                     .split(" ")
        //                                     .map((n) => n[0])
        //                                     .join("")}
        //                             </AvatarFallback>
        //                         )}
        //                     </Avatar>
        //                     <div className="ml-3">
        //                         <h2 className="font-medium">
        //                             {currentContact.name}
        //                         </h2>
        //                         <p className="text-xs text-gray-500">
        //                             {currentContact.status === "online"
        //                                 ? "Online"
        //                                 : "Offline"}
        //                         </p>
        //                     </div>
        //                 </div>
        //                 <div className="flex items-center space-x-2">
        //                     <Button variant="ghost" size="icon">
        //                         <Phone size={20} />
        //                     </Button>
        //                     <Button variant="ghost" size="icon">
        //                         <Video size={20} />
        //                     </Button>
        //                     <Button variant="ghost" size="icon">
        //                         <MoreVertical size={20} />
        //                     </Button>
        //                 </div>
        //             </header>
        //         )}

        //         {/* Chat messages */}
        //         <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        //             <div className="flex flex-col space-y-4">
        //                 {currentMessages.map((message) => (
        //                     <ChatBubble
        //                         key={message.id}
        //                         variant={
        //                             message.sender === "me"
        //                                 ? "sent"
        //                                 : "received"
        //                         }
        //                         className="max-w-[60%]"
        //                     >
        //                         <div className="flex flex-col">
        //                             <ChatBubbleMessage>
        //                                 {message.content}
        //                             </ChatBubbleMessage>
        //                             <ChatBubbleTimestamp
        //                                 timestamp={message.timestamp}
        //                             />
        //                         </div>
        //                     </ChatBubble>
        //                 ))}

        //                 {isLoading && (
        //                     <ChatBubble
        //                         variant="received"
        //                         className="max-w-[60%]"
        //                     >
        //                         <div className="flex flex-col">
        //                             <ChatBubbleMessage isLoading />
        //                         </div>
        //                     </ChatBubble>
        //                 )}
        //             </div>
        //         </div>

        //         {/* Chat input */}
        //         <footer className="p-4 border-t border-gray-200">
        //             <div className="flex items-center space-x-2">
        //                 <ChatInput
        //                     placeholder="Type a message..."
        //                     value={input}
        //                     onChange={(e) => setInput(e.target.value)}
        //                     onKeyDown={handleKeyDown}
        //                 />
        //                 <Button
        //                     variant="default"
        //                     size="icon"
        //                     onClick={handleSend}
        //                     disabled={!input.trim() || isLoading}
        //                 >
        //                     <SendHorizontal className="h-4 w-4" />
        //                 </Button>
        //             </div>
        //         </footer>
        //     </main>
        // </div>
        <>
            <Auth />
        </>
    );
}

export default App;
