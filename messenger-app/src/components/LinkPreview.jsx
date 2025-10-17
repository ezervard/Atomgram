import React, { useState, useEffect } from 'react';

const LinkPreview = ({ url, text }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Функция для извлечения URL из текста
  const extractUrl = (text) => {
    if (!text) return null;
    
    // Регулярное выражение для поиска URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    
    if (urls && urls.length > 0) {
      // Берем первый найденный URL
      return urls[0];
    }
    
    return null;
  };

  // Функция для получения метаданных страницы
  const fetchPreview = async (url) => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Используем прокси для CORS
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить страницу');
      }
      
      const html = await response.text();
      
      // Парсим HTML для извлечения метаданных
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const title = doc.querySelector('title')?.textContent?.trim() || 
                   doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
                   'Без названия';
      
      const description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                         doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                         '';
      
      const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                   doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                   '';
      
      // Если изображение относительное, делаем его абсолютным
      let imageUrl = image;
      if (image && !image.startsWith('http')) {
        try {
          const baseUrl = new URL(url);
          imageUrl = new URL(image, baseUrl.origin).href;
        } catch (e) {
          imageUrl = '';
        }
      }
      
      setPreview({
        title: title.substring(0, 100), // Ограничиваем длину заголовка
        description: description.substring(0, 200), // Ограничиваем длину описания
        image: imageUrl,
        url: url
      });
      
    } catch (err) {
      console.error('Ошибка загрузки предпросмотра:', err);
      setError('Не удалось загрузить предпросмотр');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlToPreview = url || extractUrl(text);
    if (urlToPreview) {
      fetchPreview(urlToPreview);
    }
  }, [url, text]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(preview.url, '_blank', 'noopener,noreferrer');
  };

  if (!preview && !loading && !error) {
    return null;
  }

  return (
    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      {loading ? (
        <div className="p-3 flex items-center space-x-3">
          <div className="animate-pulse bg-gray-200 rounded w-16 h-16"></div>
          <div className="flex-1 space-y-2">
            <div className="animate-pulse bg-gray-200 rounded h-4 w-3/4"></div>
            <div className="animate-pulse bg-gray-200 rounded h-3 w-1/2"></div>
          </div>
        </div>
      ) : error ? (
        <div className="p-3 text-sm text-gray-500">
          Не удалось загрузить предпросмотр ссылки
        </div>
      ) : preview ? (
        <div 
          className="flex cursor-pointer hover:bg-gray-50 transition-colors duration-200"
          onClick={handleClick}
        >
          {preview.image && (
            <div className="w-20 h-20 flex-shrink-0">
              <img
                src={preview.image}
                alt={preview.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 p-3 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
              {preview.title}
            </h4>
            {preview.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {preview.description}
              </p>
            )}
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="truncate">{preview.url}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LinkPreview;
