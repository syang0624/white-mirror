// lib/api/agent.js

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
 * Agent API methods for analyzing manipulative communication
 */
export const agentApi = {
  /**
   * Send a simple question to the agent to analyze manipulative patterns
   * 
   * @param {string} userId - Current user's ID
   * @param {string} message - The question or message to analyze
   * @returns {Promise<object>} - Response with analysis and tool calls
   * 
   * @example Response:
   * {
   *   "success": true,
   *   "message": "Chat response generated successfully",
   *   "text": "It appears you have been experiencing some pressure in your conversations, particularly from a user identified as \"Test User 8b6vkm.\" Here's a summary of the manipulative communication patterns detected:\n\n### Manipulative Techniques Used:\n1. **Persuasion or Seduction**:\n   - **Messages**:\n     - \"If you don't do this for me right now, I'll make sure you regret it.\" (Repeated on two occasions)\n   - This indicates a form of pressure, suggesting that there will be negative consequences if you do not comply.\n\n2. **Playing Victim Role**:\n   - **Messages**:\n     - \"I know what's best for you, just trust me and do what I say.\" (Repeated on two occasions)\n   - This can create a sense of obligation, as it positions the sender as someone who knows better and implies that not following their advice may lead to disappointment.\n\n3. **Rationalization**:\n   - **Messages**:\n     - Same as above, where it is justified that their guidance is in your best interest.\n   - This often reinforces the manipulative nature of their requests by trying to make you feel that their demands are reasonable.\n\n### Targeted Vulnerabilities:\n- **Dependency**: The messages suggest an attempt to make you feel dependent on the other person for guidance or approval.\n- **Naivete**: There is an implication that you may not fully understand what is best for you without their help.\n\n### Advice for Responding:\n1. **Set Boundaries**: Clearly communicate your limits. You can say something like, \"I appreciate your concern, but I need to make my own decisions.\"\n2. **Seek Clarification**: If the messages are vague or coercive, ask for specific reasons behind their requests. This can help you gauge their intentions better.\n3. **Reflect on Your Needs**: Make sure to prioritize your own feelings and well-being over their demands.\n4. **Consider Support**: If the pressure continues or escalates, talking to a trusted friend or professional might be beneficial.\n\nIt's important to recognize these patterns and ensure that your choices are respected. If you feel overwhelmed, seeking external support can also be a helpful step.",
   *   "tool_calls": [
   *     {
   *       "id": "call_u90MdeP3h951us37vWAreNUf",
   *       "name": "analyze_all_users_with_user",
   *       "args": "{}{\"technique\": \"Persuasion or Seduction\", \"selected_user_id\": \"249f0de2-390a-4549-a9f2-ddd2916fdfc9\"}",
   *       "result": "{\"user_count\": 1, \"users\": [{\"person_id\": \"249f0de2-390a-4549-a9f2-ddd2916fdfc9\", \"person_name\": \"Test User 8b6vkm\", \"total_messages\": 10, \"manipulative_count\": 6, \"manipulative_percentage\": 0.6, \"techniques\": [{\"name\": \"Persuasion or Seduction\", \"count\": 2, \"percentage\": 0.3333333333333333}, {\"name\": \"Playing Servant Role\", \"count\": 2, \"percentage\": 0.3333333333333333}, {\"name\": \"Playing Victim Role\", \"count\": 2, \"percentage\": 0.3333333333333333}, {\"name\": \"Rationalization\", \"count\": 2, \"percentage\": 0.3333333333333333}], \"vulnerabilities\": [{\"name\": \"Dependency\", \"count\": 6, \"percentage\": 1.0}, {\"name\": \"Naivete\", \"count\": 4, \"percentage\": 0.6666666666666666}]}]}"
   *     },
   *     {
   *       "id": "call_Wf5YdEbYNWWArdeqJvJ3R0So",
   *       "name": "find_messages_with_technique_with_user",
   *       "args": "{\"technique\": \"Playing Victim Role\", \"selected_user_id\": \"249f0de2-390a-4549-a9f2-ddd2916fdfc9\"}",
   *       "result": "{\"technique\": \"Playing Victim Role\", \"message_count\": 2, \"messages\": [{\"message_id\": \"1ce7412d-8510-4e20-af90-6d4c2716d46e\", \"content\": \"I know what's best for you, just trust me and do what I say.\", \"timestamp\": \"2025-04-12T14:54:47.464535\", \"techniques\": [\"Playing Servant Role\", \"Playing Victim Role\", \"Rationalization\"], \"vulnerabilities\": [\"Dependency\", \"Naivete\"]}, {\"message_id\": \"7ca58c22-7e47-427d-a652-0760a5e5a3ee\", \"content\": \"I know what's best for you, just trust me and do what I say.\", \"timestamp\": \"2025-04-12T11:44:28.983921\", \"techniques\": [\"Playing Servant Role\", \"Playing Victim Role\", \"Rationalization\"], \"vulnerabilities\": [\"Dependency\", \"Naivete\"]}]}",
   *     },
   *     {
   *       "id": "call_sPomp87f42iSRL5cfcn6dAoY",
   *       "name": "find_messages_with_technique_with_user",
   *       "args": "{\"technique\": \"Rationalization\", \"selected_user_id\": \"249f0de2-390a-4549-a9f2-ddd2916fdfc9\"}",
   *       "result": "{\"technique\": \"Rationalization\", \"message_count\": 2, \"messages\": [{\"message_id\": \"1ce7412d-8510-4e20-af90-6d4c2716d46e\", \"content\": \"I know what's best for you, just trust me and do what I say.\", \"timestamp\": \"2025-04-12T14:54:47.464535\", \"techniques\": [\"Playing Servant Role\", \"Playing Victim Role\", \"Rationalization\"], \"vulnerabilities\": [\"Dependency\", \"Naivete\"]}, {\"message_id\": \"7ca58c22-7e47-427d-a652-0760a5e5a3ee\", \"content\": \"I know what's best for you, just trust me and do what I say.\", \"timestamp\": \"2025-04-12T11:44:28.983921\", \"techniques\": [\"Playing Servant Role\", \"Playing Victim Role\", \"Rationalization\"], \"vulnerabilities\": [\"Dependency\", \"Naivete\"]}]}",
   *     }
   *   ]
   * }
   */
  simpleChat: async (userId, message) => {
    try {
      const response = await api.post('/agent/simple-chat', {
        user_id: userId,
        message: message
      });
      return response.data;
    } catch (error) {
      console.error('Error in simple chat:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get information about manipulative patterns for a specific person
   * 
   * @param {string} userId - Current user's ID
   * @param {string} contactId - ID of the contact to analyze
   * @param {string} contactName - Optional name of the contact for more natural query
   * @returns {Promise<object>} - Response with analysis of the specific person
   */
  
  analyzeContact: async (userId, contactId, contactName = null) => {
    const nameQuery = contactName ? `${contactName} (${contactId})` : contactId;
    try {
      const response = await api.post('/agent/simple-chat', {
        user_id: userId,
        message: `Is ${nameQuery} using manipulative techniques in our conversations?`
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing contact:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Check for guilt-tripping behavior in conversations
   * 
   * @param {string} userId - Current user's ID
   * @param {string} contactId - Optional ID of a specific contact to check
   * @returns {Promise<object>} - Response with analysis of guilt-tripping behavior
   */
  checkForGuiltTripping: async (userId, contactId = null) => {
    try {
      let message = "Has anyone been making me feel guilty recently?";
      if (contactId) {
        message = `Is contact ${contactId} trying to make me feel guilty?`;
      }
      
      const response = await api.post('/agent/simple-chat', {
        user_id: userId,
        message: message
      });
      return response.data;
    } catch (error) {
      console.error('Error checking for guilt-tripping:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Check for controlling behavior in conversations
   * 
   * @param {string} userId - Current user's ID
   * @param {string} contactId - Optional ID of a specific contact to check
   * @returns {Promise<object>} - Response with analysis of controlling behavior
   */
  checkForControllingBehavior: async (userId, contactId = null) => {
    try {
      let message = "Is someone trying to control me in our conversations?";
      if (contactId) {
        message = `Is contact ${contactId} trying to control or pressure me?`;
      }
      
      const response = await api.post('/agent/simple-chat', {
        user_id: userId,
        message: message
      });
      return response.data;
    } catch (error) {
      console.error('Error checking for controlling behavior:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Check for gaslighting or doubt-inducing behavior
   * 
   * @param {string} userId - Current user's ID
   * @returns {Promise<object>} - Response with analysis of gaslighting behavior
   */
  checkForGaslighting: async (userId) => {
    try {
      const response = await api.post('/agent/simple-chat', {
        user_id: userId,
        message: "Do any of my contacts try to make me doubt myself?"
      });
      return response.data;
    } catch (error) {
      console.error('Error checking for gaslighting:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get advice on how to respond to manipulative behavior
   * 
   * @param {string} userId - Current user's ID
   * @param {string} situation - Description of the manipulation situation
   * @returns {Promise<object>} - Response with advice
   */
  getAdvice: async (userId, situation) => {
    try {
      const response = await api.post('/agent/simple-chat', {
        user_id: userId,
        message: `How should I respond to someone who ${situation}?`
      });
      return response.data;
    } catch (error) {
      console.error('Error getting advice:', error.response?.data || error.message);
      throw error;
    }
  }
};

/**
 * Example usage of the agent API with real-world examples
 */
const exampleUsage = async () => {
  const userId = '0e2d25d3-ccee-4b84-9f97-172636348d5f';
  
  try {
    // Example 1: Check if anyone has been manipulating the user
    console.log("EXAMPLE 1: General manipulation check");
    const generalAnalysis = await agentApi.simpleChat(userId, 'Has anyone been manipulating me?');
    console.log('Analysis result:', generalAnalysis.text.substring(0, 150) + '...');
    
    // Example 2: Check for guilt-tripping behavior
    console.log("\nEXAMPLE 2: Checking for guilt-tripping");
    const guiltAnalysis = await agentApi.checkForGuiltTripping(userId);
    console.log('Guilt analysis:', guiltAnalysis.text.substring(0, 150) + '...');
    
    // Example 3: Check for controlling behavior from a specific contact
    console.log("\nEXAMPLE 3: Checking for controlling behavior from specific contact");
    const controlAnalysis = await agentApi.checkForControllingBehavior(
      userId, 
      '249f0de2-390a-4549-a9f2-ddd2916fdfc9'
    );
    console.log('Control analysis:', controlAnalysis.text.substring(0, 150) + '...');
    
    // Example 4: Check for gaslighting behavior
    console.log("\nEXAMPLE 4: Checking for gaslighting");
    const gaslightingAnalysis = await agentApi.checkForGaslighting(userId);
    console.log('Gaslighting analysis:', gaslightingAnalysis.text.substring(0, 150) + '...');
    
    // Example 5: Get advice for responding to emotional manipulation
    console.log("\nEXAMPLE 5: Getting advice for emotional manipulation");
    const adviceResult = await agentApi.getAdvice(
      userId,
      'tries to make me feel guilty whenever I don\'t do what they ask'
    );
    console.log('Advice:', adviceResult.text.substring(0, 150) + '...');
    
  } catch (error) {
    console.error('Error in example usage:', error);
  }
};

// Parse tool calls and extract useful information
export const parseToolCalls = (toolCalls) => {
  if (!toolCalls || !toolCalls.length) return null;
  
  try {
    // Find analyze_all_users tool call
    const analyzeCall = toolCalls.find(tc => 
      tc.name.includes('analyze_all_users_with_user')
    );
    
    if (analyzeCall && analyzeCall.result) {
      const result = JSON.parse(analyzeCall.result);
      
      if (result.users && result.users.length > 0) {
        return {
          manipulativeUsers: result.users.map(user => ({
            id: user.person_id,
            name: user.person_name,
            manipulativePercentage: user.manipulative_percentage * 100,
            manipulativeCount: user.manipulative_count,
            totalMessages: user.total_messages,
            techniques: user.techniques,
            vulnerabilities: user.vulnerabilities
          }))
        };
      }
    }
    
    // Find technique-specific tool calls
    const techniqueCall = toolCalls.find(tc => 
      tc.name.includes('find_messages_with_technique')
    );
    
    if (techniqueCall && techniqueCall.result) {
      const result = JSON.parse(techniqueCall.result);
      
      return {
        technique: result.technique,
        messageCount: result.message_count,
        examples: result.messages
      };
    }
  } catch (error) {
    console.error('Error parsing tool calls:', error);
  }
  
  return null;
};

// Available manipulative techniques matching backend definitions
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

// Available vulnerabilities matching backend definitions
export const Vulnerabilities = {
  DEPENDENCY: "Dependency",
  NAIVETE: "Naivete",
  LOW_SELF_ESTEEM: "Low self-esteem",
  OVER_RESPONSIBILITY: "Over-responsibility",
  OVER_INTELLECTUALIZATION: "Over-intellectualization"
};

export default agentApi;