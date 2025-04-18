import { useState, useEffect } from 'react'
import { Settings, Search, User, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { statisticsApi, ManipulativeTechniques, Vulnerabilities } from '@/lib/statistics_api'


const Sidebar = ({ 
  contacts, 
  selectedContact, 
  setSelectedContact, 
  searchQuery, 
  setSearchQuery,
  currentUser,
  onDashboardClick
}) => {

  // Filter contacts based on search query directly
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <aside className="w-1/4 border-r border-gray-200 bg-gray-50 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="font-bold text-xl">Messages</h1>
        <Button variant="ghost" size="icon">
          <Settings size={20} />
        </Button>
      </div>
      
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search contacts" 
            className="w-full bg-white rounded-full pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Contact list */}
      <div className="flex-1 overflow-y-auto contact-list">
        {filteredContacts.length > 0 ? (
          filteredContacts.map(contact => (
            <div 
              key={contact.id}
              className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 ${selectedContact && selectedContact.id === contact.id ? 'bg-blue-50' : ''}`}
              onClick={() => setSelectedContact(contact)}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  {contact.isBot ? (
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                      <Bot size={24} />
                    </AvatarFallback>
                  ) : contact.avatar ? (

                    <AvatarImage src={contact.avatar} alt={contact.name} />
                  ) : (
                    <AvatarFallback>
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span 
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${contact.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} 
                />
              </div>
              
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <p className={`font-medium ${contact.isBot ? 'text-purple-600' : ''}`}>{contact.name}</p>
                  <span className="text-xs text-gray-500">{contact.time}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {contact.isBot ? (
                    <span className="flex items-center">
                      <Bot size={14} className="mr-1" />
                      {contact.lastMessage}
                    </span>
                  ) : (
                    contact.lastMessage
                  )}
                </p>

              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No contacts found
          </div>
        )}
      </div>

      {/* Dashboard Button */}
      <div className="px-3 mb-2">
        <button
          onClick={onDashboardClick}
          className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg shadow-md transition-all duration-300 flex items-center justify-center group"
        >
          <svg 
            className="w-5 h-5 mr-2 group-hover:animate-pulse" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
          </svg>
          <span className="font-medium">Dashboard</span>
        </button>
      </div>

      
      {/* User profile */}
      <div className="p-4 border-t border-gray-200 flex items-center">
        <Avatar className="h-10 w-10">
          {currentUser ? (
            <AvatarFallback>
              {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('') : 'U'}
            </AvatarFallback>
          ) : (
            <AvatarFallback>
              <User size={20} />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="ml-3">
          <p className="font-medium">{currentUser ? currentUser.name || currentUser.user_name : 'You'}</p>
          <p className="text-xs text-gray-500">Available</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar