import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apolloClient from './lib/apolloClient';
import useChatGraphQL from './hooks/useChatGraphQL';
import ChatContainer from './components/ChatContainer';
import AuthContainer from './components/AuthContainer';
import './index.css';

function App() {
  const {
    user,
    isLogin,
    setIsLogin,
    formData,
    setFormData,
    handleFormSubmit,
    handleInputChange,
    userId,
    token,
    messages,
    input,
    setInput,
    selectedChat,
    setSelectedChat,
    users,
    setUsers,
    chats,
    showAddressBook,
    setShowAddressBook,
    showEmojiPicker,
    setShowEmojiPicker,
    isSendButtonPressed,
    setIsSendButtonPressed,
    isEmojiButtonHovered,
    setIsEmojiButtonHovered,
    contextMenu,
    setContextMenu,
    showForwardModal,
    setShowForwardModal,
    forwardMessage,
    setForwardMessage,
    editingMessage,
    setEditingMessage,
    selectedMessages,
    setSelectedMessages,
    files,
    setFiles,
    removeFile,
    uploadProgress,
    isUploading,
    unreadCounts,
    messagesEndRef,
    inputRef,
    emojiButtonRef,
    emojiPickerRef,
    contextMenuRef,
    mouseLeaveTimeoutRef,
    fileInputRef,
    createPrivateChat,
    handleLogout,
    handleMessageClick,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
           handleDeleteMessage,
           handleDeleteSelectedMessages,
           handleSelectMessage,
           handleForwardMessage,
    handleForwardToChat,
    sendMessage,
    handleKeyDown,
    handleInput,
    handleEmojiClick,
    handleSendButtonMouseDown,
    handleSendButtonMouseUp,
    handleFileChange,
    updateProfile,
    notificationSound,
  } = useChatGraphQL();

  return (
    <ApolloProvider client={apolloClient}>
      {user ? (
        <ChatContainer
          user={user}
          userId={userId}
          chats={chats}
          users={users}
          setUsers={setUsers}
          selectedChat={selectedChat}
          showAddressBook={showAddressBook}
          setShowAddressBook={setShowAddressBook}
          setSelectedChat={setSelectedChat}
          createPrivateChat={createPrivateChat}
                 selectedMessages={selectedMessages}
                 setSelectedMessages={setSelectedMessages}
                 handleLogout={handleLogout}
                 messages={messages}
          handleMessageClick={handleMessageClick}
          messagesEndRef={messagesEndRef}
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
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          contextMenuRef={contextMenuRef}
          handleEditMessage={handleEditMessage}
                 handleDeleteMessage={handleDeleteMessage}
                 handleDeleteSelectedMessages={handleDeleteSelectedMessages}
                 handleSelectMessage={handleSelectMessage}
                 handleForwardMessage={handleForwardMessage}
          showForwardModal={showForwardModal}
          setShowForwardModal={setShowForwardModal}
          setForwardMessage={setForwardMessage}
          handleForwardToChat={handleForwardToChat}
          files={files}
          setFiles={setFiles}
          removeFile={removeFile}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
          updateProfile={updateProfile}
          unreadCounts={unreadCounts}
          notificationSound={notificationSound}
        />
      ) : (
        <AuthContainer
          isLogin={isLogin}
          setIsLogin={setIsLogin}
          formData={formData}
          setFormData={setFormData}
          handleFormSubmit={handleFormSubmit}
          handleInputChange={handleInputChange}
        />
      )}
      <ToastContainer />
    </ApolloProvider>
  );
}

export default App;