const { execSync } = require('child_process');
const dotenv = require('dotenv');
dotenv.config();

const args = [
    `--endpoint=${process.env.API_GQL_ENDPOINT}`,
    `--header="Authorization: Bearer ${process.env.API_BEARER_TOKEN}"`,
    '--target=typescript',
    '--tagName=gql',
    '--includes=./graphql/*.query.ts',
]

const cmd = `npx apollo codegen:generate ${args.join(' ')} generated`;

const LCSUCCESS = '\x1b[32m%s\x1b[0m'; //green
console.info(LCSUCCESS, `Generating schema files by running: ${cmd}`);

execSync(cmd);