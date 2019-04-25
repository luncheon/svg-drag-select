export let nonPassive: { passive: false } | undefined
try {
  const options = Object.defineProperty({}, 'passive', {
    get() {
      nonPassive = { passive: false }
    }
  })
  const noop = () => {}
  addEventListener('passive', noop, options);
  removeEventListener('passive', noop, options);
} catch(err) {}
