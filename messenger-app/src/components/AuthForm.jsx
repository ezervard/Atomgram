import React from 'react';

const AuthForm = ({ isLogin, setIsLogin, formData, setFormData, handleFormSubmit }) => {
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">{isLogin ? 'Вход' : 'Регистрация'}</h2>
      <form onSubmit={handleFormSubmit}>
        {!isLogin && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700">Логин</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:outline-none"
                placeholder="Введите логин"
                autoComplete="username"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Имя</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:outline-none"
                placeholder="Введите имя"
                autoComplete="given-name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Фамилия</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:outline-none"
                placeholder="Введите фамилию"
                autoComplete="family-name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Отчество (необязательно)</label>
              <input
                type="text"
                name="patronymic"
                value={formData.patronymic}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:outline-none"
                placeholder="Введите отчество"
                autoComplete="additional-name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:outline-none"
                placeholder="Введите email"
                autoComplete="email"
              />
            </div>
          </>
        )}
        {isLogin && (
          <div className="mb-4">
            <label className="block text-gray-700">Логин</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:outline-none"
              placeholder="Введите логин"
              autoComplete="username"
            />
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700">Пароль</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-lg focus:outline-none"
            placeholder="Введите пароль"
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
        >
          {isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
        <button
          type="button"
          className="mt-2 text-blue-500 hover:underline"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;