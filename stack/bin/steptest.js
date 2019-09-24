#!/usr/bin/env node

const cdk = require("@aws-cdk/core");
const { SteptestStack } = require("../lib/steptest-stack");

const app = new cdk.App();

const envEast = { account: "376144559074", region: "us-east-1" };
const envWest = { account: "376144559074", region: "us-west-2" };

new SteptestStack(app, "SteptestStack", { env: envEast });
new SteptestStack(app, "SteptestStackWest", { env: envWest });
