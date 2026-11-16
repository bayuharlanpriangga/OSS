import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ['public/oss-js/**', 'public/sw.js', '.next/**'],
  },
];

export default eslintConfig;
