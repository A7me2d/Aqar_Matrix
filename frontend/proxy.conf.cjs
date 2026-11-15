// Keep the existing dashboard, authentication cookie and API on the same origin.
const target = process.env.AQM_ENGINE_URL || 'http://localhost:8787';
module.exports = {
  '/d/**': { target, changeOrigin:true },
  '/api/**': { target, changeOrigin:true },
  '/events': { target, changeOrigin:true },
};
