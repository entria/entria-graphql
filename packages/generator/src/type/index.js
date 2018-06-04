// @flow
import Generator from 'yeoman-generator';
import path from 'path';
import relative from 'relative';
import {
  getMongooseModelSchema,
  getRelativeConfigDir,
} from '../utils';
import { getConfigDir } from '../config';
import { uppercaseFirstLetter } from '../ejsHelpers';
import { getModulePath, getTestPath } from '../paths';
import { getDependencies, getDependenciesPath } from '../parser/mongoose';

class TypeGenerator extends Generator {
  constructor(args, options) {
    super(args, options);

    this.argument('name', {
      type: String,
      required: true,
    });

    this.argument('model', {
      type: Object,
      required: false,
    });

    this.destinationDir = getConfigDir('type');
  }

  generateType() {
    const schema = this.options.model ?
      getMongooseModelSchema({
        model: this.options.model,
        withTimestamps: true,
        ref: true,
      })
      : null;

    const directories = this._getConfigDirectories();

    const name = uppercaseFirstLetter(this.options.name);
    const typeFileName = `${name}Type`;

    const templatePath = schema ?
      this.templatePath('TypeWithSchema.js.template')
      : this.templatePath('Type.js.template');

    const moduleName = this.options.name.toLowerCase();
    const modulePath = getModulePath(this.destinationDir, moduleName);

    const relativePath = path.join(modulePath, `${typeFileName}.js`);

    const destinationPath = this.destinationPath(relativePath);

    const deps = schema ? getDependencies(schema.fields) : null;

    const depsMap = deps ? getDependenciesPath(
      this.destinationPath(),
      [...deps.typeDependencies, ...deps.loaderDependencies],
      relativePath,
    ) : null;

    const templateVars = {
      name,
      schema,
      dependencies: deps ? deps.dependencies : null,
      depsMap,
      directories,
    };

    this._generateTypeTest({
      name,
      schema,
      depsMap,
    });

    this.fs.copyTpl(templatePath, destinationPath, templateVars);
  }

  _getConfigDirectories() {
    return getRelativeConfigDir('type', ['model', 'type', 'loader', 'connection', 'interface']);
  }

  _generateTypeTest({ name, schema, depsMap }) {
    const templatePath = this.templatePath('test/Type.js.template');

    const moduleName = this.options.name.toLowerCase();
    const testPath = getTestPath(
      getModulePath(this.destinationDir, moduleName),
    );

    const destinationPath = this.destinationPath(
      path.join(testPath, `${name}Type.spec.js`),
    );

    const directories = this._getConfigDirectories();

    const templateVars = {
      name,
      schema,
      depsMap,
      directories,
    };

    this.fs.copyTpl(templatePath, destinationPath, templateVars);
  }

  end() {
    this.log('🔥 Type created!');
  }
}

module.exports = TypeGenerator;
