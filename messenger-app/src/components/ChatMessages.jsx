import React, { useEffect, useState } from 'react';
import ImageModal from './ImageModal';
import LinkPreview from './LinkPreview';

const ChatMessages = ({ user, userId, users, selectedChat, messages, selectedMessages, setSelectedMessages, setContextMenu, handleMessageClick, messagesEndRef, highlightedMessageId }) => {
  const [imageModal, setImageModal] = useState({ isOpen: false, url: '', alt: '' });

  // Обработчик ESC для отмены выделения
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedMessages.length > 0) {
        setSelectedMessages([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMessages.length, setSelectedMessages]);

  // Функция прокрутки к сообщению
  const scrollToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Добавляем класс выделения
      messageElement.classList.add('message-highlighted');
      
      // Убираем выделение через 3 секунды
      setTimeout(() => {
        messageElement.classList.remove('message-highlighted');
      }, 3000);
    }
  };

  // Эффект для прокрутки к выделенному сообщению
  useEffect(() => {
    if (highlightedMessageId) {
      scrollToMessage(highlightedMessageId);
    }
  }, [highlightedMessageId]);

  // Функция для определения, является ли сообщение от текущего пользователя
  const isCurrentUserMessage = (msg) => {
    // Сначала проверяем по userId (самый надежный способ)
    if (msg.userId && userId) {
      return msg.userId === userId;
    }
    
    // Если userId нет, ищем по username в списке пользователей
    const currentUser = users.find(u => u.userId === userId);
    if (currentUser) {
      const currentUserDisplayName = `${currentUser.lastName || ''} ${currentUser.firstName || ''}`.trim() || currentUser.username;
      // Сравниваем с отображаемым именем (которое уже установлено в msg.username)
      return msg.username === currentUserDisplayName;
    }
    // Если не найден, используем старое сравнение
    return msg.username === user;
  };

  // Функция для исправления кодировки имени файла
  const fixFileNameEncoding = (fileName) => {
    if (!fileName || typeof fileName !== 'string') {
      return 'Неизвестный файл';
    }
    
    try {
      // Пытаемся исправить кодировку, если имя содержит неправильно закодированные символы
      if (/Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ/.test(fileName)) {
        return decodeURIComponent(escape(fileName));
      }
      return fileName;
    } catch (e) {
      return fileName || 'Неизвестный файл';
    }
  };

  // Функция для проверки наличия ссылок в тексте
  const hasLinks = (text) => {
    if (!text) return false;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
  };

  // Функция для рендеринга текста с поддержкой эмодзи и ссылок
  const renderTextWithEmojis = (text, message) => {
    if (!text) return '';
    
    // Регулярное выражение для URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Простой подход - используем CSS класс для эмодзи
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
    const parts = text.split(emojiRegex);
    
    return parts.map((part, index) => {
      if (emojiRegex.test(part)) {
        // Это эмодзи - используем CSS класс
        return (
          <span key={index} className="emoji">
            {part}
          </span>
        );
      } else {
        // Проверяем, содержит ли часть URL
        if (urlRegex.test(part)) {
          return part.split(urlRegex).map((subPart, subIndex) => {
            if (urlRegex.test(subPart)) {
              return (
                <a
                  key={`${index}-${subIndex}`}
                  href={subPart}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`underline ${isCurrentUserMessage(message) ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {subPart}
                </a>
              );
            }
            return subPart;
          });
        }
        // Обычный текст
        return part;
      }
    });
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    console.log('Открыто контекстное меню для сообщения:', message);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message,
    });
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

  const openImageModal = (imageUrl, imageAlt) => {
    setImageModal({
      isOpen: true,
      url: imageUrl,
      alt: imageAlt
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      url: '',
      alt: ''
    });
  };

  const handleFileDownload = async (fileUrl, fileName) => {
    try {
      // Получаем файл по URL
      const response = await fetch(fileUrl.replace('https://', 'http://'));
      const blob = await response.blob();
      
      // Создаем URL для blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Создаем ссылку для скачивания
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      // Добавляем в DOM, кликаем и удаляем
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Освобождаем память
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      // Fallback - обычная ссылка
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    // Прокрутка к последнему сообщению
    if (messagesEndRef && messagesEndRef.current) {
      setTimeout(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [selectedChat, messages]);

  return (
    <>
      {selectedChat ? (
        <div className="messages-container w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto p-4 overflow-y-auto scrollbar-hide" style={{ paddingTop: 'calc(100vh - 200px)' }}>
          {[...(messages[selectedChat.chatId] || [])]
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .map((msg, index) => (
            <div
              key={msg._id || `temp-${index}`}
              id={`message-${msg._id || `temp-${index}`}`}
              className={`flex mb-4 ${isCurrentUserMessage(msg) ? 'justify-end' : 'justify-start'} ${
                selectedMessages.includes(msg._id) ? 'bg-blue-200 rounded-lg p-1' : ''
              }`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
              onClick={() => handleMessageClick(msg)}
              onDoubleClick={() => handleDoubleClick(msg)}
            >
              <div
                className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl select-none break-words shadow-sm hover:shadow-md transition-shadow duration-200 ${
                  isCurrentUserMessage(msg) 
                    ? 'bg-blue-500 text-white rounded-br-md ml-auto' 
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                } ${(msg.forwardedFrom || msg.originalMessage) ? 'border-l-4 border-blue-400' : ''}`}
              >
                {(msg.forwardedFrom || msg.originalMessage) && (
                  <p className="text-xs opacity-75 mb-1">
                    📤 Переслано от <strong>{msg.fullName || msg.username || 'Неизвестный пользователь'}</strong>
                  </p>
                )}
                {msg.text && (
                  <>
                    <p className="message-text select-text">{renderTextWithEmojis(msg.text, msg)}</p>
                    {hasLinks(msg.text) && <LinkPreview text={msg.text} />}
                  </>
                )}
                {msg.files && msg.files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.files.map((file, fileIndex) => {
                      // Логируем структуру файла для отладки
                      console.log(`Файл ${fileIndex}:`, file);
                      console.log(`Доступные поля:`, Object.keys(file));
                      
                      // Исправляем кодировку имени файла для отображения
                      const displayName = fixFileNameEncoding(file.filename || file.originalName || file.name);
                      
                      const getFileIcon = (fileType) => {
                        if (!fileType || typeof fileType !== 'string') return '📄';
                        if (fileType.startsWith('image/')) return '🖼️';
                        if (fileType.startsWith('video/')) return '🎥';
                        if (fileType.startsWith('audio/')) return '🎵';
                        if (fileType.includes('pdf')) return '📄';
                        if (fileType.includes('word') || fileType.includes('document')) return '📝';
                        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
                        if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
                        if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return '📦';
                        return '📄';
                      };

                      const formatFileSize = (bytes) => {
                        if (bytes === 0) return '0 Bytes';
                        const k = 1024;
                        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                        const i = Math.floor(Math.log(bytes) / Math.log(k));
                        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                      };

                      // Определяем тип файла по расширению, если MIME-тип неправильный
                      const getFileTypeFromName = (filename) => {
                        if (!filename || typeof filename !== 'string') return 'other';
                        const ext = filename.toLowerCase().split('.').pop();
                        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];
                        const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'ogv'];
                        const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'];
                        if (imageExts.includes(ext)) return 'image';
                        if (videoExts.includes(ext)) return 'video';
                        if (audioExts.includes(ext)) return 'audio';
                        return 'other';
                      };
                      
                      const fileName = file.filename || file.originalName || file.name || '';
                      const fileType = file.mimetype || file.type;
                      const fileTypeFromName = getFileTypeFromName(fileName);
                      const isImage = (fileType && fileType.startsWith('image/')) || fileTypeFromName === 'image';
                      const isVideo = (fileType && fileType.startsWith('video/')) || fileTypeFromName === 'video';
                      const isAudio = (fileType && fileType.startsWith('audio/')) || fileTypeFromName === 'audio';

                      if (isImage) {
                        return (
                          <div key={fileIndex} className="mt-2">
                            <div className="relative group">
                              <div className="relative">
                                <img
                                  src={`http://10.185.101.19:8080${file.url}`}
                                  alt={displayName}
                                  className="max-w-sm max-h-80 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:scale-[1.02]"
                                  onClick={() => openImageModal(`http://10.185.101.19:8080${file.url}`, displayName)}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                  loading="lazy"
                                />
                                {/* Overlay с информацией о файле */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="text-white text-xs">
                                    <div className="font-medium truncate">{displayName}</div>
                                    <div className="text-white/80">{formatFileSize(file.size)}</div>
                                  </div>
                                </div>
                              </div>
                              {/* Fallback для не загрузившихся изображений */}
                              <div 
                                className="hidden items-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                style={{ display: 'none' }}
                              >
                                <span className="text-2xl mr-3 select-none">
                                  {getFileIcon(fileType)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {displayName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </div>
                                </div>
                                <a
                                  href={`http://10.185.101.19:8080${file.url}`}
                                  download={displayName}
                                  className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <svg className="w-4 h-4 select-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (isVideo) {
                        return (
                          <div key={fileIndex} className="mt-2">
                            <div className="relative group">
                              <div className="relative">
                                <video
                                  src={`http://10.185.101.19:8080${file.url}`}
                                  controls
                                  className="max-w-sm max-h-80 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 hover:scale-[1.01]"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                  preload="metadata"
                                >
                                  Ваш браузер не поддерживает видео.
                                </video>
                                {/* Overlay с информацией о файле */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="text-white text-xs">
                                    <div className="font-medium truncate">{displayName}</div>
                                    <div className="text-white/80">{formatFileSize(file.size)}</div>
                                  </div>
                                </div>
                              </div>
                              {/* Fallback для не загрузившихся видео */}
                              <div 
                                className="hidden items-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                style={{ display: 'none' }}
                              >
                                <span className="text-2xl mr-3 select-none">
                                  {getFileIcon(fileType)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {displayName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </div>
                                </div>
                                <a
                                  href={`http://10.185.101.19:8080${file.url}`}
                                  download={displayName}
                                  className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <svg className="w-4 h-4 select-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (isAudio) {
                        return (
                          <div key={fileIndex} className="mt-2">
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex-shrink-0 mr-3">
                                <span className="text-2xl">🎵</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate mb-1">
                                  {displayName}
                                </div>
                                <audio
                                  controls
                                  className="w-full h-8"
                                  preload="metadata"
                                >
                                  <source src={`http://10.185.101.19:8080${file.url}`} type={fileType || 'audio/mpeg'} />
                                  Ваш браузер не поддерживает аудио.
                                </audio>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatFileSize(file.size)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={fileIndex} 
                          className="flex items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                          onClick={() => handleFileDownload(`http://10.185.101.19:8080${file.url}`, displayName)}
                        >
                          <span className="text-lg mr-3">
                            {getFileIcon(file.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {displayName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </div>
                          </div>
                          <div className="ml-2 text-gray-400">
                            <svg className="w-4 h-4 select-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className={`flex items-center text-xs select-none mt-1 ${
                  isCurrentUserMessage(msg) ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {msg.edited && <span className="mr-2 opacity-75">Изменено</span>}
                  <span>{new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Выберите чат, чтобы начать общение
        </div>
      )}
      
      {/* Модальное окно для просмотра изображений */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        imageUrl={imageModal.url}
        imageAlt={imageModal.alt}
      />
    </>
  );
};

export default ChatMessages;