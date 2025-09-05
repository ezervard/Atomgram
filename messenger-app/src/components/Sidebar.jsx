import React from 'react';
import { FaComments, FaUsers, FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({
  chats,
  users,
  selectedChat,
  showAddressBook,
  setShowAddressBook,
  setSelectedChat,
  createPrivateChat,
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
    <div className="w-64 bg-gradient-to-br from-gray-800 to-gray-900 text-white border-r border-gray-700 shadow-2xl flex flex-col h-full">
      <div className="p-4 border-b border-gray-600">
        <motion.button
          className="w-full text-left px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all duration-300 flex items-center justify-between"
          onClick={() => setShowAddressBook(!showAddressBook)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center">
            {showAddressBook ? <FaComments className="mr-2" /> : <FaUsers className="mr-2" />}
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
      <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                    <FaUser className="mr-2 text-gray-300" />
                    {user.fullName}
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
                  <span className="flex-1 flex items-center">
                    <FaUser className="mr-2 text-gray-300" />
                    {chat.name || chat.chatId}
                  </span>
                  {selectedChat && selectedChat.chatId === chat.chatId && (
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  )}
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
    </div>
  );
};

export default Sidebar;