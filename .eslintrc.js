module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn', // Downgrade to warning instead of error
    'react-hooks/exhaustive-deps': 'warn', // Downgrade to warning
    '@typescript-eslint/no-explicit-any': 'warn', // Downgrade to warning
    'react/no-unescaped-entities': 'warn', // Downgrade to warning
  }
}