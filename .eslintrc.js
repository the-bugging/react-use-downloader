module.exports = {
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks', 'prettier'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.json'],
      },
    },
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'react/jsx-filename-extension': [
      'error',
      { extensions: ['.js', '.jsx', '.json'] },
    ],
    'react/prop-types': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'import/extensions': ['off'],
    'import/prefer-default-export': 'off',
    'import/no-unresolved': ['error', { ignore: ['react-hooks-fetch'] }],
    camelcase: [
      'error',
      {
        properties: 'never',
        ignoreDestructuring: false,
        allow: ['first_name'],
      },
    ],
    'react/state-in-constructor': 'off',
    'no-console': 'off',
  },
};
