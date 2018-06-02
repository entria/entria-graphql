import helper from 'yeoman-test';
import assert from 'yeoman-assert';
import path from 'path';
import fs from 'fs-extra';

import {
  getFileContent,
  getFixturePath,
} from '../../../test/helpers';

import { getConfigDir } from '../../config';
import { uppercaseFirstLetter } from '../../ejsHelpers';
import { getModulePath } from '../../paths';

const connectionGenerator = path.join(__dirname, '..');

it('generate a connection', async () => {
  const moduleName = 'example';
  const name = uppercaseFirstLetter(moduleName);

  const folder = await helper.run(connectionGenerator)
    .withArguments(name)
    .toPromise();

  const destinationDir = getConfigDir('connection');

  const modulePath = getModulePath(destinationDir, moduleName);
  const connectionFilepath = path.join(modulePath, `${name}Connection.js`);

  assert.file([
    connectionFilepath,
  ]);

  const files = {
    connection: getFileContent(path.join(folder, connectionFilepath)),
  };

  expect(files).toMatchSnapshot();
});

it('generate a connection with schema', async () => {
  const moduleName = 'post';
  const name = uppercaseFirstLetter(moduleName);

  const folder = await helper.run(connectionGenerator)
    .inTmpDir(dir =>
      fs.copySync(
        getFixturePath(name),
        path.join(dir, 'src/modules/post/Post.js'),
      ),
    )
    .withArguments('Post Post')
    .toPromise();

  const destinationDir = getConfigDir('connection');
  const modulePath = getModulePath(destinationDir, moduleName);
  const connectionFilepath = path.join(modulePath, `${name}Connection.js`);

  assert.file([
    connectionFilepath,
  ]);

  const files = {
    connection: getFileContent(path.join(folder, connectionFilepath)),
  };

  expect(files).toMatchSnapshot();
});
