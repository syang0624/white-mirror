// lib/api/statistics.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Base API instance with common config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Statistics API methods for manipulative message analysis
 */
export const statisticsApi = {
  /**
   * Get manipulation statistics for all users who have messaged the current user
   * 
   * @param {string} userId - Current user's ID
   * @param {number} maxUsers - Maximum number of users to return (default: 10)
   * @param {number} maxTechniques - Maximum number of techniques to include (default: 5)
   * @param {number} maxVulnerabilities - Maximum number of vulnerabilities to include (default: 5)
   * @returns {Promise<object>} - Statistics for all manipulative users
   * 
   * @example Response:
   * {
   *   "code": 0,
   *   "success": true,
   *   "message": "Statistics retrieved successfully",
   *   "response": {
   *     "statistics": [
   *       {
   *         "person_id": "249f0de2-390a-4549-a9f2-ddd2916fdfc9",
   *         "person_name": "Test User 8b6vkm",
   *         "total_messages": 10,
   *         "manipulative_count": 6,
   *         "manipulative_percentage": 0.6,
   *         "techniques": [
   *           {
   *             "name": "Persuasion or Seduction",
   *             "count": 2,
   *             "percentage": 0.3333333333333333
   *           },
   *           {
   *             "name": "Playing Servant Role",
   *             "count": 2,
   *             "percentage": 0.3333333333333333
   *           },
   *           {
   *             "name": "Playing Victim Role",
   *             "count": 2,
   *             "percentage": 0.3333333333333333
   *           },
   *           {
   *             "name": "Rationalization",
   *             "count": 2,
   *             "percentage": 0.3333333333333333
   *           }
   *         ],
   *         "vulnerabilities": [
   *           {
   *             "name": "Dependency",
   *             "count": 6,
   *             "percentage": 1.0
   *           },
   *           {
   *             "name": "Naivete",
   *             "count": 4,
   *             "percentage": 0.6666666666666666
   *           },
   *           {
   *             "name": "...
   *           }
   *         ]
   *       }
   *     ]
   *   }
   * }
   */
  getAllStatistics: async (userId, maxUsers = 10, maxTechniques = 5, maxVulnerabilities = 5) => {
    try {
      const response = await api.post('/statistics/all_statistics', {
        user_id: userId,
        max_users: maxUsers,
        max_techniques: maxTechniques,
        max_vulnerabilities: maxVulnerabilities
      });
      return response.data;
    } catch (error) {
      console.error('Error getting all statistics:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get manipulation statistics for a specific user who has messaged the current user
   * 
   * @param {string} userId - Current user's ID
   * @param {string} selectedUserId - ID of the user to analyze
   * @param {number} maxTechniques - Maximum number of techniques to include (default: 5)
   * @param {number} maxVulnerabilities - Maximum number of vulnerabilities to include (default: 5)
   * @returns {Promise<object>} - Statistics for the selected user
   * 
   * @example Response:
   * {
   *   "code": 0,
   *   "success": true,
   *   "message": "Statistics retrieved successfully",
   *   "response": {
   *     "person_id": "249f0de2-390a-4549-a9f2-ddd2916fdfc9",
   *     "person_name": "Test User 8b6vkm",
   *     "total_messages": 10,
   *     "manipulative_count": 6,
   *     "manipulative_percentage": 0.6,
   *     "techniques": [
   *       {
   *         "name": "Persuasion or Seduction",
   *         "count": 2,
   *         "percentage": 0.3333333333333333
   *       },
   *       {
   *         "name": "Playing Servant Role",
   *         "count": 2,
   *         "percentage": 0.3333333333333333
   *       },
   *       {
   *         "name": "Playing Victim Role",
   *         "count": 2,
   *         "percentage": 0.3333333333333333
   *       },
   *       {
   *         "name": "Rationalization",
   *         "count": 2,
   *         "percentage": 0.3333333333333333
   *       }
   *     ],
   *     "vulnerabilities": [
   *       {
   *         "name": "Dependency",
   *         "count": 6,
   *         "percentage": 1.0
   *       },
   *       {
   *         "name": "Naivete",
   *         "count": 4,
   *         "percentage": 0.6666666666666666
   *       }
   *     ]
   *   }
   * }
   */
  getSingleStatistics: async (userId, selectedUserId, maxTechniques = 5, maxVulnerabilities = 5) => {
    try {
      const response = await api.post('/statistics/single_statistics', {
        user_id: userId,
        selected_user_id: selectedUserId,
        max_techniques: maxTechniques,
        max_vulnerabilities: maxVulnerabilities
      });
      return response.data;
    } catch (error) {
      console.error('Error getting single user statistics:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get messages with a specific manipulation technique from a selected user
   * 
   * @param {string} userId - Current user's ID
   * @param {string} technique - The manipulation technique to filter by
   * @param {string} selectedUserId - Optional ID of a specific sender
   * @param {number} limit - Maximum number of messages to return (default: 10)
   * @returns {Promise<object>} - Messages with the specified technique
   * 
   * @example Response:
   * {
   *   "code": 0,
   *   "success": true,
   *   "message": "Messages retrieved successfully",
   *   "response": {
   *     "technique": "Persuasion or Seduction",
   *     "messages": [
   *       {
   *         "message_id": "524f45f4-2521-421c-884c-0a37b88a9655",
   *         "content": "If you don't do this for me right now, I'll make sure you regret it.",
   *         "timestamp": "2025-04-12T14:54:44.407329",
   *         "techniques": [
   *           "Persuasion or Seduction"
   *         ],
   *         "vulnerabilities": [
   *           "Dependency"
   *         ]
   *       },
   *       {
   *         "message_id": "67f4078d-5aa8-4a86-a5fe-f5b20e25b083",
   *         "content": "If you don't do this for me right now, I'll make sure you regret it.",
   *         "timestamp": "2025-04-12T11:44:25.915891",
   *         "techniques": [
   *           "Persuasion or Seduction"
   *         ],
   *         "vulnerabilities": [
   *           "Dependency"
   *         ]
   *       }
   *     ]
   *   }
   * }
   */
  getMessagesByTechnique: async (userId, technique, selectedUserId = null, limit = 10) => {
    try {
      const requestData = {
        user_id: userId,
        technique: technique,
        limit: limit
      };

      if (selectedUserId) {
        requestData.selected_user_id = selectedUserId;
      }

      const response = await api.post('/statistics/messages_by_technique', requestData);
      return response.data;
    } catch (error) {
      console.error('Error getting messages by technique:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get messages targeting a specific vulnerability from a selected user
   * 
   * @param {string} userId - Current user's ID
   * @param {string} vulnerability - The vulnerability to filter by
   * @param {string} selectedUserId - Optional ID of a specific sender
   * @param {number} limit - Maximum number of messages to return (default: 10)
   * @returns {Promise<object>} - Messages targeting the specified vulnerability
   * 
   * @example Response:
   * {
   *   "code": 0,
   *   "success": true,
   *   "message": "Messages retrieved successfully",
   *   "response": {
   *     "vulnerability": "Dependency",
   *     "messages":  [
   *       {
   *         "message_id": "1ce7412d-8510-4e20-af90-6d4c2716d46e",
   *         "content": "I know what's best for you, just trust me and do what I say.",
   *         "timestamp": "2025-04-12T14:54:47.464535",
   *         "techniques": [
   *           "Playing Servant Role",
   *           "Playing Victim Role",
   *           "Rationalization"
   *         ],
   *         "vulnerabilities": [
   *           "Dependency",
   *           "Naivete"
   *         ]
   *       },
   *       {
   *         "message_id": "dff50cc4-9252-47ed-bbf7-d4246ac4440c",
   *         "content": "I really need your help with this - I'm desperate and don't know who else to turn to.",
   *         "timestamp": "2025-04-12T14:54:46.447879",
   *         "techniques": null,
   *         "vulnerabilities": [
   *           "Dependency",
   *           "Naivete"
   *         ]
   *       },
   *       {
   *         "message_id": "524f45f4-2521-421c-884c-0a37b88a9655",
   *         "content": "If you don't do this for me right now, I'll make sure you regret it.",
   *         "timestamp": "2025-04-12T14:54:44.407329",
   *         "techniques": [
   *           "Persuasion or Seduction"
   *         ],
   *         "vulnerabilities": [
   *           "Dependency"
   *         ]
   *       },
   *       {
   *         "message_id": "7ca58c22-7e47-427d-a652-0760a5e5a3ee",
   *         "content": "I know what's best for you, just trust me and do what I say.",
   *         "timestamp": "2025-04-12T11:44:28.983921",
   *         "techniques": [
   *           "Playing Servant Role",
   *           "Playing Victim Role",
   *           "Rationalization"
   *         ],
   *         "vulnerabilities": [
   *           "Dependency",
   *           "Naivete"
   *         ]
   *       },
   *       {
   *         "message_id": "b9a01474-0b7c-4bd6-9c79-cae061eedd45",
   *         "content": "I really need your help with this - I'm desperate and don't know who else to turn to.",
   *         "timestamp": "2025-04-12T11:44:27.959468",
   *         "techniques": null,
   *         "vulnerabilities": [
   *           "Dependency",
   *           "Naivete"
   *         ]
   *       },
   *       {
   *         "message_id": "67f4078d-5aa8-4a86-a5fe-f5b20e25b083",
   *         "content": "If you don't do this for me right now, I'll make sure you regret it.",
   *         "timestamp": "2025-04-12T11:44:25.915891",
   *         "techniques": [
   *           "Persuasion or Seduction"
   *         ],
   *         "vulnerabilities": [
   *           "Dependency"
   *         ]
   *       }
   *     ]
   *   }
   */
  getMessagesByVulnerability: async (userId, vulnerability, selectedUserId = null, limit = 10) => {
    try {
      const requestData = {
        user_id: userId,
        vulnerability: vulnerability,
        limit: limit
      };

      if (selectedUserId) {
        requestData.selected_user_id = selectedUserId;
      }

      const response = await api.post('/statistics/messages_by_vulnerability', requestData);
      return response.data;
    } catch (error) {
      console.error('Error getting messages by vulnerability:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Enum of manipulation techniques matching the backend
export const ManipulativeTechniques = {
  PERSUASION_OR_SEDUCTION: "Persuasion or Seduction",
  SHAMING_OR_BELITTLEMENT: "Shaming or Belittlement",
  RATIONALIZATION: "Rationalization",
  ACCUSATION: "Accusation",
  INTIMIDATION: "Intimidation",
  PLAYING_VICTIM_ROLE: "Playing Victim Role",
  PLAYING_SERVANT_ROLE: "Playing Servant Role",
  EVASION: "Evasion",
  BRANDISHING_ANGER: "Brandishing Anger",
  DENIAL: "Denial",
  FEIGNING_INNOCENCE: "Feigning Innocence"
};

// Enum of vulnerabilities matching the backend
export const Vulnerabilities = {
  DEPENDENCY: "Dependency",
  NAIVETE: "Naivete",
  LOW_SELF_ESTEEM: "Low self-esteem",
  OVER_RESPONSIBILITY: "Over-responsibility",
  OVER_INTELLECTUALIZATION: "Over-intellectualization"
};

export default statisticsApi;