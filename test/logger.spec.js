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

  it('should accept the logColor flag as string', () => {
    const opts = setupTest({ logColor: 'true' });
    expect(opts.colorize).toEqual(true);
  });

  it('should accept the logColor flag as boolean', () => {
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

  it('should expose a promise that calls in to the ora library', () => {
    const spyOra = jasmine.createSpy('ora');
    const spyOraStart = jasmine.createSpyObj('ora', ['start']);
    const spyOraReturn = jasmine.createSpyObj(
      'ora',
      [
        'fail',
        'succeed'
      ]
    );

    spyOra.and.returnValue(spyOraStart);
    spyOraStart.start.and.returnValue(spyOraReturn);
    mock('ora', spyOra);

    const message = 'test-message';
    const logger = mock.reRequire('../src/logger');
    const response = logger.promise(message);

    expect(response.succeed).toBeDefined();
    expect(response.fail).toBeDefined();
  });

  it('should emulate ora when logLevel is verbose', () => {
    const spyOra = jasmine.createSpy('ora');
    mock('ora', spyOra);

    const logger = mock.reRequire('../src/logger');
    logger.logLevel = 'verbose';

    const message = logger.promise('test');

    expect(message.fail).toBeDefined();
    expect(message.succeed).toBeDefined();
    expect(spyOra).not.toHaveBeenCalled();
  });
});
