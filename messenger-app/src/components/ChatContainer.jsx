import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import MessageInput from './MessageInput';
import ContextMenu from './ContextMenu';
import ForwardModal from './ForwardModal';
import UserInfoModal from './UserInfoModal';
import ProfileEditModal from './ProfileEditModal';

const ChatContainer = ({
  user,
  userId,
  chats,
  users,
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
    // Сначала попробуем найти по userId, если user содержит userId
    const otherParticipantId = selectedChat.participants.find(id => {
      // Если user - это userId (число), сравниваем с id
      if (typeof user === 'string' && !isNaN(user)) {
        return id !== user;
      }
      // Если user - это fullName, ищем по fullName
      const currentUser = users.find(u => u.fullName === user);
      return currentUser ? id !== currentUser.userId : true;
    });
    
    const userInfo = users.find(u => u.userId === otherParticipantId);
    
    if (userInfo) {
      setSelectedUserInfo(userInfo);
      setShowUserInfoModal(true);
    }
  };

  const handleEditProfile = () => {
    // Находим текущего пользователя в списке users по userId
    const currentUser = users.find(u => u.userId === userId);
    
    if (currentUser) {
      setCurrentUserInfo(currentUser);
      setShowProfileEditModal(true);
    }
  };

  const handleSaveProfile = async (profileData) => {
    await updateProfile(profileData);
    setShowProfileEditModal(false);
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
        <ProfileEditModal
          isOpen={showProfileEditModal}
          onClose={() => setShowProfileEditModal(false)}
          userInfo={currentUserInfo}
          onSave={handleSaveProfile}
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