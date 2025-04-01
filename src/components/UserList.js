import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

const UserList = ({ onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedUser } = useChat();
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/users`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        console.log('Fetched users:', response.data);
        // Filter out the current user
        setUsers(response.data.filter(u => u._id !== user.id));
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user.id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
      </div>
      <div className="overflow-y-auto max-h-60">
        {users.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user._id} className="hover:bg-gray-50">
                <button
                  onClick={() => onSelectUser(user._id)}
                  className={`w-full px-4 py-3 flex items-center space-x-3 ${
                    selectedUser === user._id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.username || 'Anonymous User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email || 'No email'}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList; 