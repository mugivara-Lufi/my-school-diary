const config = {
  development: {
    apiUrl: 'https://localhost:7081'
  },
  production: {
    apiUrl: 'https://jdhfnmhb-7081.euw.devtunnels.ms'
  },
  // Для ручного переключения
  current: 'development' // или 'production'
};

export const API_URL = config[config.current].apiUrl;