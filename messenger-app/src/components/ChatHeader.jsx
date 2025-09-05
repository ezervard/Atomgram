import React from 'react';

const ChatHeader = ({ selectedChat, selectedMessages, handleLogout }) => {
  return (
    <div className="bg-white p-4 border-b flex justify-between items-center">
      <h2 className="text-xl font-semibold">
        {selectedChat?.name || 'Выберите чат'}
        {selectedMessages.length > 0 && (
          <span className="ml-4 text-sm text-gray-500">
            Выделено: {selectedMessages.length}
          </span>
        )}
      </h2>
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