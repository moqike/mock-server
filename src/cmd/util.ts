import { MockServerConfig } from '../types';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export default {
  async ensureConfig(): Promise<MockServerConfig> {
    const hasConfig = fs.existsSync('./msconfig.json');
    const runtimePath = path.resolve('./');
    return new Promise((resolve, reject) => {
      if (hasConfig) {
        let config = require(path.resolve('./msconfig.json'));
        config = {
          host: 'localhost',
          port: '3000',
          https: false,
          ...config
        };
        resolve(config);
      } else {
        console.log(chalk.red(`Config file('msconfig.json') of mock server is not found under ${runtimePath}`));
        reject();
      }
    });
  }
}
