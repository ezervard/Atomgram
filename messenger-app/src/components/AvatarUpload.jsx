import React, { useState, useRef, useEffect } from 'react';

const AvatarUpload = ({ currentAvatar, onAvatarChange, onAvatarUpdate, disabled = false }) => {
  const [preview, setPreview] = useState(() => {
    // Восстанавливаем из localStorage при инициализации
    const savedPreview = localStorage.getItem('avatarPreview');
    console.log('Инициализация AvatarUpload:');
    console.log('- savedPreview из localStorage:', savedPreview ? savedPreview.substring(0, 50) + '...' : 'null');
    console.log('- currentAvatar:', currentAvatar);
    console.log('- итоговый preview:', savedPreview || currentAvatar || null);
    return savedPreview || currentAvatar || null;
  });
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [croppedFile, setCroppedFile] = useState(() => {
    // Восстанавливаем обрезанный файл из localStorage
    const savedCroppedFile = localStorage.getItem('croppedFileData');
    if (savedCroppedFile) {
      try {
        const fileData = JSON.parse(savedCroppedFile);
        return new File([new Uint8Array(fileData.data)], fileData.name, { type: fileData.type });
      } catch (error) {
        console.error('Ошибка восстановления обрезанного файла:', error);
        return null;
      }
    }
    return null;
  });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
  const cropRef = useRef(null);

  // Обновляем preview при изменении currentAvatar
  useEffect(() => {
    console.log('useEffect currentAvatar изменился:', currentAvatar);
    if (currentAvatar) {
      setPreview(currentAvatar);
      // Сохраняем в localStorage при обновлении
      localStorage.setItem('avatarPreview', currentAvatar);
      console.log('Аватар сохранен в localStorage в useEffect');
    }
  }, [currentAvatar]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropImage(e.target.result);
        setShowCropModal(true);
        setScale(1);
        setPosition({ x: 0, y: 0 });
        // Автоматически обрезаем при открытии
        setTimeout(() => {
          handleCropImage();
        }, 100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setPreview(null);
    setCroppedFile(null);
    // Очищаем localStorage
    localStorage.removeItem('avatarPreview');
    localStorage.removeItem('croppedFileData');
    onAvatarChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleScaleChange = (e) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
    // Автоматически обрезаем при изменении масштаба
    setTimeout(() => {
      if (cropImage) {
        handleCropImage();
      }
    }, 50);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      setPosition(newPosition);
      // Автоматически обрезаем при перетаскивании
      setTimeout(() => {
        if (cropImage) {
          handleCropImage();
        }
      }, 50);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCropImage = () => {
    if (!cropImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const size = 200; // Размер итогового аватара
      canvas.width = size;
      canvas.height = size;
      
      // Вычисляем размеры контейнера (256x256)
      const containerSize = 256;
      
      // Вычисляем масштаб для заполнения контейнера (как object-cover)
      const scaleX = containerSize / img.width;
      const scaleY = containerSize / img.height;
      const coverScale = Math.max(scaleX, scaleY);
      
      // Применяем пользовательский масштаб к coverScale с небольшим уменьшением
      const finalScale = coverScale * scale * 0.9;
      
      // Вычисляем размеры изображения с учетом финального масштаба
      const scaledWidth = img.width * finalScale;
      const scaledHeight = img.height * finalScale;
      
      // Вычисляем смещение для центрирования (как object-cover)
      const offsetX = (scaledWidth - containerSize) / 2;
      const offsetY = (scaledHeight - containerSize) / 2;
      
      // Применяем пользовательское смещение
      const finalOffsetX = offsetX - position.x;
      const finalOffsetY = offsetY - position.y;
      
      // Вычисляем область обрезки в центре контейнера
      const cropX = (containerSize - size) / 2;
      const cropY = (containerSize - size) / 2;
      
      // Рисуем обрезанную область
      ctx.drawImage(
        img,
        (finalOffsetX + cropX) / finalScale, (finalOffsetY + cropY) / finalScale, 
        size / finalScale, size / finalScale,
        0, 0, size, size
      );
      
      // Создаем превью и сохраняем файл для загрузки
      const previewUrl = canvas.toDataURL('image/png', 0.9);
      console.log('Создаем превью аватара:', previewUrl.substring(0, 50) + '...');
      setPreview(previewUrl);
      // Сохраняем превью в localStorage
      localStorage.setItem('avatarPreview', previewUrl);
      console.log('Аватар сохранен в localStorage');
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'avatar.png', { type: 'image/png' });
          
          // Сохраняем файл в localStorage
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const fileData = {
              name: file.name,
              type: file.type,
              data: Array.from(new Uint8Array(arrayBuffer))
            };
            localStorage.setItem('croppedFileData', JSON.stringify(fileData));
          } catch (error) {
            console.error('Ошибка сохранения файла в localStorage:', error);
          }
          setCroppedFile(file);
        }
      }, 'image/png', 0.9);
    };
    
    img.src = cropImage;
  };

  const cancelCrop = () => {
    setShowCropModal(false);
    setCropImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const finishCrop = () => {
    setShowCropModal(false);
    if (onAvatarChange && croppedFile) {
      onAvatarChange(croppedFile);
    }
  };

  const displayAvatar = preview || currentAvatar;

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shadow-lg">
            {displayAvatar ? (
              <img
                src={displayAvatar.startsWith('http') ? displayAvatar : `http://192.168.2.15:8080${displayAvatar}`}
                alt="Аватар"
                className="w-full h-full object-cover object-center"
                style={{ 
                  minWidth: '100%', 
                  minHeight: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  console.log('Ошибка загрузки аватара:', displayAvatar);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                ?
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {displayAvatar ? 'Изменить' : 'Загрузить'}
          </button>
          
          {displayAvatar && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={disabled}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Удалить
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <p className="text-xs text-gray-500 text-center">
          Поддерживаются форматы: JPG, PNG, GIF<br />
          Максимальный размер: 5MB
        </p>
      </div>

      {/* Модальное окно для обрезки */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Обрезка аватара</h3>
            
            <div className="mb-4">
              <div 
                className="relative w-64 h-64 mx-auto border-2 border-gray-300 overflow-hidden bg-gray-100"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                {cropImage && (
                  <img
                    ref={cropRef}
                    src={cropImage}
                    alt="Обрезка"
                    className="w-full h-full object-cover"
                    style={{
                      transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                      transformOrigin: 'center center'
                    }}
                  />
                )}
                
                {/* Область обрезки */}
                <div className="absolute inset-0 border-2 border-blue-500 rounded-full pointer-events-none">
                  <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full"></div>
                  <div className="absolute inset-4 bg-transparent rounded-full border-2 border-white"></div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Масштаб: {Math.round(scale * 100)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={handleScaleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelCrop}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={finishCrop}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarUpload;