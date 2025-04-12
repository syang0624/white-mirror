import axios from 'axios';

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User authentication endpoints
export const authApi = {
  // Register a new user
  signup: async (email, name, password) => {
    try {
      const response = await api.post('/auth/signup', {
        email,
        name,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get all users (for user discovery)
  getUsers: async () => {
    try {
      const response = await api.get('/auth/users');
      return response.data;
    } catch (error) {
      console.error('Get users error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user error:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Chat related endpoints
export const chatApi = {
  // Get message history between two users
  getMessages: async (userId, otherUserId, limit = 50) => {
    try {
      const response = await api.get(`/chat/messages`, {
        params: {
          user_id: userId,
          other_user_id: otherUserId,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get messages error:', error.response?.data || error.message);
      throw error;
    }
  }
};

// WebSocket connection management
export class ChatWebSocket {
  constructor(userId, onMessage, onError) {
    this.userId = userId;
    this.onMessage = onMessage;
    this.onError = onError;
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
  }

  // Connect to WebSocket
  connect() {
    if (this.socket) {
      this.disconnect();
    }

    const wsUrl = `${API_URL.replace('http', 'ws')}/chat/ws?user_id=${this.userId}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (this.onError) {
        this.onError(error);
      }
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;
      console.log('WebSocket disconnected:', event.code, event.reason);
      
      // Auto-reconnect logic
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    };
  }

  // Handle incoming messages
  handleMessage(data) {
    if (data.type === 'message') {
      // Handle incoming chat message
      if (this.onMessage) {
        this.onMessage(data);
      }
    } else if (data.type === 'error') {
      // Handle error messages
      console.error('WebSocket error from server:', data.message);
      if (this.onError) {
        this.onError(new Error(data.message));
      }
    } else if (data.type === 'receipt') {
      // Handle message delivery receipts
      console.log('Message delivery receipt:', data);
      // You could trigger a state update here to show delivered status
    }
  }

  // Send a message
  sendMessage(receiverId, content) {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    const message = {
      receiver_id: receiverId,
      content: content
    };

    this.socket.send(JSON.stringify(message));
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Check if connected
  isConnected() {
    return this.isConnected;
  }
}

// Table/database management endpoints (typically for admin use)
export const adminApi = {
  // Create tables
  createTables: async (tableName = '') => {
    try {
      const response = await api.post('/tables/create-table', {
        table_name: tableName
      });
      return response.data;
    } catch (error) {
      console.error('Create tables error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete tables
  deleteTables: async (tableName = '') => {
    try {
      const response = await api.post('/tables/delete-table', {
        table_name: tableName
      });
      return response.data;
    } catch (error) {
      console.error('Delete tables error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Check if tables exist
  checkTables: async () => {
    try {
      const response = await api.get('/tables/check-tables');
      return response.data;
    } catch (error) {
      console.error('Check tables error:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Example of how to use these in React components:
/*
// User authentication
import { authApi } from '../lib/api';

const handleSignup = async () => {
  try {
    const result = await authApi.signup(email, name, password);
    if (result.success) {
      // Store user data in context/state
      setUser(result.response);
      navigate('/dashboard');
    }
  } catch (error) {
    setError(error.response?.data?.message || 'Signup failed');
  }
};

// WebSocket chat
import { ChatWebSocket } from '../lib/api';

useEffect(() => {
  if (user) {
    // Create WebSocket connection
    const chatWs = new ChatWebSocket(
      user.user_id,
      (message) => {
        // Handle incoming message
        setMessages(prev => [...prev, message]);
      },
      (error) => {
        // Handle WebSocket error
        setError('Connection error: ' + error.message);
      }
    );
    
    // Connect to WebSocket
    chatWs.connect();
    
    // Store in state to use elsewhere
    setChatWebSocket(chatWs);
    
    // Clean up on unmount
    return () => {
      chatWs.disconnect();
    };
  }
}, [user]);

// Sending a message
const sendMessage = () => {
  if (chatWebSocket && chatWebSocket.isConnected) {
    chatWebSocket.sendMessage(selectedUser.user_id, messageText);
    setMessageText('');
  }
};

// Getting message history
import { chatApi } from '../lib/api';

const loadMessages = async () => {
  try {
    const result = await chatApi.getMessages(user.user_id, selectedUser.user_id);
    if (result.success) {
      setMessages(result.response.messages);
    }
  } catch (error) {
    setError('Failed to load messages');
  }
};
*/

export default {
  authApi,
  chatApi,
  ChatWebSocket,
  adminApi
};