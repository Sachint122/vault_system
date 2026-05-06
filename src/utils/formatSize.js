/**
 * Converts bytes to a human-readable format (KB, MB, GB, etc.)
 * 
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = formatSize;
