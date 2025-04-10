/**
 * 判断当前是否为生产环境
 * @returns {boolean} 是否为生产环境
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

/**
 * 判断当前是否为开发环境
 * @returns {boolean} 是否为开发环境
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};
