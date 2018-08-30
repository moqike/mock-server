import { CommanderStatic } from 'commander';
import chalk from 'chalk';
import rp from 'request-promise';

import util from './util';

export default function(program: CommanderStatic){
  program
  .command('state <api>')
  .alias('c')
  .description(
`See current scenario for <api>`
  )
  .action(async (api) => {
    try {
      const config = await util.ensureConfig();
      const protocal = config.https ? 'https' : 'http';
      const host = config.host === '0.0.0.0' ? 'localhost' : config.host;
      try {
        const result = await rp({
          url: `${protocal}://${host}:${config.port}/_api/state-scenario`,
          method: 'POST',
          json: true,
          body: {
            api,
          },
          resolveWithFullResponse: true
        });
        if (result.statusCode === 200) {
          const scenario = result.body.scenario;
          console.log(chalk.green(`API: '${api}' is using scenario '${scenario}'`));
        }
      } catch (e) {
        console.log(chalk.red(e));
      }
    } catch (e) {}
  });
}