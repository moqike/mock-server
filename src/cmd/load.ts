import path from 'path';
import { CommanderStatic } from 'commander';
import chalk from 'chalk';
import rp from 'request-promise';

import util from './util';

export default function(program: CommanderStatic){
  program
  .command('load <preset>')
  .alias('l')
  .description(
`Load preset <preset>`
  )
  .action(async (preset) => {
    try {
      const config = await util.ensureConfig();
      const protocal = config.https ? 'https' : 'http';
      const host = config.host === '0.0.0.0' ? 'localhost' : config.host;
      try {
        const result = await rp({
          url: `${protocal}://${host}:${config.port}/_api/load-preset`,
          method: 'POST',
          json: true,
          body: {
            preset
          },
          resolveWithFullResponse: true
        });
        if (result.statusCode === 200) {
          const currentPreset = result.body.preset;
          console.log(chalk.green(`Using preset '${currentPreset}' now`));
        }
      } catch (e) {
        console.log(chalk.red(e));
      }
    } catch (e) {}
  });
}