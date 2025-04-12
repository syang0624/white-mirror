import { useState } from "react";

import "./App.css";

import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";

function App() {
  const [selectedContact, setSelectedContact] = useState("ai-assistant");
  const [searchQuery, setSearchQuery] = useState("");

  // Will fetch from BE
  const [contacts, setContacts] = useState([
    {
      id: "ai-assistant",
      name: "WhiteMirror AI",
      avatar: "/vite.svg",
      status: "online",
      lastMessage: "How can I help you today?",
      time: "10:00 AM",
    },
    {
      id: "john-doe",
      name: "John Doe",
      avatar: "",
      status: "offline",
      lastMessage: "See you tomorrow!",
      time: "Yesterday",
    },
    {
      id: "jane-smith",
      name: "Jane Smith",
      avatar: "",
      status: "online",
      lastMessage: "That sounds great!",
      time: "11:30 AM",
    },
  ]);

  // Will fetch from BE
  const [conversations, setConversations] = useState({
    "ai-assistant": [
      {
        id: 1,
        content: "Hello! How can I help you today?",
        sender: "contact",
        timestamp: "10:00 AM",
      },
    ],
    "john-doe": [
      {
        id: 1,
        content: "Hey, how are you?",
        sender: "me",
        timestamp: "9:30 AM",
      },
      {
        id: 2,
        content: "I'm good, thanks! How about you?",
        sender: "contact",
        timestamp: "9:32 AM",
      },
      {
        id: 3,
        content: "See you tomorrow!",
        sender: "contact",
        timestamp: "9:35 AM",
      },
    ],
    "jane-smith": [
      {
        id: 1,
        content: "Would you like to join us for dinner?",
        sender: "me",
        timestamp: "11:20 AM",
      },
      {
        id: 2,
        content: "That sounds great!",
        sender: "contact",
        timestamp: "11:30 AM",
      },
    ],
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get current conversation messages
  const currentMessages = conversations[selectedContact] || [];
  // Get selected contact info
  const currentContact = contacts.find(
    (contact) => contact.id === selectedContact
  );

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: currentMessages.length + 1,
      content: input,
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Update conversations with new message
    setConversations((prev) => ({
      ...prev,
      [selectedContact]: [...prev[selectedContact], userMessage],
    }));

    setInput("");
    setIsLoading(true);

    // Only generate AI response for the AI assistant contact
    if (selectedContact === "ai-assistant") {
      // Simulate AI response (this would connect to your backend in a real app)
      setTimeout(() => {
        const aiMessage = {
          id: currentMessages.length + 2,
          content:
            "This is a simulated response. In a real app, this would come from your backend service.",
          sender: "contact",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setConversations((prev) => ({
          ...prev,
          [selectedContact]: [...prev[selectedContact], aiMessage],
        }));
        setIsLoading(false);
      }, 1500);
    } else {
      // For regular contacts, no auto-response
      setIsLoading(false);
    }

    // Update last message and time in contacts list
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === selectedContact
          ? {
              ...contact,
              lastMessage: input,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : contact
      )
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex">
      <Sidebar
        contacts={filteredContacts}
        selectedContact={selectedContact}
        setSelectedContact={setSelectedContact}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <ChatArea
        currentContact={currentContact}
        currentMessages={currentMessages}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleKeyDown={handleKeyDown}
        isLoading={isLoading}
      />
    </div>
  );
}

export default App;
