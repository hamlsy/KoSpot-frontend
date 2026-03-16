const activeLocks = new Set();

function applyBodyScrollState() {
  document.body.style.overflow = activeLocks.size > 0 ? 'hidden' : '';
}

export function lockBodyScroll(lockId) {
  if (!lockId) return;
  activeLocks.add(lockId);
  applyBodyScrollState();
}

export function unlockBodyScroll(lockId) {
  if (!lockId) return;
  activeLocks.delete(lockId);
  applyBodyScrollState();
}

export function unlockBodyScrollByPrefix(prefix) {
  if (!prefix) return;
  Array.from(activeLocks).forEach((lockId) => {
    if (lockId.startsWith(prefix)) {
      activeLocks.delete(lockId);
    }
  });
  applyBodyScrollState();
}
