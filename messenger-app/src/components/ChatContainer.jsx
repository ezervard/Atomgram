import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import MessageInput from './MessageInput';
import ContextMenu from './ContextMenu';
import ForwardModal from './ForwardModal';
import UserInfoModal from './UserInfoModal';
import UserProfileModal from './UserProfileModal';
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
}) => {
  console.log('ChatContainer: Рендеринг с selectedChat:', selectedChat?.chatId);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  

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
    
    // Находим пользователя, с которым ведется чат
    // Ищем участника чата, который не является текущим пользователем
    const otherParticipantId = selectedChat.participants.find(id => id !== userId);
    
    const userInfo = users.find(u => u.userId === otherParticipantId);
    
    if (userInfo) {
      console.log('Открываем профиль собеседника:', userInfo);
      setSelectedUserInfo(userInfo);
      setShowUserProfileModal(true);
    } else {
      console.log('Собеседник не найден в списке пользователей');
    }
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
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://192.168.2.15:8080'}/auth/avatar`, {
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
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.userId === currentUserInfo?.userId ? { ...u, avatar: avatarUrl } : u
      )
    );
    
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
          handleLogout={handleLogout}
          onChatNameClick={handleChatNameClick}
        />
        <ChatMessages
          user={user}
          userId={userId}
          users={users}
          selectedChat={selectedChat}
          messages={messages}
          selectedMessages={selectedMessages}
          setContextMenu={setContextMenu}
          handleMessageClick={handleMessageClick}
          messagesEndRef={messagesEndRef}
        />
        <ContextMenu
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          contextMenuRef={contextMenuRef}
          handleEditMessage={handleEditMessage}
          handleDeleteMessage={handleDeleteMessage}
          handleSelectMessage={handleSelectMessage}
          handleForwardMessage={handleForwardMessage}
          user={user}
          userId={userId}
          users={users}
          selectedMessages={selectedMessages}
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
    </div>
  );
};

export default ChatContainer;