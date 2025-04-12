import { Settings, Search, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
const Sidebar = ({
    contacts,
    selectedContact,
    setSelectedContact,
    searchQuery,
    setSearchQuery,
    setIsDashboard,
}) => {
    // Filter contacts based on search query
    const filteredContacts = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <aside className="w-1/4 border-r border-gray-200 bg-gray-50 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h1 className="font-bold text-xl">Messages</h1>
                <Button variant="ghost" size="icon">
                    <Settings size={20} />
                </Button>
                <Button onClick={() => setIsDashboard((prev) => !prev)}>
                    Dashboard
                </Button>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                    />
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
                {filteredContacts.map((contact) => (
                    <div
                        key={contact.id}
                        className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 ${
                            selectedContact === contact.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedContact(contact.id)}
                    >
                        <div className="relative">
                            <Avatar className="h-12 w-12">
                                {contact.avatar ? (
                                    <AvatarImage
                                        src={contact.avatar}
                                        alt={contact.name}
                                    />
                                ) : (
                                    <AvatarFallback>
                                        {contact.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <span
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                                    contact.status === "online"
                                        ? "bg-green-500"
                                        : "bg-gray-400"
                                }`}
                            />
                        </div>

                        <div className="ml-3 flex-1">
                            <div className="flex justify-between">
                                <p className="font-medium">{contact.name}</p>
                                <span className="text-xs text-gray-500">
                                    {contact.time}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                                {contact.lastMessage}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* User profile */}
            <div className="p-4 border-t border-gray-200 flex items-center">
                <Avatar className="h-10 w-10">
                    <AvatarFallback>
                        <User size={20} />
                    </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                    <p className="font-medium">You</p>
                    <p className="text-xs text-gray-500">Available</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
