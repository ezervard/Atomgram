import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MessageSearch = ({ 
  isOpen, 
  onClose, 
  messages, 
  selectedChat, 
  users,
  onMessageClick 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchType, setSearchType] = useState('text'); // 'text', 'files', 'links'
  const [fromUser, setFromUser] = useState(null); // null = все пользователи, userId = конкретный пользователь
  const [selectedMessages, setSelectedMessages] = useState([]); // Выделенные сообщения
  
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);

  // Фокус на поле поиска при открытии
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Поиск по сообщениям
  useEffect(() => {
    // Для поиска по тексту нужен введенный запрос
    if (searchType === 'text' && !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Для поиска по файлам и ссылкам запрос не нужен
    if (!selectedChat || !messages[selectedChat.chatId]) {
      setSearchResults([]);
      return;
    }

    const chatMessages = messages[selectedChat.chatId];
    const query = searchQuery.toLowerCase().trim();
    
    const results = chatMessages
      .filter(message => {
        // Фильтр по пользователю
        if (fromUser && message.userId !== fromUser) {
          return false;
        }

        // Поиск по тексту
        if (searchType === 'text' && message.text && message.text.toLowerCase().includes(query)) {
          return true;
        }

        // Поиск по файлам
        if (searchType === 'files' && message.files && message.files.length > 0) {
          // Если есть поисковый запрос, ищем по имени файла
          if (query) {
            const hasMatchingFile = message.files.some(file => {
              const fileName = file.filename || file.originalName || file.name || '';
              return fileName.toLowerCase().includes(query);
            });
            if (hasMatchingFile) return true;
          } else {
            // Если нет запроса, показываем все сообщения с файлами
            return true;
          }
        }

        // Поиск по ссылкам
        if (searchType === 'links' && message.text) {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const foundLinks = message.text.match(urlRegex);
          if (foundLinks) {
            // Если есть поисковый запрос, ищем по URL
            if (query) {
              const hasMatchingUrl = foundLinks.some(link => link.toLowerCase().includes(query));
              if (hasMatchingUrl) return true;
            } else {
              // Если нет запроса, показываем все сообщения со ссылками
              return true;
            }
          }
        }

        return false;
      })
      .map(message => ({
        ...message,
        matchType: getMatchType(message, query)
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Сортировка по времени

    setSearchResults(results);
    setSelectedIndex(0);
  }, [searchQuery, selectedChat, messages, searchType, fromUser]);

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    // Очищаем поле поиска при переключении на файлы или ссылки
    if (type === 'files' || type === 'links') {
      setSearchQuery('');
    }
  };

  const handleUserFilterChange = (userId) => {
    setFromUser(fromUser === userId ? null : userId);
  };

  const handleDoubleClick = (message) => {
    setSelectedMessages(prev => {
      const isSelected = prev.includes(message._id);
      if (isSelected) {
        // Убираем из выделенных
        return prev.filter(id => id !== message._id);
      } else {
        // Добавляем к выделенным
        return [...prev, message._id];
      }
    });
  };

  const getMatchType = (message, query) => {
    if (searchType === 'text' && message.text && message.text.toLowerCase().includes(query)) {
      return 'text';
    }
    if (searchType === 'files' && message.files && message.files.length > 0) {
      return 'files';
    }
    if (searchType === 'links' && message.text && hasLinks(message.text)) {
      return 'links';
    }
    return searchType;
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      handleResultClick(searchResults[selectedIndex]);
    }
  };

  const handleResultClick = (message) => {
    if (onMessageClick) {
      onMessageClick(message);
    }
    onClose();
  };

  const getUserInfo = (userId) => {
    return users.find(u => u.userId === userId);
  };

  const getFileIcon = (fileType) => {
    if (!fileType || typeof fileType !== 'string') return '📄';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    return '📄';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 дней
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasLinks = (text) => {
    if (!text) return false;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20"
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[70vh] flex flex-col"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Поиск в чате "{selectedChat?.name}"
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* Поле поиска и фильтры */}
        <div className="p-4 border-b border-gray-200">
          {/* Поле поиска показывается только для поиска по тексту */}
          {searchType === 'text' && (
            <div className="relative mb-3">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск по сообщениям..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
          
          {/* Информация о типе поиска */}
          {searchType === 'files' && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">Поиск по файлам</span>
              </div>
              <p className="text-xs text-green-600 mt-1">Показываются все сообщения с вложениями</p>
            </div>
          )}
          
          {searchType === 'links' && (
            <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 text-purple-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-sm font-medium">Поиск по ссылкам</span>
              </div>
              <p className="text-xs text-purple-600 mt-1">Показываются все сообщения со ссылками</p>
            </div>
          )}

          {/* Фильтры */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="searchText"
                name="searchType"
                checked={searchType === 'text'}
                onChange={() => handleSearchTypeChange('text')}
                className="text-blue-600"
              />
              <label htmlFor="searchText" className="text-gray-600">Текст</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="searchFiles"
                name="searchType"
                checked={searchType === 'files'}
                onChange={() => handleSearchTypeChange('files')}
                className="text-blue-600"
              />
              <label htmlFor="searchFiles" className="text-gray-600">Файлы</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="searchLinks"
                name="searchType"
                checked={searchType === 'links'}
                onChange={() => handleSearchTypeChange('links')}
                className="text-blue-600"
              />
              <label htmlFor="searchLinks" className="text-gray-600">Ссылки</label>
            </div>
          </div>
        </div>

        {/* Результаты поиска */}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length > 0 ? (
              <div ref={resultsRef} className="p-2">
                {searchResults.map((message, index) => {
                  const userInfo = getUserInfo(message.userId);
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <motion.div
                      key={message._id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleResultClick(message)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center flex-shrink-0">
                              {userInfo?.avatar && userInfo.avatar !== 'null' && userInfo.avatar.trim() !== '' ? (
                                <img
                                  src={userInfo.avatar.startsWith('http') ? userInfo.avatar : `http://10.185.101.19:8080${userInfo.avatar}`}
                                  alt="Аватар"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-gray-600">
                                  {userInfo?.firstName?.charAt(0)?.toUpperCase() || userInfo?.username?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-800">
                              {userInfo?.firstName && userInfo?.lastName ? 
                                `${userInfo.lastName} ${userInfo.firstName}` : 
                                userInfo?.username || 'Неизвестный пользователь'
                              }
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                          
                          {/* Содержимое сообщения */}
                          <div className="text-sm text-gray-700">
                            {message.text && (
                              <div className="mb-1">
                                {highlightText(message.text, searchQuery)}
                              </div>
                            )}
                            
                            {/* Показываем файлы если есть файлы в сообщении */}
                            {message.files && message.files.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {message.files.map((file, fileIndex) => (
                                  <div key={fileIndex} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                                    <span>{getFileIcon(file.mimetype || file.type)}</span>
                                    <span className="truncate">
                                      {file.filename || file.originalName || file.name || 'Файл'}
                                    </span>
                                    {file.size && (
                                      <span className="text-gray-500 ml-auto">
                                        {formatFileSize(file.size)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Показываем ссылки если есть ссылки в сообщении */}
                            {message.text && hasLinks(message.text) && (
                              <div className="mt-2 text-xs text-blue-600 bg-blue-50 rounded p-2">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  <span>Ссылка в сообщении</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Индикатор типа совпадения */}
                        <div className="ml-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            message.matchType === 'text' ? 'bg-blue-100 text-blue-800' :
                            message.matchType === 'files' ? 'bg-green-100 text-green-800' :
                            message.matchType === 'links' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {message.matchType === 'text' ? 'Текст' :
                             message.matchType === 'files' ? 'Файлы' :
                             message.matchType === 'links' ? 'Ссылки' : 'Совпадение'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p>Ничего не найдено</p>
                <p className="text-sm">Попробуйте изменить поисковый запрос или фильтры</p>
              </div>
            )}
        </div>

        {/* Подсказки */}
        {searchResults.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            <span>↑↓ для навигации • Enter для выбора • Esc для закрытия</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MessageSearch;
