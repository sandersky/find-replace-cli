#! /usr/bin/env node

'use strict'

const api = require('./index')
const program = require('commander')
const version = require('../package.json').version

program
  .usage('<configFilePath>')
  .description('Utility to apply find/replace transforms to a set of files all at once')
  .version(version)
  .parse(process.argv)

if (program.args.length !== 1) {
  console.error(`Command arguments are incorrect. Run '${ program._name } --help' for more information.`)
  process.exit(2)
}

const workingDir = process.cwd()

api.loadConfigFile(program.args[0])
  .then(api.transform.bind(api, workingDir))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
