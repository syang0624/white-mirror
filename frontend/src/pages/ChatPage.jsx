import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { authApi, chatApi, ChatWebSocket } from "../lib/api";

function ChatPage() {
  // State for the currently logged in user
  const [currentUser, setCurrentUser] = useState(null);

  // State for chat management
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState([]);

  // Store messages by user_id to maintain separate conversations
  const [conversationsMap, setConversationsMap] = useState({});
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // WebSocket connection
  const [chatWebSocket, setChatWebSocket] = useState(null);


  // debug useeffect
  useEffect(() => {
    console.log("convo map", conversationsMap);
  }, [conversationsMap]);

  // Load the current user from localStorage on component mount
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      setCurrentUser(user);
    }
  }, []);

  // Load contacts when current user is available
  useEffect(() => {
    if (currentUser) {
      fetchContacts();
    }
  }, [currentUser]);

  // Initialize WebSocket connection when current user is available
  useEffect(() => {
    if (currentUser && !chatWebSocket) {
      initializeWebSocket();
    }

    // Clean up WebSocket on unmount
    return () => {
      if (chatWebSocket) {
        chatWebSocket.disconnect();
      }
    };
  }, [currentUser]);

  // Load messages when a contact is selected
  useEffect(() => {
    if (selectedContact && currentUser) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact, currentUser]);

  // Function to fetch all contacts
  const fetchContacts = async () => {
    try {
      const result = await authApi.getUsers();
      if (result.success) {
        // Filter out the current user from the contacts list
        const filteredContacts = result.response.users
          .filter((user) => user.user_id !== currentUser.user_id)
          .map((user) => ({
            id: user.user_id,
            name: user.user_name,
            avatar: "",
            status: "online", // Default status
            lastMessage: "Click to start chatting",
            time: "",
            user_data: user,
          }));

        setContacts(filteredContacts);

        // Select the first contact if none is selected
        if (filteredContacts.length > 0 && !selectedContact) {
          setSelectedContact(filteredContacts[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    const chatWs = new ChatWebSocket(
      currentUser.user_id,
      (message) => {
        console.log("Received message:", message);
        // Handle incoming message
        const senderId = message.sender_id;

        // Create a new message object
        const newMessage = {
          id: message.id || Date.now().toString(),
          content: message.content,
          sender: "contact",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sender_id: senderId,
          sender_name: message.sender_name,
          is_manipulative: message.is_manipulative,
          techniques: message.techniques,
          vulnerabilities: message.vulnerabilities,
        };

        // Update the conversations map to store the message with the correct sender
        setConversationsMap((prevMap) => {
          // Get existing conversation or create a new array
          const existingConvo = prevMap[senderId] || [];
          return {
            ...prevMap,
            [senderId]: [...existingConvo, newMessage],
          };
        });

        // Update the last message in contacts list
        setContacts((prev) =>
          prev.map((contact) =>
            contact.id === senderId
              ? {
                  ...contact,
                  lastMessage: message.content,
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }
              : contact
          )
        );
      },
      (error) => {
        console.error("WebSocket error:", error);
      }
    );

    chatWs.connect();
    setChatWebSocket(chatWs);
  };

  // Fetch messages between current user and selected contact
  const fetchMessages = async (contactId) => {
    if (!currentUser || !contactId) return;

    setIsLoading(true);
    try {
      // Check if we already have messages loaded for this contact
      if (
        conversationsMap[contactId] &&
        conversationsMap[contactId].length > 0
      ) {
        // We already have messages for this contact, no need to fetch again
        setIsLoading(false);
        return;
      }

      const result = await chatApi.getMessages(currentUser.user_id, contactId);
      if (result.success) {
        // Transform messages to expected format
        const formattedMessages = result.response.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.is_sent_by_me ? "me" : "contact",
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sender_id: msg.sender_id,
          sender_name: msg.sender_name,
          is_manipulative: msg.is_manipulative,
          techniques: msg.techniques,
          vulnerabilities: msg.vulnerabilities,
        }));

        // Store messages in the map by contact ID
        setConversationsMap((prevMap) => {
          const updatedMap = {
            ...prevMap,
            [contactId]: formattedMessages,
          };
          console.log("Updated conversationsMap:", updatedMap); // Log the updated map
          return updatedMap;
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending a new message
  const handleSend = async () => {
    if (!input.trim() || !chatWebSocket || !selectedContact) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const contactId = selectedContact.id;

    // Create the message object
    const userMessage = {
      id: Date.now().toString(),
      content: input,
      sender: "me",
      timestamp: timestamp,
      sender_id: currentUser.user_id,
      sender_name: currentUser.user_name || currentUser.name,
    };

    // Add message to the specific conversation in the map
    setConversationsMap((prevMap) => {
      const existingConvo = prevMap[contactId] || [];
      return {
        ...prevMap,
        [contactId]: [...existingConvo, userMessage],
      };
    });

    setInput("");

    // Update the last message in contacts list
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId
          ? {
              ...contact,
              lastMessage: input,
              time: timestamp,
            }
          : contact
      )
    );

    // Send the message via WebSocket
    try {
      chatWebSocket.sendMessage(contactId, input);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle Enter key to send messages
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

  // Get messages for the selected contact
  const currentMessages = selectedContact
    ? conversationsMap[selectedContact.id] || []
    : [];

  return (
    <div className="h-screen flex">
      <Sidebar
        contacts={filteredContacts}
        selectedContact={selectedContact}
        setSelectedContact={setSelectedContact}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentUser={currentUser}
      />

      {selectedContact ? (
        <ChatArea
          currentContact={selectedContact}
          currentMessages={currentMessages}
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          handleKeyDown={handleKeyDown}
          isLoading={isLoading}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">
              Select a contact to start chatting
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
