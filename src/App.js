import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { useAuth } from './context/AuthContext';
import { useChat } from './context/ChatContext';
import Login from './components/Login';
import Chat from './components/Chat';
import UserList from './components/UserList';
import ActiveUsers from './components/ActiveUsers';

const ChatApp = () => {
  const { user, logout } = useAuth();
  const { fetchMessages } = useChat();
  const [showSidebar, setShowSidebar] = useState(true);

  if (!user) {
    return <Login />;
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleSelectUser = (userId) => {
    fetchMessages(userId);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b shadow-sm z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={toggleSidebar}
                className="md:hidden mr-3 text-gray-600 hover:text-gray-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Chat App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden md:inline">
                {user.username}
              </span>
              <button
                onClick={logout}
                className="btn btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col md:w-80 w-full border-r bg-gray-50 z-20`}>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <UserList onSelectUser={handleSelectUser} />
            </div>
            <div className="p-4 mt-4">
              <ActiveUsers onSelectUser={handleSelectUser} />
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <Chat />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <ChatApp />
      </ChatProvider>
    </AuthProvider>
  );
};

export default App;
