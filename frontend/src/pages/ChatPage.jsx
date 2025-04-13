import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { authApi, chatApi, ChatWebSocket } from "../lib/api";
import {
  statisticsApi,
  ManipulativeTechniques,
  Vulnerabilities,
} from "../lib/statistics_api";
import { agentApi } from "../lib/agent_api";

function ChatPage() {
  const navigate = useNavigate();

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

  // StatsBot
  const [statsBot] = useState({
    id: "statsbot",
    name: "StatsBot",
    status: "online",
    lastMessage: "Type /help to get started",
    time: "Now",
    isBot: true,
  });

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

      // Initialize StatsBot conversation if it doesn't exist
      setConversationsMap((prevMap) => {
        if (!prevMap["statsbot"]) {
          return {
            ...prevMap,
            statsbot: [
              {
                id: "welcome-msg",
                content:
                  "Hello! I can help you fetch statistics. Try typing one of these commands:\n\n" +
                  "/all - Get statistics for all users\n" +
                  "/user [user_id] - Get statistics for a specific user\n" +
                  "/technique [technique_name] - Get messages using a specific technique\n" +
                  "/vulnerability [vulnerability_name] - Get messages targeting a specific vulnerability\n" +
                  "/help - Show available commands",
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                sender: "statsbot",
              },
            ],
          };
        }
        return prevMap;
      });
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
      if (selectedContact.id !== "statsbot") {
        fetchMessages(selectedContact.id);
      }
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

        // Add StatsBot to the beginning of the contacts list
        setContacts([statsBot, ...filteredContacts]);

        // Select the first contact if none is selected
        if (!selectedContact) {
          setSelectedContact(statsBot);
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

  // Format statistics data into a readable message
  const formatStatistics = (stats) => {
    if (!stats) return "No statistics available";

    let message = `**User**: ${stats.person_name}\n`;
    message += `**Total Messages**: ${stats.total_messages}\n`;
    message += `**Manipulative Messages**: ${stats.manipulative_count} (${(
      stats.manipulative_percentage * 100
    ).toFixed(1)}%)\n\n`;

    if (stats.techniques && stats.techniques.length > 0) {
      message += "**Top Techniques**:\n";
      stats.techniques.forEach((tech) => {
        message += `• ${tech.name}: ${tech.count} (${(
          tech.percentage * 100
        ).toFixed(1)}%)\n`;
      });
      message += "\n";
    }

    if (stats.vulnerabilities && stats.vulnerabilities.length > 0) {
      message += "**Top Vulnerabilities**:\n";
      stats.vulnerabilities.forEach((vuln) => {
        message += `• ${vuln.name}: ${vuln.count} (${(
          vuln.percentage * 100
        ).toFixed(1)}%)\n`;
      });
    }

    return message;
  };

  // Format messages data into a readable format
  const formatMessages = (data, type) => {
    if (!data || !data.messages || data.messages.length === 0) {
      return `No messages found with this ${type}`;
    }

    let message = `**${type}**: ${data[type]}\n\n`;
    message += `**Found ${data.messages.length} messages:**\n\n`;

    data.messages.forEach((msg, index) => {
      const date = new Date(msg.timestamp).toLocaleString();
      message += `**Message ${index + 1} (${date}):**\n`;
      message += `${msg.content}\n`;

      if (msg.techniques && msg.techniques.length > 0) {
        message += `_Techniques: ${msg.techniques.join(", ")}_\n`;
      }

      if (msg.vulnerabilities && msg.vulnerabilities.length > 0) {
        message += `_Vulnerabilities: ${msg.vulnerabilities.join(", ")}_\n`;
      }

      message += "\n";
    });

    return message;
  };

  // Process commands for StatsBot
  const processStatsBotCommand = async (command) => {
    setIsLoading(true);

    try {
      const parts = command.split(" ");
      const cmd = parts[0].toLowerCase();

      // Add the user message to the conversation
      const userMessage = {
        id: Date.now().toString(),
        content: command,
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setConversationsMap((prevMap) => {
        const existingConvo = prevMap["statsbot"] || [];
        return {
          ...prevMap,
          statsbot: [...existingConvo, userMessage],
        };
      });

      let responseContent = "";

      if (!currentUser) {
        responseContent =
          "Error: You need to be logged in to use the StatsBot.";
      } else {
        switch (cmd) {
          case "/help":
            responseContent =
              "Here are the available commands:\n\n" +
              "/all - Get statistics for all users who communicated with you\n" +
              "/user [user_id] - Get statistics for a specific user\n" +
              "/technique [technique_name] - Get messages using a specific technique\n" +
              "/vulnerability [vulnerability_name] - Get messages targeting a specific vulnerability\n\n" +
              "Available techniques: " +
              Object.values(ManipulativeTechniques).join(", ") +
              "\n\n" +
              "Available vulnerabilities: " +
              Object.values(Vulnerabilities).join(", ");
            break;

          case "/all": {
            const allStats = await statisticsApi.getAllStatistics(
              currentUser.user_id
            );
            if (
              allStats.success &&
              allStats.response &&
              allStats.response.statistics
            ) {
              if (allStats.response.statistics.length === 0) {
                responseContent =
                  "No manipulative statistics found. This is good news!";
              } else {
                responseContent = `**Statistics for all users communicating with you:**\n\n`;
                allStats.response.statistics.forEach((userStat, index) => {
                  responseContent += `### User ${index + 1}: ${
                    userStat.person_name
                  }\n`;
                  responseContent += `**Manipulative Messages**: ${
                    userStat.manipulative_count
                  } (${(userStat.manipulative_percentage * 100).toFixed(
                    1
                  )}%)\n`;

                  if (userStat.techniques && userStat.techniques.length > 0) {
                    responseContent += "**Top Techniques**:\n";
                    userStat.techniques.forEach((tech) => {
                      responseContent += `• ${tech.name}: ${tech.count} (${(
                        tech.percentage * 100
                      ).toFixed(1)}%)\n`;
                    });
                  }

                  if (
                    userStat.vulnerabilities &&
                    userStat.vulnerabilities.length > 0
                  ) {
                    responseContent += "**Top Vulnerabilities**:\n";
                    userStat.vulnerabilities.forEach((vuln) => {
                      responseContent += `• ${vuln.name}: ${vuln.count} (${(
                        vuln.percentage * 100
                      ).toFixed(1)}%)\n`;
                    });
                  }

                  responseContent += "\n";
                });
              }
            } else {
              responseContent = `Error retrieving statistics: ${
                allStats.message || "Unknown error"
              }`;
            }
            break;
          }

          case "/user":
            if (parts.length < 2) {
              responseContent =
                "Please provide a user ID. Usage: /user [user_id]";
            } else {
              const userId = parts[1];
              try {
                const userStats = await statisticsApi.getSingleStatistics(
                  currentUser.user_id,
                  userId
                );
                if (userStats.success && userStats.response) {
                  responseContent = formatStatistics(userStats.response);
                } else {
                  responseContent = `Error retrieving user statistics: ${
                    userStats.message || "User not found or no messages exist"
                  }`;
                }
              } catch (error) {
                responseContent = `Error: ${
                  error.message || "Could not fetch user statistics"
                }`;
              }
            }
            break;

          case "/technique":
            if (parts.length < 2) {
              responseContent =
                "Please provide a technique name. Usage: /technique [technique_name]\n\n" +
                "Available techniques: " +
                Object.values(ManipulativeTechniques).join(", ");
            } else {
              // Extract technique name - need to handle multi-word techniques
              const techniqueParts = [];
              let userNameIndex = -1;

              // Find which part starts the username by checking if each part is a technique
              for (let i = 1; i < parts.length; i++) {
                const possibleTechnique = techniqueParts
                  .concat(parts[i])
                  .join(" ");
                const nextPossibleTechnique = techniqueParts
                  .concat(parts[i])
                  .concat(parts[i + 1] || "")
                  .join(" ");

                // If adding the next word no longer matches any technique, we've found the end
                if (
                  !Object.values(ManipulativeTechniques).some((t) =>
                    t
                      .toLowerCase()
                      .includes(nextPossibleTechnique.toLowerCase())
                  ) &&
                  Object.values(ManipulativeTechniques).some((t) =>
                    t.toLowerCase().includes(possibleTechnique.toLowerCase())
                  )
                ) {
                  userNameIndex = i + 1;
                  techniqueParts.push(parts[i]);
                  break;
                }

                techniqueParts.push(parts[i]);

                // If we've found an exact match for a technique, stop here
                if (
                  Object.values(ManipulativeTechniques).includes(
                    possibleTechnique
                  )
                ) {
                  userNameIndex = i + 1;
                  break;
                }
              }

              const techniqueName = techniqueParts.join(" ");

              // Check if the technique exists
              const exactTechniqueMatch = Object.values(
                ManipulativeTechniques
              ).find((t) => t.toLowerCase() === techniqueName.toLowerCase());

              if (!exactTechniqueMatch) {
                responseContent =
                  `Technique "${techniqueName}" not found.\n\nAvailable techniques: ` +
                  Object.values(ManipulativeTechniques).join(", ");
              } else {
                try {
                  let selectedUserId = null;

                  // If there are parts remaining after the technique name, they're the username
                  if (userNameIndex > 0 && userNameIndex < parts.length) {
                    const userName = parts.slice(userNameIndex).join(" ");

                    // Try to find the contact by name
                    const matchingContact = contacts.find((contact) =>
                      contact.name
                        .toLowerCase()
                        .includes(userName.toLowerCase())
                    );

                    if (matchingContact) {
                      selectedUserId = matchingContact.id;
                    } else {
                      // If userName looks like a UUID, use it directly
                      const uuidPattern =
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                      if (uuidPattern.test(userName)) {
                        selectedUserId = userName;
                      } else {
                        responseContent = `Could not find a user named "${userName}". Please try again with a valid username.`;
                        throw new Error(`User not found: ${userName}`);
                      }
                    }
                  }
                  // Note: If no username is provided (selectedUserId remains null),
                  // the API will return messages with this technique from all users

                  const messages = await statisticsApi.getMessagesByTechnique(
                    currentUser.user_id,
                    exactTechniqueMatch, // Use the exact match from the enum
                    selectedUserId
                  );

                  if (messages.success && messages.response) {
                    // Add clarity to the response about which users are included
                    const userScope = selectedUserId
                      ? `from user "${
                          contacts.find((c) => c.id === selectedUserId)?.name ||
                          "Selected user"
                        }"`
                      : "from all users";
                    responseContent =
                      `Finding messages with technique "${exactTechniqueMatch}" ${userScope}:\n\n` +
                      formatMessages(messages.response, "technique");
                  } else {
                    responseContent = `Error retrieving messages: ${
                      messages.message || "No messages found"
                    }`;
                  }
                } catch (error) {
                  responseContent = `Error: ${
                    error.message || "Could not fetch messages by technique"
                  }`;
                }
              }
            }
            break;

          case "/vulnerability":
            if (parts.length < 2) {
              responseContent =
                "Please provide a vulnerability name. Usage: /vulnerability [vulnerability_name]\n\n" +
                "Available vulnerabilities: " +
                Object.values(Vulnerabilities).join(", ");
            } else {
              // Extract vulnerability name - need to handle multi-word vulnerabilities
              const vulnerabilityParts = [];
              let userNameIndex = -1;

              // Find which part starts the username by checking if each part is a vulnerability
              for (let i = 1; i < parts.length; i++) {
                const possibleVulnerability = vulnerabilityParts
                  .concat(parts[i])
                  .join(" ");
                const nextPossibleVulnerability = vulnerabilityParts
                  .concat(parts[i])
                  .concat(parts[i + 1] || "")
                  .join(" ");

                // If adding the next word no longer matches any vulnerability, we've found the end
                if (
                  !Object.values(Vulnerabilities).some((v) =>
                    v
                      .toLowerCase()
                      .includes(nextPossibleVulnerability.toLowerCase())
                  ) &&
                  Object.values(Vulnerabilities).some((v) =>
                    v
                      .toLowerCase()
                      .includes(possibleVulnerability.toLowerCase())
                  )
                ) {
                  userNameIndex = i + 1;
                  vulnerabilityParts.push(parts[i]);
                  break;
                }

                vulnerabilityParts.push(parts[i]);

                // If we've found an exact match for a vulnerability, stop here
                if (
                  Object.values(Vulnerabilities).includes(possibleVulnerability)
                ) {
                  userNameIndex = i + 1;
                  break;
                }
              }

              const vulnerabilityName = vulnerabilityParts.join(" ");

              // Check if the vulnerability exists
              const exactVulnerabilityMatch = Object.values(
                Vulnerabilities
              ).find(
                (v) => v.toLowerCase() === vulnerabilityName.toLowerCase()
              );

              if (!exactVulnerabilityMatch) {
                responseContent =
                  `Vulnerability "${vulnerabilityName}" not found.\n\nAvailable vulnerabilities: ` +
                  Object.values(Vulnerabilities).join(", ");
              } else {
                try {
                  let selectedUserId = null;

                  // If there are parts remaining after the vulnerability name, they're the username
                  if (userNameIndex > 0 && userNameIndex < parts.length) {
                    const userName = parts.slice(userNameIndex).join(" ");

                    // Try to find the contact by name
                    const matchingContact = contacts.find((contact) =>
                      contact.name
                        .toLowerCase()
                        .includes(userName.toLowerCase())
                    );

                    if (matchingContact) {
                      selectedUserId = matchingContact.id;
                    } else {
                      // If userName looks like a UUID, use it directly
                      const uuidPattern =
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                      if (uuidPattern.test(userName)) {
                        selectedUserId = userName;
                      } else {
                        responseContent = `Could not find a user named "${userName}". Please try again with a valid username.`;
                        throw new Error(`User not found: ${userName}`);
                      }
                    }
                  }

                  const messages =
                    await statisticsApi.getMessagesByVulnerability(
                      currentUser.user_id,
                      exactVulnerabilityMatch, // Use the exact match from the enum
                      selectedUserId
                    );

                  if (messages.success && messages.response) {
                    // Add clarity to the response about which users are included
                    const userScope = selectedUserId
                      ? `from user "${
                          contacts.find((c) => c.id === selectedUserId)?.name ||
                          "Selected user"
                        }"`
                      : "from all users";
                    responseContent =
                      `Finding messages targeting vulnerability "${exactVulnerabilityMatch}" ${userScope}:\n\n` +
                      formatMessages(messages.response, "vulnerability");
                  } else {
                    responseContent = `Error retrieving messages: ${
                      messages.message || "No messages found"
                    }`;
                  }
                } catch (error) {
                  responseContent = `Error: ${
                    error.message || "Could not fetch messages by vulnerability"
                  }`;
                }
              }
            }
            break;

          default:
            responseContent =
              "Unknown command. Type /help for available commands.";
            break;
        }
      }

      // Add bot response to conversation
      const botResponse = {
        id: Date.now().toString() + "-response",
        content: responseContent,
        sender: "statsbot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setConversationsMap((prevMap) => {
        const existingConvo = prevMap["statsbot"] || [];
        return {
          ...prevMap,
          statsbot: [...existingConvo, botResponse],
        };
      });

      // Update StatsBot's last message in contacts
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === "statsbot"
            ? {
                ...contact,
                lastMessage: `${cmd} command processed`,
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : contact
        )
      );
    } catch (error) {
      console.error("Error processing StatsBot command:", error);

      // Add error message to conversation
      const errorMessage = {
        id: Date.now().toString() + "-error",
        content: `Error processing command: ${
          error.message || "Unknown error"
        }`,
        sender: "statsbot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setConversationsMap((prevMap) => {
        const existingConvo = prevMap["statsbot"] || [];
        return {
          ...prevMap,
          statsbot: [...existingConvo, errorMessage],
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending a new message
  const handleSend = async () => {
    if (!input.trim() || !selectedContact) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const contactId = selectedContact.id;

    // Special handling for StatsBot
    if (contactId === "statsbot") {
      if (input.startsWith("/")) {
        await processStatsBotCommand(input);
      } else {
        // For non-command messages to StatsBot
        const userMessage = {
          id: Date.now().toString(),
          content: input,
          sender: "me",
          timestamp: timestamp,
        };

        // Add user message to the conversation
        setConversationsMap((prevMap) => {
          const existingConvo = prevMap[contactId] || [];
          return {
            ...prevMap,
            [contactId]: [...existingConvo, userMessage],
          };
        });

        try {
          // Call the simpleChat API
          setInput("");
          const response = await agentApi.simpleChat(
            currentUser.user_id,
            input
          );

          console.log(response);
          const cleanedResponse = response.text
            .replace(/\r\n/g, "\n") // Normalize line endings
            .replace(/\n{3,}/g, "\n\n") // Limit to max 2 newlines in a row
            .replace(/[ \t]+\n/g, "\n") // Remove trailing spaces before newline
            .trim();

          // Add bot response to conversation
          const botResponse = {
            id: Date.now().toString() + "-response",
            content: cleanedResponse || "No response received from the server.",
            sender: "statsbot",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            tool_calls: response.tool_calls || [],
          };

          console.log("Bot response:", botResponse);

          setConversationsMap((prevMap) => {
            const existingConvo = prevMap[contactId] || [];
            return {
              ...prevMap,
              [contactId]: [...existingConvo, botResponse],
            };
          });
        } catch (error) {
          console.error("Error calling simpleChat API:", error);

          // Add error message to conversation
          const errorMessage = {
            id: Date.now().toString() + "-error",
            content: `Error: ${
              error.message || "Failed to process your message."
            }`,
            sender: "statsbot",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };

          setConversationsMap((prevMap) => {
            const existingConvo = prevMap[contactId] || [];
            return {
              ...prevMap,
              [contactId]: [...existingConvo, errorMessage],
            };
          });
        }
      }

      return;
    }

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

  const handleDashboardClick = () => {
    console.log("Dashboard button clicked");
    navigate("/dashboard");
  };

  return (
    <div className="h-screen flex">
      <Sidebar
        contacts={filteredContacts}
        selectedContact={selectedContact}
        setSelectedContact={setSelectedContact}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentUser={currentUser}
        onDashboardClick={handleDashboardClick}
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
