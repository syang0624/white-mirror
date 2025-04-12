import React, { useState, useEffect, useMemo } from 'react';
import { statisticsApi } from '../lib/statistics_api';
import { Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { ChartPieIcon, UsersIcon, ExclamationCircleIcon, LockClosedIcon, ArrowLeftIcon } from '@heroicons/react/outline';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [statistics, setStatistics] = useState(null);
  
  // Add the handleBackToChat function here, not inside the useMemo hook
  const handleBackToChat = () => {
    navigate('/');
  };
  
  // Mock user ID - replace with actual auth context in production
  const currentUserId = "44e405c8-d06d-451a-b061-2e58a113c9d4"; // Replace with actual user ID from auth context
  
  // Fetch all users data on component mount
  useEffect(() => {
    const fetchAllStatistics = async () => {
      try {
        setLoading(true);
        const response = await statisticsApi.getAllStatistics(currentUserId);
        if (response.success) {
          setAllUsers(response.response.statistics.map(stat => ({
            id: stat.person_id,
            name: stat.person_name
          })));
          setStatistics(response.response);
        } else {
          setError(response.message || 'Failed to fetch statistics');
        }
      } catch (err) {
        setError('Error fetching statistics. Please try again later.');
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
      if (selectedUserId === 'all') {
        return; // All users data is already fetched
      }
      
      try {
        setLoading(true);
        const response = await statisticsApi.getSingleStatistics(currentUserId, selectedUserId);
        if (response.success) {
          setStatistics({
            statistics: [response.response]
          });
        } else {
          setError(response.message || 'Failed to fetch user statistics');
        }
      } catch (err) {
        setError('Error fetching user statistics. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedUserId !== 'all') {
      fetchUserStatistics();
    } else {
      // Reload all statistics when "All Users" is selected
      statisticsApi.getAllStatistics(currentUserId)
        .then(response => {
          if (response.success) {
            setStatistics(response.response);
            setLoading(false);
          }
        })
        .catch(err => {
          setError('Error fetching statistics. Please try again later.');
          console.error(err);
          setLoading(false);
        });
    }
  }, [selectedUserId, currentUserId]);

  // Calculate aggregated statistics for "All Users" view
  const aggregatedStats = useMemo(() => {
    if (!statistics || !statistics.statistics) return null;
    
    // If viewing a single user, return their stats directly
    if (selectedUserId !== 'all') {
      return statistics.statistics[0];
    }
    
    // For "All Users", aggregate the data
    const users = statistics.statistics;
    
    // Track total messages and manipulative counts
    const totalMessagesCount = users.reduce((sum, user) => sum + user.total_messages, 0);
    const totalManipulativeCount = users.reduce((sum, user) => sum + user.manipulative_count, 0);
    
    // Aggregate techniques
    const techniquesMap = {};
    users.forEach(user => {
      user.techniques?.forEach(technique => {
        if (!techniquesMap[technique.name]) {
          techniquesMap[technique.name] = { count: 0, name: technique.name };
        }
        techniquesMap[technique.name].count += technique.count;
      });
    });
    
    // Aggregate vulnerabilities
    const vulnerabilitiesMap = {};
    users.forEach(user => {
      user.vulnerabilities?.forEach(vulnerability => {
        if (!vulnerabilitiesMap[vulnerability.name]) {
          vulnerabilitiesMap[vulnerability.name] = { count: 0, name: vulnerability.name };
        }
        vulnerabilitiesMap[vulnerability.name].count += vulnerability.count;
      });
    });
    
    // Calculate percentages
    const techniques = Object.values(techniquesMap).map(t => ({
      ...t,
      percentage: t.count / totalManipulativeCount
    })).sort((a, b) => b.percentage - a.percentage);
    
    const vulnerabilities = Object.values(vulnerabilitiesMap).map(v => ({
      ...v,
      percentage: v.count / totalManipulativeCount
    })).sort((a, b) => b.percentage - a.percentage);
    
    return {
      total_messages: totalMessagesCount,
      manipulative_count: totalManipulativeCount,
      manipulative_percentage: totalManipulativeCount / totalMessagesCount,
      techniques,
      vulnerabilities
    };
  }, [statistics, selectedUserId]);

  // Calculate color based on percentage - this is correctly placed
  const getColor = (percentage) => {
    if (percentage >= 0.7) return 'bg-red-500';
    if (percentage >= 0.4) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Conversation Analysis Dashboard</h1>
            <p className="text-gray-600">
              Analyze manipulation techniques and vulnerability patterns in your conversations
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
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="w-full sm:w-64">
            <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select User
            </label>
            <select
              id="user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Users</option>
              {allUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          
          {aggregatedStats && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center space-x-2 text-gray-700">
                <UsersIcon className="h-5 w-5" />
                <span className="text-sm">
                  Total Messages: <span className="font-semibold">{aggregatedStats.total_messages}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <ExclamationCircleIcon className="h-5 w-5" />
                <span className="text-sm">
                  Manipulative Messages: <span className="font-semibold">{aggregatedStats.manipulative_count}</span>
                  <span className="ml-1 text-xs text-gray-500">
                    ({(aggregatedStats.manipulative_percentage * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Stats Overview */}
        {aggregatedStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Manipulation Techniques */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <ChartPieIcon className="h-6 w-6 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Manipulation Techniques</h2>
              </div>
              
              <div className="relative h-64">
                {aggregatedStats.techniques && aggregatedStats.techniques.length > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      {aggregatedStats.techniques.map((technique, index) => {
                        // Calculate size based on percentage (min 50px, max 140px)
                        const size = 50 + (technique.percentage * 90);
                        const color = getColor(technique.percentage);
                        
                        // Calculate position
                        const angle = (index / aggregatedStats.techniques.length) * 2 * Math.PI;
                        const radius = Math.min(250, window.innerWidth / 3.5);
                        const x = Math.cos(angle) * (radius / 3) + 50;
                        const y = Math.sin(angle) * (radius / 3) + 50;
                        
                        return (
                          <Transition
                            key={technique.name}
                            appear={true}
                            show={true}
                            enter="transition ease-out duration-500"
                            enterFrom="opacity-0 scale-50"
                            enterTo="opacity-100 scale-100"
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                            style={{ 
                              left: `${x}%`, 
                              top: `${y}%`, 
                              width: `${size}px`, 
                              height: `${size}px`,
                              zIndex: Math.round(technique.percentage * 10)
                            }}
                          >
                            <div className={`${color} rounded-full opacity-80 shadow-lg flex items-center justify-center`} style={{ width: '100%', height: '100%' }}>
                              <div className="text-white text-xs sm:text-sm font-medium text-center p-1">
                                <div className="truncate max-w-[90%] mx-auto">{technique.name}</div>
                                <div>{(technique.percentage * 100).toFixed(1)}%</div>
                              </div>
                            </div>
                          </Transition>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No manipulation techniques detected
                  </div>
                )}
              </div>
              
              {/* Legend */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aggregatedStats.techniques && aggregatedStats.techniques.map((technique) => (
                  <div key={technique.name} className="flex items-center">
                    <div className={`${getColor(technique.percentage)} w-3 h-3 rounded-full mr-2`}></div>
                    <span className="text-sm text-gray-700 truncate">{technique.name}</span>
                    <span className="text-xs text-gray-500 ml-1">({technique.count})</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Vulnerabilities */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <LockClosedIcon className="h-6 w-6 text-orange-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Targeted Vulnerabilities</h2>
              </div>
              
              <div className="relative h-64">
                {aggregatedStats.vulnerabilities && aggregatedStats.vulnerabilities.length > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      {aggregatedStats.vulnerabilities.map((vulnerability, index) => {
                        // Calculate size based on percentage (min 50px, max 140px)
                        const size = 50 + (vulnerability.percentage * 90);
                        const color = getColor(vulnerability.percentage);
                        
                        // Calculate position
                        const angle = (index / aggregatedStats.vulnerabilities.length) * 2 * Math.PI;
                        const radius = Math.min(250, window.innerWidth / 3.5);
                        const x = Math.cos(angle) * (radius / 3) + 50;
                        const y = Math.sin(angle) * (radius / 3) + 50;
                        
                        return (
                          <Transition
                            key={vulnerability.name}
                            appear={true}
                            show={true}
                            enter="transition ease-out duration-500"
                            enterFrom="opacity-0 scale-50"
                            enterTo="opacity-100 scale-100"
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                            style={{ 
                              left: `${x}%`, 
                              top: `${y}%`, 
                              width: `${size}px`, 
                              height: `${size}px`,
                              zIndex: Math.round(vulnerability.percentage * 10)
                            }}
                          >
                            <div className={`${color} rounded-full opacity-80 shadow-lg flex items-center justify-center`} style={{ width: '100%', height: '100%' }}>
                              <div className="text-white text-xs sm:text-sm font-medium text-center p-1">
                                <div className="truncate max-w-[90%] mx-auto">{vulnerability.name}</div>
                                <div>{(vulnerability.percentage * 100).toFixed(1)}%</div>
                              </div>
                            </div>
                          </Transition>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No vulnerabilities detected
                  </div>
                )}
              </div>
              
              {/* Legend */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aggregatedStats.vulnerabilities && aggregatedStats.vulnerabilities.map((vulnerability) => (
                  <div key={vulnerability.name} className="flex items-center">
                    <div className={`${getColor(vulnerability.percentage)} w-3 h-3 rounded-full mr-2`}></div>
                    <span className="text-sm text-gray-700 truncate">{vulnerability.name}</span>
                    <span className="text-xs text-gray-500 ml-1">({vulnerability.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;