import path from 'path';
import { CommanderStatic } from 'commander';
import chalk from 'chalk';
import rp from 'request-promise';

import { MockServer } from '../server';

import util from './util';

export default function(program: CommanderStatic){
  program
  .command('start')
  .alias('s')
  .description(
`Start mock server with current folder as 'MOCK_HOME'`
  )
  .action(async () => {
    try {
      const runtimePath = path.resolve('./');
      const config = await util.ensureConfig();
      const mockServer = new MockServer({
        mockHome: runtimePath,
        https: config.https,
        httpsOptions: config.httpsOptions
      });

      const server = mockServer.listen(config.port, config.host, () => {
        console.log(`MOCK Server is running on port: ${config.port}`);
      });
    } catch (e) {
      console.log(e);
    }

  });
}