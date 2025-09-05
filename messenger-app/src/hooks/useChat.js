import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://10.185.101.19:8080';
const socket = io(API_URL, { autoConnect: false });

const useChat = () => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState('');
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
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSendButtonPressed, setIsSendButtonPressed] = useState(false);
  const [isEmojiButtonHovered, setIsEmojiButtonHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [userFullName, setUserFullName] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const contextMenuRef = useRef(null);
  const mouseLeaveTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const originalWrite = document.write;
    document.write = function () {
      console.warn('Вызов document.write обнаружен! Это может вызвать проблемы с загрузкой скриптов.');
      return originalWrite.apply(document, arguments);
    };
    return () => {
      document.write = originalWrite;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        console.log('Сброс выделения сообщений по Escape');
        setSelectedMessages([]);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Декодированный токен:', decoded);
        setUser(decoded.username);
        setUserId(decoded.userId);
        setUserFullName(decoded.fullName || 'Неизвестный пользователь');
        socket.auth = { token };
        socket.connect();
        fetchUsers();
      } catch (error) {
        console.error('Ошибка токена:', error);
        handleLogout();
      }
    }

    socket.on('message', (message) => {
      console.log('Получено новое сообщение:', message);
      console.log('Сообщение содержит файлы:', message.files);
      setMessages((prev) => ({
        ...prev,
        [message.chat]: [...(prev[message.chat] || []), message],
      }));
      
      // Сбрасываем состояние загрузки при получении сообщения
      console.log('useChat: Получено сообщение, сбрасываем состояние загрузки');
      setIsUploading(false);
      setUploadProgress(0);
    });

    socket.on('messageUpdated', (message) => {
      console.log('Сообщение обновлено:', message);
      setMessages((prev) => ({
        ...prev,
        [message.chat]: prev[message.chat].map((msg) =>
          msg._id === message._id ? message : msg
        ),
      }));
    });

    socket.on('messageDeleted', ({ messageId, chatId }) => {
      console.log('Сообщение удалено:', messageId, 'в чате:', chatId);
      setMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).filter((msg) => msg._id !== messageId),
      }));
      setSelectedMessages((prev) => prev.filter((id) => id !== messageId));
    });

    socket.on('userStatus', ({ userId, status }) => {
      console.log(`Статус пользователя ${userId}: ${status}`);
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, status } : u))
      );
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.type === 'private') {
            const otherParticipant = chat.participants.find((p) => p !== userId);
            if (otherParticipant && otherParticipant !== userId) {
              return { ...chat, status };
            }
          }
          return chat;
        })
      );
    });

    socket.on('connect_error', (error) => {
      console.error('Ошибка подключения:', error.message);
      handleLogout();
    });

    return () => {
      socket.off('message');
      socket.off('messageUpdated');
      socket.off('messageDeleted');
      socket.off('userStatus');
      socket.off('connect_error');
    };
  }, [token]);

  // Сбрасываем состояние загрузки при смене чата
  useEffect(() => {
    console.log('useChat: Смена чата, сбрасываем состояние загрузки');
    setIsUploading(false);
    setUploadProgress(0);
  }, [selectedChat?.chatId]);

  // Сохраняем выбранный чат в localStorage
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem('selectedChat', JSON.stringify(selectedChat));
    } else {
      localStorage.removeItem('selectedChat');
    }
  }, [selectedChat]);

  useEffect(() => {
    if (userId && token) {
      fetchChats();
    }
  }, [userId, token, users]);

  useEffect(() => {
    if (user && selectedChat) {
      console.log(`Выбран чат ${selectedChat.chatId}, загрузка сообщений`);
      socket.emit('joinChat', selectedChat.chatId);
      fetchMessages(selectedChat.chatId);
    }
  }, [user, selectedChat]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        throw new Error('Токен недействителен');
      }
      if (!response.ok) throw new Error('Не удалось загрузить пользователей');
      const data = await response.json();
      console.log('Загружены пользователи:', data);
      setUsers(data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      toast.error('Ошибка загрузки пользователей: ' + error.message);
      setUsers([]);
    }
  };

  const fetchChats = async () => {
    try {
      if (!userId) {
        console.error('userId не установлен, пропуск загрузки чатов');
        toast.error('userId не установлен');
        return;
      }
      console.log(`Загрузка чатов для userId: ${userId}, userFullName: ${userFullName}`);
      const response = await fetch(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        throw new Error('Токен недействителен');
      }
      if (!response.ok) throw new Error('Не удалось загрузить чаты');
      const data = await response.json();
      console.log('Загружены чаты:', data);
      const enrichedChats = data.map((chat) => {
        if (chat.type === 'private') {
          const isSelfChat = chat.participants[0] === chat.participants[1];
          if (isSelfChat) {
            const participantUser = users.find((u) => u.userId === chat.participants[0]) || { fullName: userFullName || 'Я' };
            const chatName = participantUser.fullName || 'Я';
            console.log(`Чат с самим собой: ${chat.chatId}, имя: ${chatName}`);
            return { ...chat, name: chatName };
          }
          const otherParticipantId = chat.participants.find((p) => p !== userId);
          const otherUser = users.find((u) => u.userId === otherParticipantId);
          const chatName = otherUser ? otherUser.fullName : 'Неизвестный пользователь';
          console.log(`Чат ${chat.chatId}: имя собеседника для ${userId} — ${chatName}`);
          return { ...chat, name: chatName };
        }
        return chat;
      });
      setChats(enrichedChats);
      
      // Проверяем, существует ли сохраненный чат в загруженных чатах
      if (selectedChat) {
        const savedChatExists = enrichedChats.some(chat => chat.chatId === selectedChat.chatId);
        if (!savedChatExists) {
          console.log('useChat: Сохраненный чат не найден, сбрасываем selectedChat');
          setSelectedChat(null);
        }
      }
      
      // Автоматически выбираем первый чат, если selectedChat не установлен
      if (enrichedChats.length > 0 && !selectedChat) {
        setSelectedChat(enrichedChats[0]);
      }
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
      toast.error('Ошибка загрузки чатов: ' + error.message);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      console.log(`Загрузка сообщений для чата ${chatId}`);
      const response = await fetch(`${API_URL}/messages/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        throw new Error('Токен недействителен');
      }
      if (!response.ok) throw new Error('Не удалось загрузить сообщения');
      const data = await response.json();
      console.log(`Загружены сообщения для ${chatId}:`, data);
      setMessages((prev) => ({
        ...prev,
        [chatId]: data,
      }));
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
      toast.error('Ошибка загрузки сообщений: ' + error.message);
    }
  };

  const createPrivateChat = async (otherUserId) => {
    try {
      if (!userId) {
        console.error('userId не установлен, невозможно создать чат');
        toast.error('userId не установлен');
        return;
      }
      console.log(`Создание чата с userId: ${otherUserId}`);
      const response = await fetch(`${API_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otherUserId }),
      });
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        throw new Error('Токен недействителен');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось создать чат');
      }
      const data = await response.json();
      const isSelfChat = otherUserId === userId;
      let chatName;
      if (isSelfChat) {
        const participantUser = users.find((u) => u.userId === otherUserId) || { fullName: userFullName || 'Я' };
        chatName = participantUser.fullName || 'Я';
      } else {
        const otherUser = users.find((u) => u.userId === otherUserId);
        chatName = otherUser ? otherUser.fullName : 'Неизвестный пользователь';
      }
      console.log(`Создан чат ${data.chatId}: имя собеседника для ${userId} — ${chatName}`);
      setChats((prev) => {
        if (prev.some((chat) => chat.chatId === data.chatId)) return prev;
        return [...prev, { ...data, name: chatName }];
      });
      setSelectedChat({ ...data, name: chatName });
      setShowAddressBook(false);
      fetchMessages(data.chatId);
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      toast.error('Ошибка создания чата: ' + error.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const url = isLogin ? '/auth/login' : '/auth/register';
    try {
      const payload = isLogin
        ? { username: formData.username, password: formData.password }
        : {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            patronymic: formData.patronymic,
          };
      const response = await fetch(`${API_URL}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сервера');
      }
      setToken(data.token);
      setUser(data.username);
      setUserId(data.userId);
      setUserFullName(data.fullName || 'Неизвестный пользователь');
      localStorage.setItem('token', data.token);
      setFormData({ username: '', email: '', password: '', firstName: '', lastName: '', patronymic: '' });
      toast.success(isLogin ? 'Успешный вход' : 'Успешная регистрация');
    } catch (error) {
      console.error(isLogin ? 'Ошибка входа:' : 'Ошибка регистрации:', error.message);
      toast.error(isLogin ? 'Ошибка входа: ' + error.message : 'Ошибка регистрации: ' + error.message);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
    setUser(null);
    setUserId(null);
    setToken(null);
    setUserFullName(null);
    setMessages({});
    setChats([]);
    setSelectedChat(null);
    setForwardMessage(null);
    setEditingMessage(null);
    setSelectedMessages([]);
    setFiles([]);
    localStorage.removeItem('token');
    socket.disconnect();
    console.log('Пользователь вышел');
    toast.info('Вы вышли из аккаунта');
  };

  const handleMessageClick = (message) => {
    if (selectedMessages.length > 0) {
      setSelectedMessages((prev) =>
        prev.includes(message._id)
          ? prev.filter((id) => id !== message._id)
          : [...prev, message._id]
      );
      console.log('Переключение выделения сообщения по клику:', message._id);
    }
  };

  const handleEditMessage = () => {
    if (!contextMenu.message) return;
    console.log('Начало редактирования сообщения:', contextMenu.message);
    setEditingMessage(contextMenu.message);
    setInput(contextMenu.message.text);
    if (inputRef.current) {
      inputRef.current.innerText = contextMenu.message.text;
      inputRef.current.focus();
    }
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !input.trim()) {
      toast.error('Введите текст для редактирования');
      setInput('');
      if (inputRef.current) inputRef.current.innerText = '';
      setEditingMessage(null);
      return;
    }
    console.log('Сохранение отредактированного сообщения:', editingMessage);
    try {
      const response = await fetch(`${API_URL}/messages/${editingMessage._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: input }),
      });
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        throw new Error('Токен недействителен');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось отредактировать сообщение');
      }
      const updatedMessage = await response.json();
      setMessages((prev) => ({
        ...prev,
        [selectedChat.chatId]: prev[selectedChat.chatId].map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        ),
      }));
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
    console.log('Отмена редактирования сообщения');
    setInput('');
    setEditingMessage(null);
    if (inputRef.current) inputRef.current.innerText = '';
  };

  const handleDeleteMessage = async () => {
    if (!contextMenu.message) return;
    console.log('Удаление сообщения:', contextMenu.message);
    try {
      const response = await fetch(`${API_URL}/messages/${contextMenu.message._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        throw new Error('Токен недействителен');
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось удалить сообщение');
      }
      toast.success('Сообщение успешно удалено');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      toast.error('Ошибка удаления: ' + error.message);
    }
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const handleSelectMessage = () => {
    if (!contextMenu.message) return;
    console.log('Переключение выделения сообщения:', contextMenu.message);
    setSelectedMessages((prev) =>
      prev.includes(contextMenu.message._id)
        ? prev.filter((id) => id !== contextMenu.message._id)
        : [...prev, contextMenu.message._id]
    );
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const handleForwardMessage = () => {
    if (!contextMenu.message && selectedMessages.length === 0) return;
    console.log('Открытие модального окна для пересылки:', selectedMessages.length > 0 ? selectedMessages : contextMenu.message);
    setForwardMessage(contextMenu.message);
    setShowForwardModal(true);
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const handleForwardToChat = async (targetChatId) => {
    if (!forwardMessage && selectedMessages.length === 0) return;
    console.log('Пересылка сообщений в чат:', targetChatId, selectedMessages.length > 0 ? selectedMessages : forwardMessage);
    try {
      const messagesToForward = selectedMessages.length > 0
        ? messages[selectedChat.chatId].filter((msg) => selectedMessages.includes(msg._id))
        : [forwardMessage];
      for (const message of messagesToForward) {
        const response = await fetch(`${API_URL}/messages/forward`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messageId: message._id, targetChatId }),
        });
        if (response.status === 401 || response.status === 403) {
          handleLogout();
          throw new Error('Токен недействителен');
        }
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Не удалось переслать сообщение');
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prevFiles) => {
        const existingFileIds = new Set(prevFiles.map((file) => `${file.name}-${file.size}`));
        const uniqueNewFiles = newFiles.filter(
          (file) => !existingFileIds.has(`${file.name}-${file.size}`)
        );
        console.log('Добавлены файлы:', uniqueNewFiles.map((f) => f.name));
        return [...prevFiles, ...uniqueNewFiles];
      });
    }
  };

  const removeFile = (fileToRemove) => {
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((file) => file !== fileToRemove);
      console.log('Удалён файл:', fileToRemove.name);
      return updatedFiles;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async () => {
    if (!input.trim() && files.length === 0) return;
    if (!user || !selectedChat) return;

    if (editingMessage) {
      handleSaveEdit();
    } else {
      if (files.length > 0) {
        // Таймаут для сброса состояния загрузки (на случай проблем с сервером)
        let uploadTimeout = null;
        
        try {
          console.log('useChat: Начинаем загрузку файлов, устанавливаем isUploading = true');
          setIsUploading(true);
          setUploadProgress(0);
          
          uploadTimeout = setTimeout(() => {
            console.log('useChat: Таймаут загрузки, сбрасываем состояние');
            setIsUploading(false);
            setUploadProgress(0);
          }, 30000); // 30 секунд
          
          const formData = new FormData();
          files.forEach((file) => formData.append('files', file));
          formData.append('chatId', selectedChat.chatId);
          formData.append('username', user);
          formData.append('fullName', userFullName || 'Неизвестный пользователь');
          formData.append('text', input);

          console.log('Загрузка файлов:', files.map((f) => f.name));
          
          const xhr = new XMLHttpRequest();
          
          // Отслеживаем прогресс загрузки
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = (e.loaded / e.total) * 100;
              setUploadProgress(Math.round(percentComplete));
            }
          });
          
          const response = await new Promise((resolve, reject) => {
            xhr.onload = () => {
              if (xhr.status === 401 || xhr.status === 403) {
                handleLogout();
                reject(new Error('Токен недействителен'));
                return;
              }
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr);
              } else {
                try {
                  const errorData = JSON.parse(xhr.responseText);
                  reject(new Error(errorData.error || 'Не удалось загрузить файлы'));
                } catch (e) {
                  reject(new Error(`Ошибка сервера: ${xhr.status}`));
                }
              }
            };
            xhr.onerror = () => reject(new Error('Ошибка загрузки'));
            xhr.open('POST', `${API_URL}/messages/upload`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
          });
          
          // Очищаем состояние после успешной загрузки
          console.log('useChat: Загрузка завершена, сбрасываем состояние');
          clearTimeout(uploadTimeout);
          setFiles([]);
          setInput('');
          setUploadProgress(0);
          setIsUploading(false);
          if (inputRef.current) inputRef.current.innerText = '';
          if (fileInputRef.current) fileInputRef.current.value = '';
          toast.success('Файлы успешно загружены');
          
          // Сообщение должно прийти через Socket.io
        } catch (error) {
          console.error('Ошибка загрузки файлов:', error);
          toast.error('Ошибка загрузки файлов: ' + error.message);
          if (uploadTimeout) {
            clearTimeout(uploadTimeout);
          }
          setUploadProgress(0);
          setIsUploading(false);
        }
      } else {
        const message = {
          username: user,
          chat: selectedChat.chatId,
          text: input,
          type: 'text',
          fullName: userFullName || 'Неизвестный пользователь',
          timestamp: new Date().toISOString(),
        };
        socket.emit('message', message);
        console.log('Отправлено новое сообщение:', message);
        setInput('');
        if (inputRef.current) inputRef.current.innerText = '';
      }
    }
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
  console.log('Выбран смайлик:', emojiObject);
  const emoji = emojiObject.emoji || '';
  setInput((prev) => prev + emoji);
  if (inputRef.current) {
    inputRef.current.focus();
  }
};

  const handleSendButtonMouseDown = () => {
    setIsSendButtonPressed(true);
    console.log('Кнопка отправки нажата');
  };

  const handleSendButtonMouseUp = () => {
    setTimeout(() => {
      setIsSendButtonPressed(false);
      console.log('Кнопка отправки отпущена');
    }, 200);
    sendMessage();
  };

  return {
    user,
    userId,
    token,
    messages,
    input,
    setInput,
    selectedChat,
    setSelectedChat,
    isLogin,
    setIsLogin,
    formData,
    setFormData,
    users,
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
    userFullName,
    files,
    setFiles,
    removeFile,
    uploadProgress,
    isUploading,
    messagesEndRef,
    inputRef,
    emojiButtonRef,
    emojiPickerRef,
    contextMenuRef,
    mouseLeaveTimeoutRef,
    fileInputRef,
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
  };
};

export default useChat;