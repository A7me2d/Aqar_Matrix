module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: { extend: {
    colors: { canvas:'var(--aqm-canvas)', surface:'var(--aqm-surface)', ink:'var(--aqm-ink)', muted:'var(--aqm-muted)', line:'var(--aqm-line)', accent:'var(--aqm-accent)' },
    fontFamily: { sans:['Cairo','Tahoma','Arial','sans-serif'] },
  } },
};
