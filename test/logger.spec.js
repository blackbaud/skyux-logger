const mock = require('mock-require');

describe('logger', () => {
  afterEach(() => {
    mock.stopAll();
  });

  function setupTest(argv) {
    let _transports;
    let consoleOptions;
    let formatSpyObj = jasmine.createSpyObj('format', [
      'colorize',
      'combine',
      'printf',
      'simple',
    ]);

    formatSpyObj.printf.and.callFake((callback) => {
      callback({ message: 'foobar' });
    });

    // Run all functions added to the `combine` function to calculate
    // coverage for each callback.
    formatSpyObj.combine.and.callFake((...callbacks) => {
      callbacks.forEach((callback) => callback && callback());
    });

    mock('minimist', () => argv);
    mock('winston', {
      createLogger(opts) {
        _transports = opts.transports;
        return {};
      },

      format: formatSpyObj,

      transports: {
        Console: function (opts) {
          consoleOptions = opts;
        },
      },
    });

    mock.reRequire('../src/logger');
    expect(_transports).toBeDefined();

    return { consoleOptions, formatSpyObj };
  }

  it('should accept the logColor flag as string', () => {
    const { formatSpyObj } = setupTest({ logColor: 'true' });
    expect(formatSpyObj.colorize).toHaveBeenCalled();
  });

  it('should accept the logColor flag as boolean', () => {
    const { formatSpyObj } = setupTest({ logColor: false });
    expect(formatSpyObj.colorize).not.toHaveBeenCalled();
  });

  it('should set the default logColor to true', () => {
    const { formatSpyObj } = setupTest({});
    expect(formatSpyObj.colorize).toHaveBeenCalled();
  });

  it('should accept the logLevel flag', () => {
    const { consoleOptions } = setupTest({ logLevel: 'verbose' });
    expect(consoleOptions.level).toEqual('verbose');
  });

  it('should set the default logLevel to info', () => {
    const { consoleOptions } = setupTest({});
    expect(consoleOptions.level).toEqual('info');
  });

  it('should expose the logLevel and logColor properties', () => {
    mock('minimist', () => ({
      logLevel: 'verbose',
      logColor: false,
    }));

    const logger = mock.reRequire('../src/logger');
    expect(logger.logLevel).toBe('verbose');
    expect(logger.logColor).toBe(false);
  });

  it('should expose a promise that calls in to the ora library', () => {
    const spyOra = jasmine.createSpy('ora');
    const spyOraStart = jasmine.createSpyObj('ora', ['start']);
    const spyOraReturn = jasmine.createSpyObj('ora', ['fail', 'succeed']);

    spyOra.and.returnValue(spyOraStart);
    spyOraStart.start.and.returnValue(spyOraReturn);
    mock('ora', spyOra);

    const message = 'test-message';
    const logger = mock.reRequire('../src/logger');
    const response = logger.promise(message);

    expect(response.succeed).toBeDefined();
    expect(response.fail).toBeDefined();
  });

  it('should emulate ora when logLevel is verbose and log fail', () => {
    const spyOra = jasmine.createSpy('ora');
    mock('ora', spyOra);

    const logger = mock.reRequire('../src/logger');
    logger.logLevel = 'verbose';

    spyOn(logger, 'info');
    spyOn(logger, 'error');

    const message = 'test-message';
    const promise = logger.promise(message);
    promise.fail();

    expect(logger.info).toHaveBeenCalledWith(`... ${message}`);
    expect(logger.error).toHaveBeenCalledWith(`✖ ${message}`);
    expect(spyOra).not.toHaveBeenCalled();
  });

  it('should emulate ora when logLevel is verbose and log succeed', () => {
    const spyOra = jasmine.createSpy('ora');
    mock('ora', spyOra);

    const logger = mock.reRequire('../src/logger');
    logger.logLevel = 'verbose';

    spyOn(logger, 'info');
    spyOn(logger, 'error');

    const message = 'test-message';
    const promise = logger.promise(message);
    promise.succeed();

    expect(logger.info).toHaveBeenCalledWith(`... ${message}`);
    expect(logger.info).toHaveBeenCalledWith(`✔ ${message}`);
    expect(spyOra).not.toHaveBeenCalled();
  });
});
