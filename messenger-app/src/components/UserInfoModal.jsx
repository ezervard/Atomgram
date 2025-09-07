import React from 'react';

const UserInfoModal = ({ isOpen, onClose, userInfo }) => {
  if (!isOpen || !userInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Информация о пользователе</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-semibold">
                {userInfo.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium">{userInfo.fullName || 'Неизвестный пользователь'}</h3>
              <p className="text-sm text-gray-500">@{userInfo.username || 'username'}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Статус:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  userInfo.status && (userInfo.status.toLowerCase().includes('онлайн') || userInfo.status.toLowerCase().includes('online'))
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {userInfo.status || 'Не указан'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">ID пользователя:</span>
                <span className="text-sm font-mono text-gray-500">{userInfo.userId || 'Неизвестно'}</span>
              </div>
              
              {userInfo.email && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-sm">{userInfo.email}</span>
                </div>
              )}
              
              {userInfo.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Телефон:</span>
                  <span className="text-sm">{userInfo.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <button
              onClick={onClose}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal;
