import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      const apiUrl = process.env.REACT_APP_API_URL;
      if (!apiUrl) {
        setError('API URL is not configured. Please check your environment variables.');
        return;
      }

      const newSocket = io(apiUrl, {
        auth: {
          token: localStorage.getItem('token')
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);
        setError(null);
        newSocket.emit('join', user.id);
        newSocket.emit('userActive', { 
          userId: user.id, 
          username: user.username
        });
        newSocket.emit('getActiveUsers');
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setError('Failed to connect to chat server. Please check your connection.');
        setIsConnected(false);
      });

      newSocket.on('receiveMessage', (message) => {
        console.log('Received new message:', message);
        setMessages(prev => [...prev, message]);
      });

      newSocket.on('activeUsers', (users) => {
        console.log('Received active users:', users);
        const filteredUsers = users.filter(u => u.userId !== user.id);
        setActiveUsers(filteredUsers);
      });

      setSocket(newSocket);

      return () => {
        console.log('Disconnecting socket');
        newSocket.emit('userInactive', user.id);
        newSocket.disconnect();
      };
    }
  }, [user]);

  const fetchMessages = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/messages/${userId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setMessages(response.data);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error.response?.data?.message || 'Failed to fetch messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content) => {
    if (!selectedUser || !content.trim()) return;

    try {
      setError(null);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/messages`,
        {
          receiverId: selectedUser,
          content
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      const message = response.data;
      setMessages(prev => [...prev, message]);
      socket.emit('sendMessage', {
        ...message,
        receiverId: selectedUser
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  const updateMessageStatus = async (messageId, status) => {
    try {
      setError(null);
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/messages/${messageId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, status } : msg
        )
      );
    } catch (error) {
      console.error('Error updating message status:', error);
      setError(error.response?.data?.message || 'Failed to update message status.');
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        selectedUser,
        loading,
        sendMessage,
        fetchMessages,
        updateMessageStatus,
        setSelectedUser,
        socket,
        activeUsers,
        error,
        isConnected
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 