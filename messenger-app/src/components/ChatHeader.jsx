import React from 'react';

const ChatHeader = ({ selectedChat, selectedMessages, handleLogout, onChatNameClick }) => {
  return (
    <div className="bg-white p-4 border-b flex justify-between items-center">
      <div className="flex items-center">
        <h2 
          className="text-xl font-semibold cursor-pointer hover:text-blue-600 transition-colors"
          onClick={onChatNameClick}
        >
          {selectedChat?.name || 'Выберите чат'}
        </h2>
        {selectedMessages.length > 0 && (
          <span className="ml-4 text-sm text-gray-500">
            Выделено: {selectedMessages.length}
          </span>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
      >
        Выйти
      </button>
    </div>
  );
};

export default ChatHeader;