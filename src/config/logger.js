import SimpleLogger from 'simple-node-logger';
import fs from 'fs';
import path from 'path';

const logDirectory = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const opts = {
  logDirectory: logDirectory,
  fileNamePattern: 'app-<DATE>.log',
  dateFormat: 'YYYY-MM-DD',
  timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
};

const logger = SimpleLogger.createRollingFileLogger(opts);

logger.setLevel('info');

export default logger;