import React from 'react';

const ForwardModal = ({ showForwardModal, setShowForwardModal, setForwardMessage, chats, handleForwardToChat }) => {
  return (
    <>
      {showForwardModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Переслать сообщение</h3>
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.chatId}
                  className="p-2 rounded cursor-pointer hover:bg-gray-200"
                  onClick={() => handleForwardToChat(chat.chatId)}
                >
                  {chat.name}
                </div>
              ))}
            </div>
            <button
              className="mt-4 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
              onClick={() => {
                setShowForwardModal(false);
                setForwardMessage(null);
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ForwardModal;