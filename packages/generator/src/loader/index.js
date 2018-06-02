// @flow
import Generator from 'yeoman-generator';
import pluralize from 'pluralize';
import path from 'path';

import {
  getMongooseModelSchema,
  getRelativeConfigDir,
  } from '../utils';
import { getConfigDir } from '../config';
import { camelCaseText, uppercaseFirstLetter } from '../ejsHelpers';
import { getModulePath } from '../paths';

class LoaderGenerator extends Generator {
  constructor(args, options) {
    super(args, options);

    this.argument('name', {
      type: String,
      required: true,
    });

    this.argument('model', {
      type: String,
      required: false,
    });

    this.destinationDir = getConfigDir('loader');
  }

  _getConfigDirectories() {
    return getRelativeConfigDir('loader', ['model', 'connection']);
  }

  generateLoader() {
    const schema = this.options.model ?
      getMongooseModelSchema({ model: this.options.model, withTimestamps: true })
      : null;

    const name = uppercaseFirstLetter(this.options.name);

    const templatePath = schema ?
      this.templatePath('LoaderWithSchema.js.template')
      : this.templatePath('Loader.js.template');

    const directories = this._getConfigDirectories();

    const pluralName = pluralize(this.options.name);

    const moduleName = this.options.name.toLowerCase();
    const modulePath = getModulePath(this.destinationDir, moduleName);

    const destinationPath = this.destinationPath(
      path.join(modulePath, `${name}Loader.js`),
    );
    const templateVars = {
      name,
      rawName: this.options.name,
      pluralName,
      pluralCamelCaseName: camelCaseText(pluralName),
      schema,
      directories,
    };

    this.fs.copyTpl(templatePath, destinationPath, templateVars);
  }

  end() {
    this.log('🔥 Loader created!');
  }
}

module.exports = LoaderGenerator;
