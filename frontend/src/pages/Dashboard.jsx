import React, { useState, useEffect, useMemo } from "react";
import { statisticsApi } from "../lib/statistics_api";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/outline";

// Import modular components
import UserSelector from "../components/dashboard/UserSelector";
import DashboardTabs from "../components/dashboard/DashboardTabs";
import OverviewPanel from "../components/dashboard/OverviewPanel";
import TimelinePanel from "../components/dashboard/TimelinePanel";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [statistics, setStatistics] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [timelineMessages, setTimelineMessages] = useState([]);

  // Load current user from localStorage
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      setCurrentUser(user);
      setCurrentUserId(user.user_id);
    }
  }, []);

  useEffect(() => {
    setCurrentUserId(currentUser?.user_id);
  }, [currentUser]);

  // Navigate back to chat
  const handleBackToChat = () => {
    navigate("/");
  };

  // Fetch all users data on component mount
  useEffect(() => {
    const fetchAllStatistics = async () => {
      if (!currentUserId) {
        console.warn("currentUserId is null. Skipping API call.");
        return;
      }

      try {
        setLoading(true);
        const response = await statisticsApi.getAllStatistics(currentUserId);
        if (response.success) {
          setAllUsers(
            response.response.statistics.map((stat) => ({
              id: stat.person_id,
              name: stat.person_name,
            }))
          );
          setStatistics(response.response);
        } else {
          setError(response.message || "Failed to fetch statistics");
        }
      } catch (err) {
        setError("Error fetching statistics. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStatistics();
  }, [currentUserId]);

  // Fetch specific user stats when selection changes
  useEffect(() => {
    const fetchUserStatistics = async () => {
      if (!currentUserId || selectedUserId === "all") {
        return;
      }

      try {
        setLoading(true);
        const response = await statisticsApi.getSingleStatistics(
          currentUserId,
          selectedUserId
        );
        if (response.success) {
          setStatistics({
            statistics: [response.response],
          });
        } else {
          setError(response.message || "Failed to fetch user statistics");
        }
      } catch (err) {
        setError("Error fetching user statistics. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStatistics();
  }, [selectedUserId, currentUserId]);

  // Load messages for timeline view
  useEffect(() => {
    const fetchTimelineMessages = async () => {
      if (!currentUserId || activeTab !== "timeline") return;

      try {
        setLoading(true);
        // Fetch messages by technique and vulnerability
        const techniquePromises = [
          "Persuasion or Seduction",
          "Playing Victim Role",
          "Rationalization",
          "Intimidation",
        ].map((technique) =>
          statisticsApi.getMessagesByTechnique(
            currentUserId,
            technique,
            selectedUserId !== "all" ? selectedUserId : null,
            20
          )
        );

        const vulnerabilityPromises = [
          "Dependency",
          "Naivete",
          "Low self-esteem",
        ].map((vulnerability) =>
          statisticsApi.getMessagesByVulnerability(
            currentUserId,
            vulnerability,
            selectedUserId !== "all" ? selectedUserId : null,
            20
          )
        );

        const results = await Promise.all([
          ...techniquePromises,
          ...vulnerabilityPromises,
        ]);

        // Extract and deduplicate messages
        const allMessages = results
          .flatMap((result) => (result.success ? result.response.messages : []))
          .filter(
            (message, index, self) =>
              index ===
              self.findIndex((m) => m.message_id === message.message_id)
          )
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setTimelineMessages(allMessages);
        if (allMessages.length > 0 && !selectedMessage) {
          setSelectedMessage(allMessages[0]);
        }
      } catch (error) {
        console.error("Error fetching timeline messages:", error);
        setError("Failed to load timeline messages");
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineMessages();
  }, [currentUserId, selectedUserId, activeTab]);

  // Format date for timeline display
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Process timeline data for charts
  const timelineData = useMemo(() => {
    if (!timelineMessages.length) return [];

    // Group messages by date
    const messagesByDate = timelineMessages.reduce((acc, message) => {
      const date = message.timestamp.split("T")[0];
      if (!acc[date]) {
        acc[date] = { date, count: 0, techniques: {} };
      }
      acc[date].count += 1;

      if (message.techniques) {
        message.techniques.forEach((technique) => {
          if (!acc[date].techniques[technique]) {
            acc[date].techniques[technique] = 0;
          }
          acc[date].techniques[technique] += 1;
        });
      }

      return acc;
    }, {});

    // Get unique techniques across all messages
    const uniqueTechniques = Array.from(
      new Set(timelineMessages.flatMap((message) => message.techniques || []))
    );

    // Prepare data for line chart
    return Object.values(messagesByDate)
      .map((day) => {
        const result = { date: day.date };
        uniqueTechniques.forEach((technique) => {
          result[technique] = day.techniques[technique] || 0;
        });
        return result;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [timelineMessages]);

  // Calculate aggregated statistics for "All Users" view
  const aggregatedStats = useMemo(() => {
    if (!statistics || !statistics.statistics) return null;

    // If viewing a single user, return their stats directly
    if (selectedUserId !== "all") {
      return statistics.statistics[0];
    }

    // For "All Users", aggregate the data
    const users = statistics.statistics;

    // Track total messages and manipulative counts
    const totalMessagesCount = users.reduce(
      (sum, user) => sum + user.total_messages,
      0
    );
    const totalManipulativeCount = users.reduce(
      (sum, user) => sum + user.manipulative_count,
      0
    );

    // Aggregate techniques
    const techniquesMap = {};
    users.forEach((user) => {
      user.techniques?.forEach((technique) => {
        if (!techniquesMap[technique.name]) {
          techniquesMap[technique.name] = { count: 0, name: technique.name };
        }
        techniquesMap[technique.name].count += technique.count;
      });
    });

    // Aggregate vulnerabilities
    const vulnerabilitiesMap = {};
    users.forEach((user) => {
      user.vulnerabilities?.forEach((vulnerability) => {
        if (!vulnerabilitiesMap[vulnerability.name]) {
          vulnerabilitiesMap[vulnerability.name] = {
            count: 0,
            name: vulnerability.name,
          };
        }
        vulnerabilitiesMap[vulnerability.name].count += vulnerability.count;
      });
    });

    // Calculate percentages
    const techniques = Object.values(techniquesMap)
      .map((t) => ({
        ...t,
        percentage: t.count / totalManipulativeCount,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const vulnerabilities = Object.values(vulnerabilitiesMap)
      .map((v) => ({
        ...v,
        percentage: v.count / totalManipulativeCount,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      total_messages: totalMessagesCount,
      manipulative_count: totalManipulativeCount,
      manipulative_percentage: totalManipulativeCount / totalMessagesCount,
      techniques,
      vulnerabilities,
    };
  }, [statistics, selectedUserId]);

  // Calculate color based on percentage
  const getColor = (percentage) => {
    if (percentage >= 0.7) return "bg-red-500";
    if (percentage >= 0.4) return "bg-orange-500";
    return "bg-blue-500";
  };

  if (loading && !aggregatedStats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Conversation Analysis Dashboard
            </h1>
            <p className="text-gray-600">
              Analyze manipulation techniques and vulnerability patterns in your
              conversations
            </p>
          </div>
          <button
            onClick={handleBackToChat}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Chat
          </button>
        </div>

        {/* User selection */}
        <UserSelector
          allUsers={allUsers}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          aggregatedStats={aggregatedStats}
        />

        {/* Tab Selection */}
        <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Stats Overview */}
        {aggregatedStats && activeTab === "overview" && (
          <OverviewPanel
            aggregatedStats={aggregatedStats}
            getColor={getColor}
          />
        )}

        {/* Timeline View */}
        {activeTab === "timeline" && (
          <TimelinePanel
            timelineData={timelineData}
            timelineMessages={timelineMessages}
            selectedMessage={selectedMessage}
            setSelectedMessage={setSelectedMessage}
            formatDate={formatDate}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
