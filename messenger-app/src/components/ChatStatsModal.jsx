import React, { useEffect, useRef, useState } from 'react';

const ChatStatsModal = ({ isOpen, onClose, selectedChat, messages, users }) => {
  const modalRef = useRef(null);
  const [chatStats, setChatStats] = useState({ photos: 0, videos: 0, audio: 0, files: 0, links: 0, messages: 0 });

  // Обработчик ESC для закрытия модального окна
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Функция для подсчета общей статистики чата
  const getChatStats = () => {
    if (!selectedChat || !messages[selectedChat.chatId]) {
      return { photos: 0, videos: 0, audio: 0, files: 0, links: 0, messages: 0 };
    }

    const chatMessages = messages[selectedChat.chatId];
    let photos = 0;
    let videos = 0;
    let audio = 0;
    let files = 0;
    let links = 0;
    let messageCount = 0;

    chatMessages.forEach(message => {
      messageCount++;
      
      if (message.files && message.files.length > 0) {
        message.files.forEach(file => {
          const fileType = file.mimetype || file.type || '';
          const fileName = file.filename || file.originalName || file.name || '';
          
          if (fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)$/i.test(fileName)) {
            photos++;
          } else if (fileType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|webm|mkv|3gp|ogv)$/i.test(fileName)) {
            videos++;
          } else if (fileType.startsWith('audio/') || /\.(mp3|wav|ogg|flac|aac|m4a|wma|opus)$/i.test(fileName)) {
            audio++;
          } else {
            files++;
          }
        });
      }

      // Подсчет ссылок в тексте сообщений
      if (message.text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const foundLinks = message.text.match(urlRegex);
        if (foundLinks) {
          links += foundLinks.length;
        }
      }
    });

    return { photos, videos, audio, files, links, messages: messageCount };
  };

  // Обновляем статистику при изменении сообщений или выбранного чата
  useEffect(() => {
    const stats = getChatStats();
    setChatStats(stats);
  }, [messages, selectedChat]);

  // Обработчик клика вне области модального окна
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen || !selectedChat) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Информация о чате
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* Информация о чате */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedChat.name}
            </h3>
            <p className="text-gray-600 text-sm">
              {selectedChat.type === 'private' ? 'Личный чат' : 
               selectedChat.type === 'group' ? 'Групповой чат' :
               selectedChat.type === 'favorites' ? 'Избранное' : 'Чат'}
            </p>
          </div>

          {/* Статистика чата */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Статистика чата</h4>
            <div className="grid grid-cols-2 gap-3 text-center mb-4">
              <div className="bg-white rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{chatStats.messages}</div>
                <div className="text-xs text-gray-500">Сообщений</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{chatStats.photos + chatStats.videos + chatStats.audio + chatStats.files}</div>
                <div className="text-xs text-gray-500">Файлов</div>
              </div>
            </div>
            
            {(chatStats.photos > 0 || chatStats.videos > 0 || chatStats.audio > 0 || chatStats.files > 0 || chatStats.links > 0) && (
              <div className="flex flex-wrap justify-center gap-2">
                {chatStats.photos > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    🖼️ {chatStats.photos}
                  </span>
                )}
                {chatStats.videos > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    🎥 {chatStats.videos}
                  </span>
                )}
                {chatStats.audio > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    🎵 {chatStats.audio}
                  </span>
                )}
                {chatStats.files > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                    📄 {chatStats.files}
                  </span>
                )}
                {chatStats.links > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                    🔗 {chatStats.links}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Участники чата */}
          {selectedChat.participants && selectedChat.participants.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Участники ({selectedChat.participants.length})</h4>
              <div className="space-y-2">
                {selectedChat.participants.map((participant, index) => {
                  const participantId = typeof participant === 'string' ? participant : participant.userId;
                  const userInfo = users.find(u => u.userId === participantId);
                  
                  return (
                    <div key={participantId || index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {userInfo?.avatar && userInfo.avatar !== 'null' && userInfo.avatar.trim() !== '' ? (
                          <img
                            src={userInfo.avatar.startsWith('http') ? userInfo.avatar : `http://10.185.101.19:8080${userInfo.avatar}`}
                            alt="Аватар"
                            className="w-full h-full object-cover object-center"
                            style={{ 
                              minWidth: '100%', 
                              minHeight: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold"
                          style={{ display: userInfo?.avatar && userInfo.avatar !== 'null' && userInfo.avatar.trim() !== '' ? 'none' : 'flex' }}
                        >
                          {userInfo ? (userInfo.firstName?.charAt(0)?.toUpperCase() || userInfo.username?.charAt(0)?.toUpperCase() || '?') : '?'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {userInfo ? 
                            (userInfo.firstName && userInfo.lastName ? 
                              `${userInfo.lastName} ${userInfo.firstName} ${userInfo.patronymic || ''}`.trim() :
                              userInfo.username || 'Неизвестный пользователь'
                            ) : 'Неизвестный пользователь'
                          }
                        </p>
                        <p className="text-xs text-gray-500">
                          @{userInfo?.username || 'unknown'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatStatsModal;
