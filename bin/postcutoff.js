#!/usr/bin/env node
/**
 * Global CLI Binary for GeminiPostCutoff Architecture Review Engine
 */

const { runCli } = require('../review_engine/cli');

runCli(process.argv.slice(2))
  .then(code => process.exit(code))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
