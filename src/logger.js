const ora = require('ora');
const winston = require('winston');
const minimist = require('minimist');

// These values are purposefully only read from the command line.
// This is done because the CLI doesn't always have access to a skyuxconfig.json file.
const argv = minimist(process.argv.slice(2));

// eslint-disable-next-line no-prototype-builtins
const logColor = argv.hasOwnProperty('logColor')
  ? argv.logColor === 'true'
  : true;

// eslint-disable-next-line no-prototype-builtins
const logLevel = argv.hasOwnProperty('logLevel') ? argv.logLevel : 'info';

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
  },
  colors: {
    error: 'bold red',
    warn: 'yellow',
    info: 'cyan',
    verbose: 'magenta',
  },
};

const sharedFormatters = [
  winston.format.splat(),
  winston.format.simple(),
  winston.format.errors({ stack: true }),
];

const loggerFormat = logColor
  ? winston.format.combine(
      ...sharedFormatters,
      winston.format.colorize({ all: true, colors: customLevels.colors }),
      winston.format.printf((x) => {
        return x.stack ? `${x.message}\n${x.stack}` : x.message;
      })
    )
  : winston.format.combine(...sharedFormatters);

const logger = winston.createLogger({
  levels: customLevels.levels,
  format: loggerFormat,
  transports: [
    new winston.transports.Console({
      level: logLevel,
      handleExceptions: true,
    }),
  ],
});

// Expose this logic to others
logger.logColor = logColor;
logger.logLevel = logLevel;

// Expose ora logger
logger.promise = (message) => {
  if (logger.logLevel !== 'verbose') {
    return ora(message).start();
  }

  // Expose a compatibility API if verbose.
  // This is necessary otherwise ora would hijack displaying its message on a single line.
  logger.info(`... ${message}`);
  return {
    fail: () => logger.error(`✖ ${message}`),

    succeed: () => logger.info(`✔ ${message}`),
  };
};

module.exports = logger;
