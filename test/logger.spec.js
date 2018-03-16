/*jshint jasmine: true, node: true */
'use strict';

const mock = require('mock-require');

describe('logger', () => {
  afterEach(() => {
    mock.stopAll();
  });

  function setupTest(argv) {
    let _transports;
    let consoleOptions;

    mock('minimist', () => argv);
    mock('winston', {
      Logger: function (opts) {
        _transports = opts.transports;
      },

      transports: {
        Console: function (opts) {
          consoleOptions = opts;
        }
      }
    });

    mock.reRequire('../src/logger');
    expect(_transports).toBeDefined();

    return consoleOptions;
  }

  it('should configure logColor as boolean in minimist', () => {
    mock('minimist', (args, opts) => {
      expect(opts.boolean).toEqual('logColor');
      return {};
    });

    mock.reRequire('../src/logger');
  });

  it('should accept the logColor flag', () => {
    const opts = setupTest({ logColor: false });
    expect(opts.colorize).toEqual(false);
  });

  it('should set the default logColor to true', () => {
    const opts = setupTest({});
    expect(opts.colorize).toEqual(true);
  });

  it('should accept the logLevel flag', () => {
    const opts = setupTest({ logLevel: 'verbose' });
    expect(opts.level).toEqual('verbose');
  });

  it('should set the default logLevel to info', () => {
    const opts = setupTest({});
    expect(opts.level).toEqual('info');
  });

  it('should expose the logLevel and logColor properties', () => {
    mock('minimist', () => ({
      'logLevel': 'verbose',
      'logColor': false
    }));

    const logger = mock.reRequire('../src/logger');
    expect(logger.logLevel).toBe('verbose');
    expect(logger.logColor).toBe(false);
  });
});
