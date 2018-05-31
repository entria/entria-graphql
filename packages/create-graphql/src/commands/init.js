// @flow
import spawn from 'cross-spawn';

function create(project) {
  const spawnOptions = ['@entria/graphql', project];

  spawn('yo', spawnOptions, { shell: true, stdio: 'inherit' });
}

export default create;
