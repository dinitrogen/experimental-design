import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workspaceRoot = process.cwd();
const commit = process.env.GITHUB_SHA?.slice(0, 7)
  || execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  }).trim();
const hasLocalChanges = !process.env.GITHUB_SHA
  && execFileSync('git', ['status', '--porcelain'], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  }).trim().length > 0;
const builtAt = new Date().toISOString();
const buildInfo = {
  commit: `${commit}${hasLocalChanges ? '-dirty' : ''}`,
  builtAt,
};

writeFileSync(
  resolve(workspaceRoot, 'src', 'app', 'build-info.generated.ts'),
  `export const BUILD_INFO = ${JSON.stringify(buildInfo, null, 2)} as const;\n`,
);
