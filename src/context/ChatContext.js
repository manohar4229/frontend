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

  useEffect(() => {
    if (user) {
      console.log('Creating socket connection with user:', user);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      console.log('Using API URL:', apiUrl);
      
      const newSocket = io(apiUrl, {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        newSocket.emit('join', user.id);
        
        // Register as an active user
        newSocket.emit('userActive', { 
          userId: user.id, 
          username: user.username
        });
        
        // Request active users list
        newSocket.emit('getActiveUsers');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      newSocket.on('receiveMessage', (message) => {
        console.log('Received new message:', message);
        setMessages(prev => [...prev, message]);
      });

      newSocket.on('activeUsers', (users) => {
        console.log('Received active users:', users);
        // Filter out current user
        const filteredUsers = users.filter(u => u.userId !== user.id);
        setActiveUsers(filteredUsers);
        console.log('Filtered active users:', filteredUsers);
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
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/messages/${userId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setMessages(response.data);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content) => {
    if (!selectedUser || !content.trim()) return;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/messages`,
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
    }
  };

  const updateMessageStatus = async (messageId, status) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/messages/${messageId}/status`,
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
        activeUsers
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