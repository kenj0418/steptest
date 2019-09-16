#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { RolesStack } = require('../lib/roles-stack');

const app = new cdk.App();
new RolesStack(app, 'RolesStack');
