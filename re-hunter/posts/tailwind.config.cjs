const path = require('node:path');
module.exports = {
  content: ['html/**/*.html','ts/**/*.ts'].map(pattern => path.join(__dirname,pattern).replace(/\\/g,'/')),
  prefix: 'tw-', important: '#v-posts', corePlugins: { preflight: false },
  theme: { extend: { colors: { surface:'var(--surface)', muted:'var(--muted)', ink:'var(--text)', line:'var(--border)', accent:'var(--posts-accent)' } } },
};
