export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleFileExtensions: ['js', 'mjs', 'json', 'node'],
  moduleDirectories: ['node_modules', 'src'], 
  moduleNameMapper: {
    '^jszip$': '<rootDir>/node_modules/jszip/dist/jszip.min.js', 
    '^xmldom-qsa$': '<rootDir>/node_modules/xmldom-qsa/lib/index.js', 
    // Explicitly map zod to itself, relying on Jest's default resolution for this specific module,
    // hoping it behaves differently than when no entry is present.
    '^zod$': 'zod',
  },
};
