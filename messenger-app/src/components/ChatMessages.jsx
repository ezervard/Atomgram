import React, { useEffect, useState } from 'react';
import ImageModal from './ImageModal';

const ChatMessages = ({ user, userId, users, selectedChat, messages, selectedMessages, setContextMenu, handleMessageClick, messagesEndRef }) => {
  const [imageModal, setImageModal] = useState({ isOpen: false, url: '', alt: '' });

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
    try {
      // Пытаемся исправить кодировку, если имя содержит неправильно закодированные символы
      if (/Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ|Ð|Ñ/.test(fileName)) {
        return decodeURIComponent(escape(fileName));
      }
      return fileName;
    } catch (e) {
      return fileName;
    }
  };

  // Функция для рендеринга текста с поддержкой эмодзи
  const renderTextWithEmojis = (text) => {
    if (!text) return '';
    
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
      const response = await fetch(fileUrl);
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
      link.target = '_blank';
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
        <div className="flex-1 overflow-y-auto p-4 flex flex-col scroll-container">
          {/* Пустой div для прижатия сообщений к низу */}
          <div style={{ flex: 1, minHeight: 0 }}></div>
          {(messages[selectedChat.chatId] || [])
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .map((msg, index) => (
            <div
              key={msg._id || `temp-${index}`}
              className={`mb-4 ${isCurrentUserMessage(msg) ? 'text-right' : 'text-left'} message ${
                selectedMessages.includes(msg._id) ? 'message-selected' : ''
              }`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
              onClick={() => handleMessageClick(msg)}
            >
              <div
                className={`inline-block p-2 rounded-lg select-none ${
                  isCurrentUserMessage(msg) ? 'bg-blue-500 text-white' : 'bg-gray-200'
                } ${(msg.forwardedFrom || msg.originalMessage) ? 'border-l-4 border-blue-400' : ''}`}
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '70%' }}
              >
                <p className="message-username select-none">
                  {msg.fullName || msg.username || 'Неизвестный пользователь'}
                  {(msg.forwardedFrom || msg.originalMessage) && (
                    <span className="text-xs opacity-75 ml-1">📤</span>
                  )}
                </p>
                {msg.text && <p className="message-text select-text">{renderTextWithEmojis(msg.text)}</p>}
                {msg.files && msg.files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.files.map((file, fileIndex) => {
                      // Исправляем кодировку имени файла для отображения
                      const displayName = fixFileNameEncoding(file.name);
                      
                      const getFileIcon = (fileType) => {
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
                        const ext = filename.toLowerCase().split('.').pop();
                        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
                        const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
                        if (imageExts.includes(ext)) return 'image';
                        if (videoExts.includes(ext)) return 'video';
                        return 'other';
                      };
                      
                      const fileTypeFromName = getFileTypeFromName(file.name);
                      const isImage = (file.type && file.type.startsWith('image/')) || fileTypeFromName === 'image';
                      const isVideo = (file.type && file.type.startsWith('video/')) || fileTypeFromName === 'video';

                      if (isImage) {
                        return (
                          <div key={fileIndex} className="mt-2">
                            <div className="relative group">
                              <img
                                src={`такhttp://192.168.2.15:8080${file.url}`}
                                alt={displayName}
                                className="max-w-xs max-h-64 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                                onClick={() => openImageModal(`http://192.168.2.15:8080${file.url}`, displayName)}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div 
                                className="hidden items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                style={{ display: 'none' }}
                              >
                                <span className="text-lg mr-3 select-none">
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
                                <a
                                  href={`http://192.168.2.15:8080${file.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
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
                              <video
                                src={`http://192.168.2.15:8080${file.url}`}
                                controls
                                className="max-w-xs max-h-64 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              >
                                Ваш браузер не поддерживает видео.
                              </video>
                              <div 
                                className="hidden items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                style={{ display: 'none' }}
                              >
                                <span className="text-lg mr-3 select-none">
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
                                <a
                                  href={`http://192.168.2.15:8080${file.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
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

                      return (
                        <div 
                          key={fileIndex} 
                          className="flex items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                          onClick={() => handleFileDownload(`http://192.168.2.15:8080${file.url}`, displayName)}
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
                <div className="flex items-center text-xs text-gray-500 select-none">
                  {msg.edited && <span className="mr-4">Изменено</span>}
                  <span className="select-none">{new Date(msg.timestamp).toLocaleTimeString('ru-RU')}</span>
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