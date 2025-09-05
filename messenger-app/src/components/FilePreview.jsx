import React from 'react';

const FilePreview = ({ files, removeFile }) => {
  if (!files || files.length === 0) return null;

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="mb-2 p-2 bg-gray-50 rounded-md border border-gray-200">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">
          Файлы ({files.length})
        </span>
        <button
          onClick={() => files.forEach(removeFile)}
          className="text-xs text-gray-500 hover:text-red-500"
        >
          Очистить
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex items-center bg-white p-1.5 rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-sm mr-1.5">
              {getFileIcon(file.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">
                {file.name}
              </div>
              <div className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </div>
            </div>
            <button
              onClick={() => removeFile(file)}
              className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilePreview;