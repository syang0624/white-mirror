import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { authApi } from "../lib/api";

function ChatPage() {
  const [selectedContact, setSelectedContact] = useState("ai-assistant");
  const [searchQuery, setSearchQuery] = useState("");

  const [contacts, setContacts] = useState([
    {
      id: "ai-assistant",
      name: "WhiteMirror AI",
      avatar: "/vite.svg",
      status: "online",
      lastMessage: "How can I help you today?",
      time: "10:00 AM",
    },
  ]);

  const [conversations, setConversations] = useState({});
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentMessages = conversations[selectedContact] || [];
  const currentContact = contacts.find(
    (contact) => contact.id === selectedContact
  );

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await authApi.getUsers();
        const userList = res.response.users;
        console.log(userList);
        const formattedContacts = userList.map((user) => ({
          id: user.user_id,
          name: user.user_name,
          avatar: "",
          status: "online",
          lastMessage: "",
          time: "",
        }));
        setContacts((prev) => [...prev, ...formattedContacts]);
      } catch {
        console.error("Error fetching users");
      }
    };
    fetchUsers();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: currentMessages.length + 1,
      content: input,
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setConversations((prev) => ({
      ...prev,
      [selectedContact]: [...prev[selectedContact], userMessage],
    }));

    setInput("");
    setIsLoading(true);

    if (selectedContact === "ai-assistant") {
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
      setIsLoading(false);
    }

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

export default ChatPage;
