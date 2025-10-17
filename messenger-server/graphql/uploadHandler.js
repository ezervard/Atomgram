const path = require('path');
const fs = require('fs').promises;

// Функция для обработки загрузки файлов
const handleFileUpload = async (file, uploadDir, prefix = '') => {
  const { createReadStream, filename, mimetype } = await file;
  
  // Создаем уникальное имя файла
  const timestamp = Date.now();
  const extension = path.extname(filename);
  const baseName = path.basename(filename, extension);
  const uniqueFileName = `${prefix}${timestamp}_${baseName}${extension}`;
  
  // Создаем директорию если не существует
  await fs.mkdir(uploadDir, { recursive: true });
  
  // Путь к файлу
  const filePath = path.join(uploadDir, uniqueFileName);
  
  // Создаем поток для записи
  const stream = createReadStream();
  const chunks = [];
  
  // Собираем данные из потока
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  
  // Записываем файл
  const buffer = Buffer.concat(chunks);
  await fs.writeFile(filePath, buffer);
  
  return {
    filename: uniqueFileName,
    originalName: filename,
    mimetype,
    size: buffer.length,
    url: `/Uploads/${path.basename(uploadDir)}/${uniqueFileName}`,
    uploadedAt: new Date()
  };
};

// Функция для обработки множественной загрузки файлов
const handleMultipleFileUpload = async (files, uploadDir, prefix = '') => {
  const uploadedFiles = [];
  
  for (const file of files) {
    try {
      const uploadedFile = await handleFileUpload(file, uploadDir, prefix);
      uploadedFiles.push(uploadedFile);
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      throw error;
    }
  }
  
  return uploadedFiles;
};

// Функция для валидации файлов
const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB по умолчанию
    allowedTypes = [],
    allowedExtensions = []
  } = options;

  // Проверяем, что файл существует
  if (!file) {
    throw new Error('Файл не предоставлен');
  }

  // Для Apollo Client Upload файлы имеют структуру { createReadStream, filename, mimetype }
  // Проверяем наличие основных свойств
  if (!file.filename) {
    throw new Error('Некорректный файл: отсутствует имя файла');
  }

  if (!file.mimetype) {
    throw new Error('Некорректный файл: отсутствует тип файла');
  }

  // Проверка типа файла
  if (allowedTypes.length > 0 && !allowedTypes.some(type => file.mimetype.startsWith(type))) {
    throw new Error(`Неподдерживаемый тип файла: ${file.mimetype}`);
  }

  // Проверка расширения файла
  if (allowedExtensions.length > 0) {
    const extension = path.extname(file.filename).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      throw new Error(`Неподдерживаемое расширение файла: ${extension}`);
    }
  }

  // Проверка размера файла (будет проверяться после загрузки)
  return true;
};

// Функция для удаления файла
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    return false;
  }
};

module.exports = {
  handleFileUpload,
  handleMultipleFileUpload,
  validateFile,
  deleteFile
};
