// Утилита для воспроизведения звука уведомлений

class NotificationSound {
  constructor() {
    this.audio = null;
    this.isEnabled = true;
    this.volume = 0.7;
    this.initAudio();
  }

  initAudio() {
    try {
      // Создаем аудио элемент для воспроизведения звука
      this.audio = new Audio('/sounds/message.mp3');
      this.audio.volume = this.volume;
      this.audio.preload = 'auto';
      
      // Обработчик ошибок загрузки
      this.audio.addEventListener('error', (e) => {
        console.warn('Не удалось загрузить звук уведомления:', e);
      });

      // Обработчик успешной загрузки
      this.audio.addEventListener('canplaythrough', () => {
        console.log('Звук уведомления готов к воспроизведению');
      });
    } catch (error) {
      console.warn('Ошибка инициализации звука уведомления:', error);
    }
  }

  // Воспроизведение звука
  play() {
    if (!this.isEnabled || !this.audio) {
      return;
    }

    try {
      // Сбрасываем позицию воспроизведения
      this.audio.currentTime = 0;
      
      // Воспроизводим звук
      this.audio.play().catch(error => {
        console.warn('Не удалось воспроизвести звук уведомления:', error);
      });
    } catch (error) {
      console.warn('Ошибка воспроизведения звука:', error);
    }
  }

  // Включение/выключение звука
  setEnabled(enabled) {
    this.isEnabled = enabled;
    // Сохраняем настройку в localStorage
    localStorage.setItem('notificationSoundEnabled', enabled.toString());
  }

  // Установка громкости
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    // Сохраняем настройку в localStorage
    localStorage.setItem('notificationSoundVolume', this.volume.toString());
  }

  // Загрузка настроек из localStorage
  loadSettings() {
    const enabled = localStorage.getItem('notificationSoundEnabled');
    if (enabled !== null) {
      this.isEnabled = enabled === 'true';
    }

    const volume = localStorage.getItem('notificationSoundVolume');
    if (volume !== null) {
      this.setVolume(parseFloat(volume));
    }
  }

  // Проверка поддержки автовоспроизведения
  async checkAutoplaySupport() {
    if (!this.audio) return false;

    try {
      // Пытаемся воспроизвести тихий звук для проверки автовоспроизведения
      const testAudio = this.audio.cloneNode();
      testAudio.volume = 0.01;
      await testAudio.play();
      testAudio.pause();
      return true;
    } catch (error) {
      console.warn('Автовоспроизведение заблокировано браузером:', error);
      return false;
    }
  }

  // Воспроизведение с проверкой автовоспроизведения
  async playWithFallback() {
    if (!this.isEnabled || !this.audio) {
      return;
    }

    try {
      await this.audio.play();
    } catch (error) {
      // Если автовоспроизведение заблокировано, показываем уведомление пользователю
      if (error.name === 'NotAllowedError') {
        console.info('Для воспроизведения звуков уведомлений требуется взаимодействие с пользователем');
        // Можно показать уведомление пользователю о необходимости кликнуть для активации звуков
      } else {
        console.warn('Ошибка воспроизведения звука:', error);
      }
    }
  }
}

// Создаем единственный экземпляр
const notificationSound = new NotificationSound();

// Загружаем настройки при инициализации
notificationSound.loadSettings();

export default notificationSound;
