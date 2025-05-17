module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    '@typescript-eslint/no-unused-vars': 'off', // Turn off unused vars error
    'react-hooks/exhaustive-deps': 'off', // Turn off hooks dependency warning
    'react/no-unescaped-entities': 'off', // Turn off unescaped entities error
  }
}