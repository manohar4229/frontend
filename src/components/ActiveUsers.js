import React from 'react';
import { useChat } from '../context/ChatContext';

const ActiveUsers = ({ onSelectUser }) => {
  const { activeUsers, socket } = useChat();

  // Debugging logs
  console.log('Active users from context:', activeUsers);

  // Request active users immediately when component mounts
  React.useEffect(() => {
    if (socket) {
      console.log('Requesting active users');
      socket.emit('getActiveUsers');
    }
  }, [socket]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
      <div className="p-4 bg-primary-600 text-white">
        <h2 className="text-lg font-semibold">Active Now</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeUsers && activeUsers.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {activeUsers.map((activeUser) => (
              <li key={activeUser.userId} className="hover:bg-gray-50">
                <button
                  onClick={() => onSelectUser(activeUser.userId)}
                  className="w-full px-4 py-3 flex items-center space-x-3"
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {activeUser.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activeUser.username}
                    </p>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No active users right now</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveUsers;