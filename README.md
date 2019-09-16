# Notes of CDK

## Benefits

- Code instead of YAML / JSON

  - Can use inheritance, iteration, etc.
  - Can write standard JavaScript unit tests against the infrstructure too

- Understands what IAM rights are needed by various actions and tries to create a role that has the necessary rights. We can't let it create it, but when can see what rights it will need and use that to create our own role

- Can generate Cloud Formation YAML with `cdk synth` to see exactly what is happening

- deployments are simple: `cdk deploy`

## Drawbacks

- Tries to create roles for everything. Effort is needed to supply your own. Some custom objects don't support supplying your own. (Example I saw was S3 Bucket Notifications)
  - See note above under benefits related to this
