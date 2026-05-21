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

  collectCoverage: true,

  coverageDirectory: 'coverage',

  coverageReporters: ['text', 'html'],

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