import React from 'react';

const ContextMenu = ({
  contextMenu,
  setContextMenu,
  contextMenuRef,
  handleEditMessage,
  handleDeleteMessage,
  handleSelectMessage,
  handleForwardMessage,
  user,
  selectedMessages,
}) => {
  if (!contextMenu.visible || !contextMenu.message) return null;

  const isOwnMessage = contextMenu.message.username === user;

  return (
    <div
      ref={contextMenuRef}
      className="absolute bg-white shadow-lg rounded-md border border-gray-200 z-50"
      style={{ top: contextMenu.y, left: contextMenu.x }}
    >
      <ul className="py-1">
        {isOwnMessage && (
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              handleEditMessage();
              console.log('Выбрано редактирование сообщения:', contextMenu.message);
            }}
          >
            Редактировать
          </li>
        )}
        {isOwnMessage && (
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              handleDeleteMessage();
              console.log('Выбрано удаление сообщения:', contextMenu.message);
            }}
          >
            Удалить
          </li>
        )}
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            handleSelectMessage();
            console.log('Выбрано выделение сообщения:', contextMenu.message);
          }}
        >
          {selectedMessages.includes(contextMenu.message._id) ? 'Снять выделение' : 'Выделить'}
        </li>
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            handleForwardMessage();
            console.log('Выбрана пересылка сообщения:', contextMenu.message);
          }}
        >
          Переслать
        </li>
      </ul>
    </div>
  );
};

export default ContextMenu;