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

const loaderGenerator = path.join(__dirname, '..');

it('generate a loader', async () => {
  const moduleName = 'example';
  const name = uppercaseFirstLetter(moduleName);

  const folder = await helper.run(loaderGenerator)
    .withArguments(name)
    .toPromise();

  const destinationDir = getConfigDir('loader');

  const modulePath = getModulePath(destinationDir, moduleName);
  const loaderFilepath = path.join(modulePath, `${name}Loader.js`);

  assert.file([
    loaderFilepath,
  ]);

  const files = {
    loader: getFileContent(path.join(folder, loaderFilepath)),
  };

  expect(files).toMatchSnapshot();
});

it('generate a loader with schema', async () => {
  const moduleName = 'post';
  const name = uppercaseFirstLetter(moduleName);

  const folder = await helper.run(loaderGenerator)
    .inTmpDir(dir =>
      fs.copySync(
        getFixturePath(name),
        path.join(dir, 'src/modules/post/PostModel.js'),
      ),
    )
    .withArguments('Post Post')
    .toPromise();

  const destinationDir = getConfigDir('loader');

  const modulePath = getModulePath(destinationDir, moduleName);
  const loaderFilepath = path.join(modulePath, `${name}Loader.js`);

  assert.file([
    loaderFilepath,
  ]);

  const files = {
    loader: getFileContent(path.join(folder, loaderFilepath)),
  };

  expect(files).toMatchSnapshot();
});

it('generate a loader with schema and without timestamps', async () => {
  const moduleName = 'user';
  const name = uppercaseFirstLetter(moduleName);

  const folder = await helper.run(loaderGenerator)
    .inTmpDir(dir =>
      fs.copySync(
        getFixturePath(name),
        path.join(dir, 'src/modules/user/UserModel.js'),
      ),
    )
    .withArguments('User User')
    .toPromise();

  const destinationDir = getConfigDir('loader');

  const modulePath = getModulePath(destinationDir, moduleName);
  const loaderFilepath = path.join(modulePath, `${name}Loader.js`);

  assert.file([
    loaderFilepath,
  ]);

  const files = {
    loader: getFileContent(path.join(folder, loaderFilepath)),
  };

  expect(files).toMatchSnapshot();
});
