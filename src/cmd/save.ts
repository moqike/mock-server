import { CommanderStatic } from 'commander';
import chalk from 'chalk';
import rp from 'request-promise';

import util from './util';

export default function(program: CommanderStatic){
  program
  .command('save <preset>')
  .alias('p')
  .description(
`Save all used scenarios and loaded presets as <preset> file`
  )
  .action(async (preset) => {
    try {
      const config = await util.ensureConfig();
      const protocal = config.https ? 'https' : 'http';
      const host = config.host === '0.0.0.0' ? 'localhost' : config.host;
      try {
        const result = await rp({
          url: `${protocal}://${host}:${config.port}/_api/save-preset`,
          method: 'POST',
          json: true,
          body: {
            preset,
          },
          resolveWithFullResponse: true
        });
        if (result.statusCode === 200) {
          console.log(chalk.green(`All used scenarios and loaded presets has been saved to ${preset}.ts`));
        }
      } catch (e) {
        console.log(chalk.red(e));
      }
    } catch (e) {}
  });
}