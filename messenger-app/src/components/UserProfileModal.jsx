import React, { useEffect, useRef } from 'react';

const UserProfileModal = ({ isOpen, onClose, userInfo, onEdit, isCurrentUser, onLogout }) => {
  const modalRef = useRef(null);
  
  // Обработчик ESC для закрытия модального окна
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);
  
  if (!isOpen || !userInfo) return null;
  
  console.log('UserProfileModal: отображаем профиль:', userInfo);
  console.log('UserProfileModal: isCurrentUser:', isCurrentUser);
  console.log('UserProfileModal: avatar URL:', userInfo?.avatar);

  // Обработчик клика вне области модального окна
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Неизвестно';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('online') || statusLower.includes('онлайн')) {
      return 'В сети';
    } else if (statusLower.includes('offline') || statusLower.includes('офлайн')) {
      return 'Не в сети';
    } else if (statusLower.includes('away') || statusLower.includes('отошел')) {
      return 'Отошел';
    } else if (statusLower.includes('busy') || statusLower.includes('занят')) {
      return 'Занят';
    }
    return status;
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-gray-500';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('online') || statusLower.includes('онлайн')) {
      return 'text-green-600';
    } else if (statusLower.includes('offline') || statusLower.includes('офлайн')) {
      return 'text-gray-500';
    } else if (statusLower.includes('away') || statusLower.includes('отошел')) {
      return 'text-yellow-600';
    } else if (statusLower.includes('busy') || statusLower.includes('занят')) {
      return 'text-red-600';
    }
    return 'text-gray-500';
  };

  const getStatusDot = (status) => {
    if (!status) return 'bg-gray-400';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('online') || statusLower.includes('онлайн')) {
      return 'bg-green-500';
    } else if (statusLower.includes('offline') || statusLower.includes('офлайн')) {
      return 'bg-gray-400';
    } else if (statusLower.includes('away') || statusLower.includes('отошел')) {
      return 'bg-yellow-500';
    } else if (statusLower.includes('busy') || statusLower.includes('занят')) {
      return 'bg-red-500';
    }
    return 'bg-gray-400';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Информация
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* Аватар и основная информация */}
        <div className="p-6 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shadow-lg">
              {userInfo.avatar && userInfo.avatar !== 'null' && userInfo.avatar.trim() !== '' ? (
                <img
                  src={userInfo.avatar.startsWith('http') ? userInfo.avatar : `http://10.185.101.19:8080${userInfo.avatar}`}
                  alt="Аватар"
                  className="w-full h-full object-cover object-center"
                  style={{ 
                    minWidth: '100%', 
                    minHeight: '100%',
                    objectFit: 'cover'
                  }}
                  onLoad={() => {
                    console.log('Аватар успешно загружен:', userInfo.avatar);
                  }}
                  onError={(e) => {
                    console.log('Ошибка загрузки аватара:', userInfo.avatar);
                    console.log('Полный URL:', userInfo.avatar.startsWith('http') ? userInfo.avatar : `http://10.185.101.19:8080${userInfo.avatar}`);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                  {userInfo.firstName ? userInfo.firstName.charAt(0).toUpperCase() : 
                   userInfo.username ? userInfo.username.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            {/* Статус онлайн */}
            <div className={`absolute bottom-0 right-0 w-6 h-6 ${getStatusDot(userInfo.status)} rounded-full border-2 border-white`}></div>
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {userInfo.firstName && userInfo.lastName 
              ? `${userInfo.lastName} ${userInfo.firstName} ${userInfo.patronymic || ''}`.trim()
              : userInfo.username || 'Пользователь'
            }
          </h3>

          <p className={`text-sm font-medium ${getStatusColor(userInfo.status)} mb-4`}>
            {getStatusText(userInfo.status)}
          </p>

          {userInfo.username && (
            <p className="text-gray-600 text-sm mb-4">
              @{userInfo.username}
            </p>
          )}
        </div>


        {/* Детальная информация */}
        <div className="px-6 pb-6 space-y-4">
          {userInfo.email && (
            <div className="flex items-center space-x-3 py-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-800">{userInfo.email}</p>
              </div>
            </div>
          )}

          {userInfo.firstName && (
            <div className="flex items-center space-x-3 py-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Имя</p>
                <p className="text-gray-800">{userInfo.firstName}</p>
              </div>
            </div>
          )}

          {userInfo.lastName && (
            <div className="flex items-center space-x-3 py-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Фамилия</p>
                <p className="text-gray-800">{userInfo.lastName}</p>
              </div>
            </div>
          )}

          {userInfo.patronymic && (
            <div className="flex items-center space-x-3 py-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Отчество</p>
                <p className="text-gray-800">{userInfo.patronymic}</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 py-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Статус</p>
              <p className={`font-medium ${getStatusColor(userInfo.status)}`}>
                {getStatusText(userInfo.status)}
              </p>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-200">
          {isCurrentUser ? (
            <div className="space-y-2">
              <button
                onClick={onEdit}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Редактировать профиль
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Выйти из аккаунта
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                Написать сообщение
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                Позвонить
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
