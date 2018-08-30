#!/usr/bin/env node

import program, { CommanderStatic }  from 'commander';

import use from './cmd/use';
import state from './cmd/state';
import start from './cmd/start';

const packageInfo = require('../package.json');

program.version(packageInfo.version, '-v, --version');

function useAction(action: (commander: CommanderStatic) => void) {
  action(program);
}

useAction(use);
useAction(state);
useAction(start);

program.parse(process.argv);