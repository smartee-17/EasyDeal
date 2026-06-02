export default {
  testEnvironment: 'node',

  setupFiles: ['./jest.setup.js'],

  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],

  collectCoverage: false,

  collectCoverageFrom: [
  "src/**/*.js",

  "!src/**/*.test.js",
  "!src/**/index.js",
  "!src/**/*.config.js",
  "!src/**/mocks/**",
  "!src/**/node_modules/**"
  ],

  coverageDirectory: 'coverage',

  coverageReporters: ['text', 'html', 'Icov'],

  reporters: [
    'default',

    [
      'jest-html-reporters',
      {
        publicPath: './html-report',
        filename: 'report.html',
        expand: true,
      },
    ],

    [
      'jest-junit',
      {
        outputDirectory: './junit',
        outputName: 'junit.xml',
      },
    ],
  ],
};