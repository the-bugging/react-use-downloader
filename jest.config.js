module.exports = {
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  coverageReporters: ['json-summary', 'lcov'],
};
