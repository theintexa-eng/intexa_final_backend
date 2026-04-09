function buildBaseResponse() {
  return {
    success: true,
    message: 'API is running',
    basePath: '/api',
  };
}

module.exports = {
  buildBaseResponse,
};