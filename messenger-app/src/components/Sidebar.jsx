import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({
  chats,
  users,
  selectedChat,
  showAddressBook,
  setShowAddressBook,
  setSelectedChat,
  createPrivateChat,
  onEditProfile,
  unreadCounts,
  userId,
}) => {
  const handleChatClick = (chat) => {
    setSelectedChat(chat);
    console.log('Выбран чат:', chat.chatId);
  };

  const handleUserClick = (userId) => {
    createPrivateChat(userId);
  };

  // Варианты анимации для элементов
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.1 } },
  };

  return (
    <div className="w-64 bg-gradient-to-br from-gray-800 to-gray-900 text-white border-r border-gray-700 shadow-2xl flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-600">
        <motion.button
          className="w-full text-left px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-300 flex items-center justify-between"
          onClick={() => setShowAddressBook(!showAddressBook)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center">
            {showAddressBook ? (
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            )}
            {showAddressBook ? 'Чаты' : 'Адресная книга'}
          </span>
          <motion.div
            animate={{ rotate: showAddressBook ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        </motion.button>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <AnimatePresence>
          {showAddressBook ? (
            users.map((user) => {
              console.log('Sidebar: Пользователь', user.fullName, 'статус:', user.status, 'тип:', typeof user.status);
              return (
                <motion.div
                  key={user.userId}
                  className="px-4 py-3 hover:bg-gray-700/50 cursor-pointer rounded-md transition-all duration-200 flex items-center justify-between group"
                  onClick={() => handleUserClick(user.userId)}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(107, 114, 128, 0.7)' }}
                >
                  <span className="flex items-center">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-600 mr-2 flex items-center justify-center flex-shrink-0">
                      {user?.avatar && user.avatar !== 'null' && user.avatar.trim() !== '' ? (
                        <img
                          src={user.avatar.startsWith('http') ? user.avatar : `http://10.185.101.19:8080${user.avatar}`}
                          alt="Аватар"
                          className="w-full h-full object-cover object-center"
                          style={{ 
                            minWidth: '100%', 
                            minHeight: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            console.log('Sidebar: Ошибка загрузки аватара в адресной книге:', user.avatar);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold"
                        style={{ display: user?.avatar && user.avatar !== 'null' && user.avatar.trim() !== '' ? 'none' : 'flex' }}
                      >
                        {user ? (user.firstName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || '?') : '?'}
                      </div>
                    </div>
                    <span className="truncate">{user.fullName}</span>
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full transition-colors duration-200 ${
                    user.status && (user.status.toLowerCase().includes('онлайн') || user.status.toLowerCase().includes('online'))
                      ? 'bg-green-500/20 text-green-300 group-hover:bg-green-500/30' 
                      : 'bg-gray-500/20 text-gray-400 group-hover:bg-gray-500/30'
                  }`}>
                    {user.status}
                  </span>
                </motion.div>
              );
            })
          ) : (
            chats.length > 0 ? (
              chats.map((chat) => (
                <motion.div
                  key={chat.chatId}
                  className={`px-4 py-3 hover:bg-gray-700/50 cursor-pointer rounded-md transition-all duration-200 flex items-center ${
                    selectedChat && selectedChat.chatId === chat.chatId ? 'bg-blue-900/50 text-blue-200' : ''
                  }`}
                  onClick={() => handleChatClick(chat)}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{ scale: 1.02, backgroundColor: selectedChat && selectedChat.chatId === chat.chatId ? 'rgba(30, 64, 175, 0.7)' : 'rgba(107, 114, 128, 0.7)' }}
                >
                  <span className="flex-1 flex items-center min-w-0">
                    {chat.type !== 'favorites' && chat.type !== 'FAVORITES' ? (
                      // Показываем аватар для обычных чатов
                      (() => {
                        // Находим собеседника (не текущего пользователя)
                        // Для частных чатов участников должно быть 2: текущий пользователь и собеседник
                        if (chat.participants && chat.participants.length >= 2) {
                          // Берем первого участника, который не является текущим пользователем
                          // Предполагаем, что текущий пользователь всегда в списке участников
                          const otherParticipantId = chat.participants.find(participant => {
                            const participantId = typeof participant === 'string' ? participant : participant.userId;
                            return participantId !== userId;
                          });
                          
                          if (otherParticipantId) {
                            const participantId = typeof otherParticipantId === 'string' ? otherParticipantId : otherParticipantId.userId;
                            const userInfo = users.find(u => u.userId === participantId);
                            
                            console.log('Sidebar: Найден участник для аватара:', userInfo);
                            
                            return (
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-600 mr-2 flex items-center justify-center flex-shrink-0">
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
                                      console.log('Sidebar: Ошибка загрузки аватара:', userInfo.avatar);
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold"
                                  style={{ display: userInfo?.avatar && userInfo.avatar !== 'null' && userInfo.avatar.trim() !== '' ? 'none' : 'flex' }}
                                >
                                  {userInfo ? (userInfo.firstName?.charAt(0)?.toUpperCase() || userInfo.username?.charAt(0)?.toUpperCase() || '?') : '?'}
                                </div>
                              </div>
                            );
                          }
                        }
                        
                        // Fallback - иконка пользователя
                        return (
                          <svg className="w-4 h-4 mr-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        );
                      })()
                    ) : (
                      // Для чата "Избранное" ничего не показываем
                      null
                    )}
                    <span className="truncate">{chat.name || chat.chatId}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCounts[chat.chatId] > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-semibold">
                        {unreadCounts[chat.chatId] > 99 ? '99+' : unreadCounts[chat.chatId]}
                      </span>
                    )}
                    {selectedChat && selectedChat.chatId === chat.chatId && (
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                className="px-4 py-3 text-gray-400"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                Нет доступных чатов
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
      
      {/* Кнопка редактирования профиля */}
      <div className="p-4 border-t border-gray-600">
        <motion.button
          className="w-full text-left px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 flex items-center"
          onClick={onEditProfile}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          Профиль
        </motion.button>
      </div>
    </div>
  );
};

export default Sidebar;