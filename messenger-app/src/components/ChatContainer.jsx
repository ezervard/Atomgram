import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import MessageInput from './MessageInput';
import ContextMenu from './ContextMenu';
import ForwardModal from './ForwardModal';
import UserInfoModal from './UserInfoModal';
import UserProfileModal from './UserProfileModal';
import ChatStatsModal from './ChatStatsModal';
import MessageSearch from './MessageSearch';
import ProfileEditModal from './ProfileEditModal';

const ChatContainer = ({
  user,
  userId,
  chats,
  users,
  setUsers,
  selectedChat,
  showAddressBook,
  setShowAddressBook,
  setSelectedChat,
  createPrivateChat,
  selectedMessages,
  setSelectedMessages,
  handleLogout,
  messages,
  handleMessageClick,
  messagesEndRef,
  input,
  setInput,
  inputRef,
  editingMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  isSendButtonPressed,
  setIsSendButtonPressed,
  isEmojiButtonHovered,
  setIsEmojiButtonHovered,
  emojiButtonRef,
  emojiPickerRef,
  mouseLeaveTimeoutRef,
  handleEmojiClick,
  handleSendButtonMouseDown,
  handleSendButtonMouseUp,
  handleKeyDown,
  handleInput,
  handleCancelEdit,
  sendMessage,
  contextMenu,
  setContextMenu,
  contextMenuRef,
  handleEditMessage,
  handleDeleteMessage,
  handleDeleteSelectedMessages,
  handleSelectMessage,
  handleForwardMessage,
  showForwardModal,
  setShowForwardModal,
  setForwardMessage,
  handleForwardToChat,
  files,
  setFiles,
  removeFile,
  fileInputRef,
  handleFileChange,
  uploadProgress,
  isUploading,
  updateProfile,
  unreadCounts,
}) => {
  console.log('ChatContainer: Рендеринг с selectedChat:', selectedChat?.chatId);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showChatStatsModal, setShowChatStatsModal] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  

  const handleContainerContextMenu = (e) => {
    e.preventDefault();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Проверяем, что мы действительно покинули контейнер, а не перешли к дочернему элементу
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileChange({ target: { files: droppedFiles } });
    }
  };

  const handleChatNameClick = () => {
    if (!selectedChat) return;
    
    // Показываем статистику чата
    console.log('Открываем статистику чата:', selectedChat.name);
    setShowChatStatsModal(true);
  };

  const handleSearchClick = () => {
    if (!selectedChat) return;
    
    // Показываем поиск по сообщениям
    console.log('Открываем поиск по сообщениям в чате:', selectedChat.name);
    setShowMessageSearch(true);
  };

  const handleSearchMessageClick = (message) => {
    // Устанавливаем ID сообщения для выделения и прокрутки
    console.log('Переходим к сообщению:', message);
    setHighlightedMessageId(message._id);
    
    // Закрываем модальное окно поиска
    setShowMessageSearch(false);
    
    // Очищаем выделение через 3 секунды
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 3000);
  };

  const handleEditProfile = () => {
    // Находим текущего пользователя в списке users по userId
    const currentUser = users.find(u => u.userId === userId);
    
    if (currentUser) {
      console.log('Открываем профиль текущего пользователя:', currentUser);
      setCurrentUserInfo(currentUser);
      setSelectedUserInfo(null); // Очищаем выбранного пользователя
      setShowUserProfileModal(true);
    } else {
      console.log('Текущий пользователь не найден в списке users');
    }
  };

  const handleEditProfileFromModal = () => {
    setShowUserProfileModal(false);
    setShowProfileEditModal(true);
  };

  const handleSaveProfile = async (profileData, avatarFile) => {
    try {
      // Если есть файл аватара, загружаем его сначала
      if (avatarFile) {
        console.log('Загружаем аватар:', avatarFile);
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://10.185.101.19:8080'}/auth/avatar`.replace('https://', 'http://'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Ошибка загрузки аватара');
        }

        const avatarData = await response.json();
        console.log('Аватар успешно загружен:', avatarData);
        
        // Обновляем аватар в UI
        handleAvatarUpdate(avatarData.avatar);
      }
      
      // Сохраняем данные профиля
      await updateProfile(profileData);
      setShowProfileEditModal(false);
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      throw error;
    }
  };

  const handleAvatarUpdate = (avatarUrl) => {
    console.log('Обновляем аватар:', avatarUrl);
    // Сохраняем аватар в localStorage
    localStorage.setItem('avatarPreview', avatarUrl);
    console.log('Аватар сохранен в localStorage в handleAvatarUpdate');
    
    // Обновляем аватар в списке пользователей
    setUsers(prevUsersData => {
      if (!prevUsersData?.users) return prevUsersData;
      
      return {
        ...prevUsersData,
        users: prevUsersData.users.map(u => 
          u.userId === currentUserInfo?.userId ? { ...u, avatar: avatarUrl } : u
        )
      };
    });
    
    // Обновляем currentUserInfo
    if (currentUserInfo) {
      setCurrentUserInfo({ ...currentUserInfo, avatar: avatarUrl });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        console.log('Клик вне контекстного меню, закрытие');
        setContextMenu({ visible: false, x: 0, y: 0, message: null });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu, setContextMenu]);

  return (
    <div 
      className={`flex h-screen bg-gray-100 chat-container ${isDragOver ? 'bg-blue-50' : ''}`}
      onContextMenu={handleContainerContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Sidebar
        chats={chats}
        users={users}
        selectedChat={selectedChat}
        showAddressBook={showAddressBook}
        setShowAddressBook={setShowAddressBook}
        setSelectedChat={setSelectedChat}
        createPrivateChat={createPrivateChat}
        onEditProfile={handleEditProfile}
        unreadCounts={unreadCounts}
        userId={userId}
      />
      <div className="flex-1 flex flex-col relative">
        {/* Drag & Drop индикация */}
        {isDragOver && (
          <div className="absolute inset-0 z-50 bg-blue-500 bg-opacity-20 flex items-center justify-center pointer-events-none">
            <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-dashed border-blue-400 text-center">
              <div className="text-4xl mb-2">📎</div>
              <div className="text-lg font-medium text-blue-600">
                Отпустите файлы для загрузки
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Файлы будут добавлены к сообщению
              </div>
            </div>
          </div>
        )}
        
        <ChatHeader
          selectedChat={selectedChat}
          selectedMessages={selectedMessages}
          onChatNameClick={handleChatNameClick}
          onSearchClick={handleSearchClick}
        />
        <div className="flex-1 overflow-hidden">
               <ChatMessages
                 user={user}
                 userId={userId}
                 users={users}
                 selectedChat={selectedChat}
                 messages={messages}
                 selectedMessages={selectedMessages}
                 setSelectedMessages={setSelectedMessages}
                 setContextMenu={setContextMenu}
                 handleMessageClick={handleMessageClick}
                 messagesEndRef={messagesEndRef}
                 highlightedMessageId={highlightedMessageId}
               />
        </div>
               <ContextMenu
                 contextMenu={contextMenu}
                 setContextMenu={setContextMenu}
                 contextMenuRef={contextMenuRef}
                 handleEditMessage={handleEditMessage}
                 handleDeleteMessage={handleDeleteMessage}
                 handleDeleteSelectedMessages={handleDeleteSelectedMessages}
                 handleSelectMessage={handleSelectMessage}
                 handleForwardMessage={handleForwardMessage}
                 user={user}
                 userId={userId}
                 users={users}
                 selectedMessages={selectedMessages}
                 selectedChat={selectedChat}
               />
        <ForwardModal
          showForwardModal={showForwardModal}
          setShowForwardModal={setShowForwardModal}
          setForwardMessage={setForwardMessage}
          chats={chats}
          handleForwardToChat={handleForwardToChat}
        />
        <UserInfoModal
          isOpen={showUserInfoModal}
          onClose={() => setShowUserInfoModal(false)}
          userInfo={selectedUserInfo}
        />
               <UserProfileModal
                 isOpen={showUserProfileModal}
                 onClose={() => setShowUserProfileModal(false)}
                 userInfo={selectedUserInfo || currentUserInfo}
                 onEdit={handleEditProfileFromModal}
                 isCurrentUser={selectedUserInfo ? selectedUserInfo.userId === currentUserInfo?.userId : true}
                 onLogout={handleLogout}
               />
        <ChatStatsModal
          isOpen={showChatStatsModal}
          onClose={() => setShowChatStatsModal(false)}
          selectedChat={selectedChat}
          messages={messages}
          users={users}
        />
        <ProfileEditModal
          isOpen={showProfileEditModal}
          onClose={() => setShowProfileEditModal(false)}
          userInfo={currentUserInfo}
          onSave={handleSaveProfile}
          onAvatarUpdate={handleAvatarUpdate}
        />
        {selectedChat && (
          <MessageInput
            input={input}
            setInput={setInput}
            inputRef={inputRef}
            editingMessage={editingMessage}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            isSendButtonPressed={isSendButtonPressed}
            setIsSendButtonPressed={setIsSendButtonPressed}
            isEmojiButtonHovered={isEmojiButtonHovered}
            setIsEmojiButtonHovered={setIsEmojiButtonHovered}
            emojiButtonRef={emojiButtonRef}
            emojiPickerRef={emojiPickerRef}
            mouseLeaveTimeoutRef={mouseLeaveTimeoutRef}
            handleEmojiClick={handleEmojiClick}
            handleSendButtonMouseDown={handleSendButtonMouseDown}
            handleSendButtonMouseUp={handleSendButtonMouseUp}
            handleKeyDown={handleKeyDown}
            handleInput={handleInput}
            handleCancelEdit={handleCancelEdit}
            sendMessage={sendMessage}
            user={user}
            files={files}
            setFiles={setFiles}
            removeFile={removeFile}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
          />
        )}
      </div>
      
      {/* Поиск по сообщениям */}
      <MessageSearch
        isOpen={showMessageSearch}
        onClose={() => setShowMessageSearch(false)}
        messages={messages}
        selectedChat={selectedChat}
        users={users}
        onMessageClick={handleSearchMessageClick}
      />
    </div>
  );
};

export default ChatContainer;