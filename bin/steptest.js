#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { SteptestStack } = require('../lib/steptest-stack');

const app = new cdk.App();
new SteptestStack(app, 'SteptestStack');
