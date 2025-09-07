import React from 'react';
import { toast } from 'react-toastify';

const ContextMenu = ({
  contextMenu,
  setContextMenu,
  contextMenuRef,
  handleEditMessage,
  handleDeleteMessage,
  handleSelectMessage,
  handleForwardMessage,
  user,
  userId,
  users,
  selectedMessages,
}) => {
  const handleCopyText = () => {
    if (contextMenu.message && contextMenu.message.text) {
      // Используем современный API с fallback
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(contextMenu.message.text).then(() => {
          console.log('Текст скопирован в буфер обмена');
          // Показываем уведомление
          toast.success('Текст скопирован в буфер обмена');
          setContextMenu({ visible: false, x: 0, y: 0, message: null });
        }).catch(err => {
          console.error('Ошибка копирования через clipboard API:', err);
          // Fallback для старых браузеров
          copyTextFallback(contextMenu.message.text);
        });
      } else {
        // Fallback для старых браузеров или небезопасного контекста
        copyTextFallback(contextMenu.message.text);
      }
    }
  };

  const copyTextFallback = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('Текст скопирован через fallback метод');
        // Показываем уведомление
        toast.success('Текст скопирован в буфер обмена');
      } else {
        console.error('Не удалось скопировать текст');
        toast.error('Не удалось скопировать текст');
      }
      setContextMenu({ visible: false, x: 0, y: 0, message: null });
    } catch (err) {
      console.error('Ошибка копирования текста:', err);
      setContextMenu({ visible: false, x: 0, y: 0, message: null });
    }
  };
  if (!contextMenu.visible || !contextMenu.message) return null;

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
      return msg.username === currentUserDisplayName;
    }
    return msg.username === user;
  };

  const isOwnMessage = isCurrentUserMessage(contextMenu.message);
  const isForwardedMessage = contextMenu.message.forwardedFrom || contextMenu.message.originalMessage;

  return (
    <div
      ref={contextMenuRef}
      className="fixed bg-white shadow-lg rounded-md border border-gray-200 z-50"
      style={{ 
        top: contextMenu.y, 
        left: Math.min(contextMenu.x, window.innerWidth - 200) // Предотвращаем выход за правый край
      }}
    >
      <ul className="py-1">
        {isOwnMessage && !isForwardedMessage && (
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
        {contextMenu.message.text && (
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={handleCopyText}
          >
            Копировать текст
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