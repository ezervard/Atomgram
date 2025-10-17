import React from 'react';

const ChatHeader = ({ selectedChat, selectedMessages, handleLogout, onChatNameClick, onSearchClick }) => {
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
          <span className="ml-4 text-sm text-blue-600 font-medium">
            Выделено: {selectedMessages.length}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {selectedChat && (
          <button
            onClick={onSearchClick}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
            title="Поиск по сообщениям"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;