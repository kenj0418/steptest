#!/usr/bin/env node

const cdk = require("@aws-cdk/core");
const { RolesStack } = require("../lib/roles-stack");

const app = new cdk.App();

const envEast = { account: "376144559074", region: "us-east-1" };
const envWest = { account: "376144559074", region: "us-west-2" };

new RolesStack(app, "RolesStack", { env: envEast });
new RolesStack(app, "RolesStackWest", { env: envWest });
