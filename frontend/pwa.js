if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
