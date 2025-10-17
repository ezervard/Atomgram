import { useState, useEffect, useRef } from 'react';
import { gql } from '@apollo/client';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import apolloClient from '../lib/apolloClient';
import notificationSound from '../utils/notificationSound';

// GraphQL imports
import {
  GET_USERS,
  GET_CHATS,
  GET_MESSAGES,
  GET_USER_PROFILE
} from '../graphql/queries.js';

import {
  LOGIN,
  REGISTER,
  LOGOUT,
  CREATE_PRIVATE_CHAT,
  SEND_MESSAGE,
  EDIT_MESSAGE,
  DELETE_MESSAGE,
  FORWARD_MESSAGE,
  UPLOAD_FILES,
  UPDATE_PROFILE,
  UPLOAD_AVATAR
} from '../graphql/mutations.js';

import {
  MESSAGE_ADDED,
  MESSAGE_UPDATED,
  MESSAGE_DELETED,
  USER_STATUS_CHANGED,
  CHAT_UPDATED
} from '../graphql/subscriptions.js';

const useChatGraphQL = () => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [selectedChat, setSelectedChat] = useState(() => {
    const saved = localStorage.getItem('selectedChat');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    patronymic: '',
  });
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSendButtonPressed, setIsSendButtonPressed] = useState(false);
  const [isEmojiButtonHovered, setIsEmojiButtonHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [input, setInput] = useState('');

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const contextMenuRef = useRef(null);
  const mouseLeaveTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const client = apolloClient;

  // Socket.IO подключение
  const [socket, setSocket] = useState(null);

  // Состояние для данных
  const [usersData, setUsersData] = useState(null);
  const [chatsData, setChatsData] = useState(null);
  const [messagesData, setMessagesData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [chatsError, setChatsError] = useState(null);
  const [messagesError, setMessagesError] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // GraphQL Mutations будут вызываться напрямую через apolloClient.mutate()

  // GraphQL Subscriptions будут настроены позже через WebSocket

  // Извлечение данных из Apollo Cache
  const users = usersData?.users || [];
  const chats = chatsData?.chats || [];
  const messages = messagesData?.messages || [];
  const currentUser = profileData?.me;

  // Состояние сообщений для совместимости с существующим кодом
  const [messagesState, setMessagesState] = useState({});
  
  // Состояние непрочитанных сообщений
  const [unreadCounts, setUnreadCounts] = useState({});
  
  // Обновление заголовка браузера с количеством непрочитанных
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    const originalTitle = 'Atomgram Messenger';
    
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) ${originalTitle}`;
    } else {
      document.title = originalTitle;
    }
    
    // Восстанавливаем заголовок при размонтировании
    return () => {
      document.title = originalTitle;
    };
  }, [unreadCounts]);

  // Загрузка сообщений при выборе чата
  useEffect(() => {
    if (selectedChat?.chatId && token) {
      fetchMessages(selectedChat.chatId);
      // Сбрасываем счетчик непрочитанных для текущего чата
      setUnreadCounts(prev => ({
        ...prev,
        [selectedChat.chatId]: 0
      }));
    }
  }, [selectedChat?.chatId, token]);

  // Обработка токена и пользователя
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp && decoded.exp < currentTime) {
          console.log('Токен истек, выходим из системы');
          handleLogout();
          return;
        }
        
        setUser(decoded.username);
        setUserId(decoded.userId);
        
        // Подключаемся к Socket.IO
        const API_URL = import.meta.env.VITE_API_URL || 'http://10.185.101.19:8080';
        const socketUrl = API_URL.replace('https://', 'http://');
        
        const newSocket = io(socketUrl, {
          auth: {
            token: token
          }
        });
        
        setSocket(newSocket);
        
        // Загружаем данные после установки токена
        setTimeout(() => {
          fetchUsers();
          fetchChats();
        }, 100);
      } catch (error) {
        console.error('Ошибка токена:', error);
        handleLogout();
      }
    }
  }, [token]);

  // Socket.IO обработчики событий
  useEffect(() => {
    if (socket) {
      console.log('Socket.IO: Подключение установлено');

      // Присоединяемся к чатам пользователя
      if (chats.length > 0) {
        chats.forEach(chat => {
          socket.emit('joinChat', chat.chatId);
          console.log('Socket.IO: Присоединяемся к чату:', chat.chatId);
        });
      }

      // Обработчик новых сообщений
      socket.on('message', (message) => {
        console.log('Socket.IO: Получено новое сообщение:', message);
        
        // Проверяем, не наше ли это сообщение (избегаем дублирования)
        if (message.userId === userId) {
          console.log('Socket.IO: Пропускаем собственное сообщение');
          return;
        }
        
        // Добавляем сообщение в локальное состояние
        setMessagesState(prev => ({
          ...prev,
          [message.chat]: [
            ...(prev[message.chat] || []),
            message
          ]
        }));

        // Показываем уведомление и воспроизводим звук
        const isCurrentChat = selectedChat?.chatId === message.chat;
        if (!isCurrentChat || document.hidden) {
          // Воспроизводим звук уведомления
          notificationSound.play();
          
          // Обновляем счетчик непрочитанных
          setUnreadCounts(prev => ({
            ...prev,
            [message.chat]: (prev[message.chat] || 0) + 1
          }));
          
          // Показываем уведомление с возможностью перехода в чат
          const toastId = toast.info(
            `Новое сообщение от ${message.fullName || message.username}`,
            {
              autoClose: 5000,
              closeOnClick: true,
              pauseOnHover: true,
              onClick: () => {
                // Находим чат по ID
                const chat = chats.find(c => c.chatId === message.chat);
                if (chat) {
                  setSelectedChat(chat);
                  toast.dismiss(toastId);
                  // Обнуляем счетчик для этого чата
                  setUnreadCounts(prev => ({
                    ...prev,
                    [message.chat]: 0
                  }));
                }
              }
            }
          );
        } else {
          // Если чат активен, но вкладка не в фокусе, все равно воспроизводим звук
          if (document.hidden) {
            notificationSound.play();
          }
        }
      });

      // Обработчик обновления статуса пользователей
      socket.on('userStatus', ({ userId: statusUserId, status }) => {
        console.log('Socket.IO: Обновление статуса пользователя:', statusUserId, status);
        
        // Обновляем статус в списке пользователей
        setUsersData(prevUsersData => {
          if (!prevUsersData?.users) return prevUsersData;
          
          return {
            ...prevUsersData,
            users: prevUsersData.users.map(u => 
              u.userId === statusUserId ? { ...u, status } : u
            )
          };
        });
      });

      // Обработчик обновленных сообщений
      socket.on('messageUpdated', (message) => {
        console.log('Socket.IO: Сообщение обновлено:', message);
        
        setMessagesState(prev => ({
          ...prev,
          [message.chat]: prev[message.chat]?.map(msg => 
            msg._id === message._id ? message : msg
          ) || []
        }));
      });

      // Обработчик удаленных сообщений
      socket.on('messageDeleted', ({ messageId, chatId }) => {
        console.log('Socket.IO: Сообщение удалено:', messageId, chatId);
        
        setMessagesState(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || []).filter(msg => msg._id !== messageId)
        }));
        
        setSelectedMessages(prev => prev.filter(id => id !== messageId));
      });

      // Обработчик ошибок подключения
      socket.on('connect_error', (error) => {
        console.error('Socket.IO: Ошибка подключения:', error);
        toast.error('Ошибка подключения к серверу');
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO: Отключение от сервера');
      });

      return () => {
        socket.off('message');
        socket.off('userStatus');
        socket.off('messageUpdated');
        socket.off('messageDeleted');
        socket.off('connect_error');
        socket.off('disconnect');
      };
    }
  }, [socket, userId, selectedChat?.chatId, chats]);

  // Сохранение выбранного чата
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem('selectedChat', JSON.stringify(selectedChat));
    } else {
      localStorage.removeItem('selectedChat');
    }
  }, [selectedChat]);

  // Автоматический выбор первого чата
  useEffect(() => {
    if (chats.length > 0 && !selectedChat) {
      const firstChat = chats[0];
      // Создаем стабильную ссылку на объект чата
      const stableChat = {
        chatId: firstChat.chatId,
        name: firstChat.name,
        type: firstChat.type,
        participants: firstChat.participants
      };
      setSelectedChat(stableChat);
    }
  }, [chats.length, selectedChat]);

  // Обработка ошибок GraphQL
  useEffect(() => {
    if (usersError) {
      console.error('Ошибка загрузки пользователей:', usersError);
      if (usersError.message.includes('Unauthorized')) {
        handleLogout();
      }
    }
    if (chatsError) {
      console.error('Ошибка загрузки чатов:', chatsError);
      if (chatsError.message.includes('Unauthorized')) {
        handleLogout();
      }
    }
    if (messagesError) {
      console.error('Ошибка загрузки сообщений:', messagesError);
    }
  }, [usersError, chatsError, messagesError]);

  // Функции для работы с данными
  const fetchUsers = async () => {
    if (!token) return;
    setUsersLoading(true);
    setUsersError(null);
    try {
      const { data } = await apolloClient.query({
        query: GET_USERS,
        errorPolicy: 'all'
      });
      setUsersData(data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      setUsersError(error);
      toast.error('Ошибка загрузки пользователей: ' + error.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchChats = async () => {
    if (!token) return;
    setChatsLoading(true);
    setChatsError(null);
    try {
      const { data } = await apolloClient.query({
        query: GET_CHATS,
        errorPolicy: 'all'
      });
      setChatsData(data);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
      setChatsError(error);
      toast.error('Ошибка загрузки чатов: ' + error.message);
    } finally {
      setChatsLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    if (!chatId || !token) return;
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const { data } = await apolloClient.query({
        query: GET_MESSAGES,
        variables: { chatId },
        errorPolicy: 'all'
      });
      
      // Сохраняем сообщения для конкретного чата
      if (data?.messages) {
        setMessagesState(prev => ({
          ...prev,
          [chatId]: data.messages
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
      setMessagesError(error);
      toast.error('Ошибка загрузки сообщений: ' + error.message);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!token) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const { data } = await apolloClient.query({
        query: GET_USER_PROFILE,
        errorPolicy: 'all'
      });
      setProfileData(data);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      setProfileError(error);
    } finally {
      setProfileLoading(false);
    }
  };

  const createPrivateChat = async (otherUserId) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_PRIVATE_CHAT,
        variables: { otherUserId }
      });
      
      if (data?.createPrivateChat) {
        const newChat = data.createPrivateChat;
        
        // Создаем стабильную ссылку на объект чата
        const stableChat = {
          chatId: newChat.chatId,
          name: newChat.name,
          type: newChat.type,
          participants: newChat.participants
        };
        
        setSelectedChat(stableChat);
        setShowAddressBook(false);
        
        // Загружаем сообщения для нового чата
        await fetchMessages(newChat.chatId);
        
        // Обновляем список чатов
        await fetchChats();
        
        // Присоединяемся к новому чату через Socket.IO
        if (socket) {
          socket.emit('joinChat', newChat.chatId);
          console.log('Socket.IO: Присоединяемся к новому чату:', newChat.chatId);
        }
      }
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      toast.error('Ошибка создания чата: ' + error.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let result;
      if (isLogin) {
        result = await apolloClient.mutate({
          mutation: LOGIN,
          variables: {
            username: formData.username,
            password: formData.password
          }
        });
      } else {
        result = await apolloClient.mutate({
          mutation: REGISTER,
          variables: {
            input: {
              username: formData.username,
              email: formData.email,
              password: formData.password,
              firstName: formData.firstName,
              lastName: formData.lastName,
              patronymic: formData.patronymic,
            }
          }
        });
      }

      if (result.data) {
        const authData = isLogin ? result.data.login : result.data.register;
        setToken(authData.token);
        setUser(authData.user.username);
        setUserId(authData.user.userId);
        localStorage.setItem('token', authData.token);
        setFormData({ username: '', email: '', password: '', firstName: '', lastName: '', patronymic: '' });
        toast.success(isLogin ? 'Успешный вход' : 'Успешная регистрация');
        
        // Загружаем данные после успешной авторизации
        setTimeout(() => {
          fetchUsers();
          fetchChats();
        }, 100);
      }
    } catch (error) {
      console.error(isLogin ? 'Ошибка входа:' : 'Ошибка регистрации:', error);
      toast.error(isLogin ? 'Ошибка входа: ' + error.message : 'Ошибка регистрации: ' + error.message);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = async () => {
    try {
      await apolloClient.mutate({
        mutation: LOGOUT
      });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
    
    // Отключаем Socket.IO
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    // Очистка состояния
    setUser(null);
    setUserId(null);
    setToken(null);
    setMessagesState({});
    setChatsData(null);
    setUsersData(null);
    setSelectedChat(null);
    setForwardMessage(null);
    setEditingMessage(null);
    setSelectedMessages([]);
    setFiles([]);
    localStorage.removeItem('token');
    
    // Очистка Apollo Cache
    client.clearStore();
    
    console.log('Пользователь вышел');
    toast.info('Вы вышли из аккаунта');
  };

  const sendMessage = async () => {
    if (!input.trim() && files.length === 0) return;
    if (!user || !selectedChat) return;

    if (editingMessage) {
      await handleSaveEdit();
    } else {
      if (files.length > 0) {
        // Загружаем файлы
        await handleFileUpload();
      } else {
        try {
          const { data } = await apolloClient.mutate({
            mutation: SEND_MESSAGE,
            variables: {
              input: {
                chatId: selectedChat.chatId,
                text: input,
                type: 'TEXT'
              }
            }
          });
          
          // Добавляем новое сообщение в состояние
          if (data?.sendMessage) {
            const newMessage = data.sendMessage;
            setMessagesState(prev => ({
              ...prev,
              [selectedChat.chatId]: [
                ...(prev[selectedChat.chatId] || []),
                newMessage
              ]
            }));
            
            // Socket.IO будет отправлять сообщение автоматически через сервер
          }
          
          setInput('');
          if (inputRef.current) inputRef.current.innerText = '';
        } catch (error) {
          console.error('Ошибка отправки сообщения:', error);
          toast.error('Ошибка отправки сообщения: ' + error.message);
        }
      }
    }
  };

  const handleFileUpload = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Используем REST API для загрузки файлов
      const API_URL = import.meta.env.VITE_API_URL || 'http://10.185.101.19:8080';
      const formData = new FormData();
      
      // Добавляем файлы в FormData
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      // Добавляем дополнительные данные
      formData.append('chatId', selectedChat.chatId);
      formData.append('userId', userId);
      formData.append('username', user);
      formData.append('fullName', user);
      if (input.trim()) {
        formData.append('text', input);
      }

      const response = await fetch(`${API_URL}/messages/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки файлов');
      }

      const result = await response.json();
      console.log('Файлы загружены:', result);
      console.log('Структура файлов в сообщении:', result.message?.files);

      // Добавляем новое сообщение с файлами в состояние
      if (result.message) {
        const newMessage = result.message;
        setMessagesState(prev => ({
          ...prev,
          [selectedChat.chatId]: [
            ...(prev[selectedChat.chatId] || []),
            newMessage
          ]
        }));
      }

      setFiles([]);
      setInput('');
      setUploadProgress(0);
      setIsUploading(false);
      if (inputRef.current) inputRef.current.innerText = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Файлы успешно загружены');
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      toast.error('Ошибка загрузки файлов: ' + error.message);
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !input.trim()) {
      toast.error('Введите текст для редактирования');
      setInput('');
      if (inputRef.current) inputRef.current.innerText = '';
      setEditingMessage(null);
      return;
    }

    try {
      const { data } = await apolloClient.mutate({
        mutation: EDIT_MESSAGE,
        variables: {
          messageId: editingMessage._id,
          text: input
        }
      });
      
      // Обновляем сообщение в локальном состоянии
      if (data?.editMessage) {
        const chatId = editingMessage.chat;
        setMessagesState(prev => ({
          ...prev,
          [chatId]: prev[chatId]?.map(msg => 
            msg._id === editingMessage._id 
              ? { ...msg, text: input, edited: true }
              : msg
          ) || []
        }));
      }

      setInput('');
      setEditingMessage(null);
      if (inputRef.current) inputRef.current.innerText = '';
      toast.success('Сообщение успешно отредактировано');
    } catch (error) {
      console.error('Ошибка редактирования:', error);
      toast.error('Ошибка редактирования: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setInput('');
    setEditingMessage(null);
    if (inputRef.current) inputRef.current.innerText = '';
  };

  const handleDeleteMessage = async () => {
    if (!contextMenu.message) return;

    try {
      await apolloClient.mutate({
        mutation: DELETE_MESSAGE,
        variables: { messageId: contextMenu.message._id }
      });
      
      // Удаляем сообщение из локального состояния
      const chatId = contextMenu.message.chat;
      setMessagesState(prev => ({
        ...prev,
        [chatId]: prev[chatId]?.filter(msg => msg._id !== contextMenu.message._id) || []
      }));
      
      toast.success('Сообщение успешно удалено');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      toast.error('Ошибка удаления: ' + error.message);
    }
    
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const handleDeleteSelectedMessages = async () => {
    if (selectedMessages.length === 0) return;

    try {
      // Удаляем все выделенные сообщения
      for (const messageId of selectedMessages) {
        await apolloClient.mutate({
          mutation: DELETE_MESSAGE,
          variables: { messageId }
        });
      }
      
      // Удаляем сообщения из локального состояния
      const chatId = selectedChat?.chatId;
      if (chatId) {
        setMessagesState(prev => ({
          ...prev,
          [chatId]: prev[chatId]?.filter(msg => !selectedMessages.includes(msg._id)) || []
        }));
      }
      
      setSelectedMessages([]);
      toast.success(`Удалено сообщений: ${selectedMessages.length}`);
    } catch (error) {
      console.error('Ошибка удаления выделенных сообщений:', error);
      toast.error('Ошибка удаления: ' + error.message);
    }
  };

  const handleForwardMessage = () => {
    if (!contextMenu.message && selectedMessages.length === 0) return;
    setForwardMessage(contextMenu.message);
    setShowForwardModal(true);
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const handleForwardToChat = async (targetChatId) => {
    if (!forwardMessage && selectedMessages.length === 0) return;

    try {
      const messagesToForward = selectedMessages.length > 0
        ? messages.filter((msg) => selectedMessages.includes(msg._id))
        : [forwardMessage];

      for (const message of messagesToForward) {
        const { data } = await apolloClient.mutate({
          mutation: FORWARD_MESSAGE,
          variables: {
            messageId: message._id,
            targetChatId
          }
        });
        
        // Добавляем пересланное сообщение в состояние
        if (data?.forwardMessage) {
          const forwardedMessage = data.forwardMessage;
          console.log('Received forwarded message:', forwardedMessage);
          setMessagesState(prev => ({
            ...prev,
            [targetChatId]: [
              ...(prev[targetChatId] || []),
              forwardedMessage
            ]
          }));
          
          // Очищаем кэш Apollo Client полностью
          await apolloClient.clearStore();
        }
      }

      setShowForwardModal(false);
      setForwardMessage(null);
      setSelectedMessages([]);
      toast.success('Сообщение успешно переслано');
    } catch (error) {
      console.error('Ошибка пересылки:', error);
      toast.error('Ошибка пересылки: ' + error.message);
    }
  };

  const updateProfile = async (profileData, avatarFile) => {
    try {
      let avatarUrl = null;
      
      if (avatarFile) {
        const { data: avatarData } = await apolloClient.mutate({
          mutation: UPLOAD_AVATAR,
          variables: { avatar: avatarFile }
        });
        avatarUrl = avatarData?.uploadAvatar?.avatar;
      }

      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PROFILE,
        variables: { input: profileData }
      });

      toast.success('Профиль успешно обновлен');
      return data?.updateProfile;
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      toast.error('Ошибка обновления профиля: ' + error.message);
      throw error;
    }
  };

  // Обработчики событий
  const handleMessageClick = (message) => {
    if (selectedMessages.length > 0) {
      setSelectedMessages((prev) =>
        prev.includes(message._id)
          ? prev.filter((id) => id !== message._id)
          : [...prev, message._id]
      );
    }
  };

  const handleEditMessage = () => {
    if (!contextMenu.message) return;
    setEditingMessage(contextMenu.message);
    setInput(contextMenu.message.text);
    if (inputRef.current) {
      inputRef.current.innerText = contextMenu.message.text;
      inputRef.current.focus();
    }
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const handleSelectMessage = () => {
    if (!contextMenu.message) return;
    setSelectedMessages((prev) =>
      prev.includes(contextMenu.message._id)
        ? prev.filter((id) => id !== contextMenu.message._id)
        : [...prev, contextMenu.message._id]
    );
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prevFiles) => {
        const existingFileIds = new Set(prevFiles.map((file) => `${file.name}-${file.size}`));
        const uniqueNewFiles = newFiles.filter(
          (file) => !existingFileIds.has(`${file.name}-${file.size}`)
        );
        return [...prevFiles, ...uniqueNewFiles];
      });
    }
  };

  const removeFile = (fileToRemove) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
  };

  const handleEmojiClick = (emojiObject) => {
    const emoji = emojiObject.native || emojiObject.emoji || '';
    setInput((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendButtonMouseDown = () => {
    setIsSendButtonPressed(true);
  };

  const handleSendButtonMouseUp = () => {
    setTimeout(() => {
      setIsSendButtonPressed(false);
    }, 200);
    sendMessage();
  };

  // Возвращаем все необходимые значения для совместимости
  return {
    // Состояние
    user,
    userId,
    token,
    messages: messagesState,
    input,
    setInput,
    selectedChat,
    setSelectedChat,
    isLogin,
    setIsLogin,
    formData,
    setFormData,
    users,
    setUsers: setUsersData,
    chats,
    showAddressBook,
    setShowAddressBook,
    showEmojiPicker,
    setShowEmojiPicker,
    isSendButtonPressed,
    setIsSendButtonPressed,
    isEmojiButtonHovered,
    setIsEmojiButtonHovered,
    contextMenu,
    setContextMenu,
    showForwardModal,
    setShowForwardModal,
    forwardMessage,
    setForwardMessage,
    editingMessage,
    setEditingMessage,
    selectedMessages,
    setSelectedMessages,
    files,
    setFiles,
    removeFile,
    uploadProgress,
    isUploading,
    unreadCounts,
    
    // Refs
    messagesEndRef,
    inputRef,
    emojiButtonRef,
    emojiPickerRef,
    contextMenuRef,
    mouseLeaveTimeoutRef,
    fileInputRef,
    
    // Функции
    fetchUsers,
    fetchChats,
    fetchMessages,
    createPrivateChat,
    handleFormSubmit,
    handleInputChange,
    handleLogout,
    handleMessageClick,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteMessage,
    handleDeleteSelectedMessages,
    handleSelectMessage,
    handleForwardMessage,
    handleForwardToChat,
    sendMessage,
    handleKeyDown,
    handleInput,
    handleEmojiClick,
    handleSendButtonMouseDown,
    handleSendButtonMouseUp,
    handleFileChange,
    updateProfile,
    
    // Управление звуком уведомлений
    notificationSound,
    
    // GraphQL специфичные данные
    currentUser,
    loading: {
      users: usersLoading,
      chats: chatsLoading,
      messages: messagesLoading,
      profile: profileLoading
    },
    errors: {
      users: usersError,
      chats: chatsError,
      messages: messagesError,
      profile: profileError
    }
  };
};

export default useChatGraphQL;
