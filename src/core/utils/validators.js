export const validators = {
  email:         (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v ?? ''),
  password:      (v) => (v?.length ?? 0) >= 8,
  nickname:      (v) => (v?.length ?? 0) >= 2 && (v?.length ?? 0) <= 12,
  passwordMatch: (a, b) => !!a && a === b,
}
