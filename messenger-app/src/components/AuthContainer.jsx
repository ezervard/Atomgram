import React from 'react';
import AuthForm from './AuthForm';

const AuthContainer = ({ isLogin, setIsLogin, formData, setFormData, handleFormSubmit, handleInputChange }) => {
  return (
    <div className="flex h-screen bg-gray-100 chat-container items-center justify-center">
      <AuthForm
        isLogin={isLogin}
        setIsLogin={setIsLogin}
        formData={formData}
        setFormData={setFormData}
        handleFormSubmit={handleFormSubmit}
        handleInputChange={handleInputChange}
      />
    </div>
  );
};

export default AuthContainer;