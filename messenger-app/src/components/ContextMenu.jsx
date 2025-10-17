import React from 'react';
import { toast } from 'react-toastify';

const ContextMenu = ({
  contextMenu,
  setContextMenu,
  contextMenuRef,
  handleEditMessage,
  handleDeleteMessage,
  handleDeleteSelectedMessages,
  handleSelectMessage,
  handleForwardMessage,
  user,
  userId,
  users,
  selectedMessages,
  selectedChat,
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

  const handleDownloadFile = async (file) => {
    try {
      const fileName = file.filename || file.originalName || file.name || 'файл';
      const fileUrl = `http://10.185.101.19:8080${file.url}`;
      
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
      
      toast.success(`Скачивание файла: ${fileName}`);
      setContextMenu({ visible: false, x: 0, y: 0, message: null });
    } catch (error) {
      console.error('Ошибка скачивания файла:', error);
      toast.error('Ошибка скачивания файла');
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
  const isPrivateChat = selectedChat?.type === 'PRIVATE';

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
        {(isOwnMessage || isPrivateChat) && (
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
        {selectedMessages.length > 0 && (
          <li
            className="px-4 py-2 hover:bg-red-100 cursor-pointer text-red-600"
            onClick={() => {
              handleDeleteSelectedMessages();
              console.log('Выбрано удаление выделенных сообщений:', selectedMessages.length);
            }}
          >
            Удалить выделенные ({selectedMessages.length})
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
        {contextMenu.message.files && contextMenu.message.files.length > 0 && (
          <>
            {contextMenu.message.files.length === 1 ? (
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  handleDownloadFile(contextMenu.message.files[0]);
                  console.log('Скачивание файла:', contextMenu.message.files[0]);
                }}
              >
                Скачать файл
              </li>
            ) : (
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  contextMenu.message.files.forEach(file => handleDownloadFile(file));
                  console.log('Скачивание всех файлов:', contextMenu.message.files.length);
                }}
              >
                Скачать все файлы ({contextMenu.message.files.length})
              </li>
            )}
          </>
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