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
import { getModulePath, getTestPath, getMutationPath } from '../../paths';

const mutationGenerator = path.join(__dirname, '..');

it('generate mutation files', async () => {
  const moduleName = 'example';
  const name = uppercaseFirstLetter(moduleName);

  const folder = await helper.run(mutationGenerator)
    .withArguments(name)
    .toPromise();

  const destinationDir = getConfigDir('mutation');

  const modulePath = getModulePath(destinationDir, moduleName);
  const mutationPath = getMutationPath(modulePath);
  const mutationTestPath = getTestPath(mutationPath);

  const mutationAddFilepath = path.join(mutationPath, `${name}AddMutation.js`);
  const mutationEditFilepath = path.join(mutationPath, `${name}EditMutation.js`);
  const mutationAddTestFilepath = path.join(mutationTestPath, `${name}AddMutation.spec.js`);
  const mutationEditTestFilepath = path.join(mutationTestPath, `${name}EditMutation.spec.js`);

  assert.file([
    mutationAddFilepath,
    mutationEditFilepath,
    mutationAddTestFilepath,
    mutationEditTestFilepath,
  ]);

  const files = {
    add: getFileContent(path.join(folder, mutationAddFilepath)),
    edit: getFileContent(path.join(folder, mutationEditFilepath)),
    addTest: getFileContent(path.join(folder, mutationAddTestFilepath)),
    editTest: getFileContent(path.join(folder, mutationEditTestFilepath)),
  };

  expect(files).toMatchSnapshot();
});

it('generate mutation files with schema', async () => {
  const moduleName = 'post';
  const name = uppercaseFirstLetter(moduleName);

  const folder = await helper.run(mutationGenerator)
    .inTmpDir(dir =>
      fs.copySync(
        getFixturePath(name),
        path.join(dir, 'src/modules/post/PostModel.js'),
      ),
    )
    .withArguments('Post Post')
    .toPromise();

  const destinationDir = getConfigDir('mutation');

  const modulePath = getModulePath(destinationDir, moduleName);
  const mutationPath = getMutationPath(modulePath);
  const mutationTestPath = getTestPath(mutationPath);

  const mutationAddFilepath = path.join(mutationPath, `${name}AddMutation.js`);
  const mutationEditFilepath = path.join(mutationPath, `${name}EditMutation.js`);
  const mutationAddTestFilepath = path.join(mutationTestPath, `${name}AddMutation.spec.js`);
  const mutationEditTestFilepath = path.join(mutationTestPath, `${name}EditMutation.spec.js`);

  assert.file([
    mutationAddFilepath,
    mutationEditFilepath,
    mutationAddTestFilepath,
    mutationEditTestFilepath,
  ]);

  const files = {
    add: getFileContent(path.join(folder, mutationAddFilepath)),
    edit: getFileContent(path.join(folder, mutationEditFilepath)),
    addTest: getFileContent(path.join(folder, mutationAddTestFilepath)),
    editTest: getFileContent(path.join(folder, mutationEditTestFilepath)),
  };

  expect(files).toMatchSnapshot();
});
