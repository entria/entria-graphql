// @flow
import Generator from 'yeoman-generator';
import path from 'path';
import {
  getMongooseModelSchema,
  getRelativeConfigDir,
  } from '../utils';
import { getConfigDir } from '../config';
import { camelCaseText, uppercaseFirstLetter } from '../ejsHelpers';
import { getModulePath, getMutationPath, getTestPath } from '../paths';
import { getDependencies } from '../parser/mongoose';

class MutationGenerator extends Generator {
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

    this.destinationDir = getConfigDir('mutation');
  }

  _mutationPath(name) {
    return `${this.destinationDir}/${name}Mutation.js`;
  }

  _parseSchema(schema, deps) {
    // Remove `GraphQLString` dependency from import if it exists,
    // it's already hard-coded on `MutationAdd` template.
    const addDependencies = deps.dependencies.filter(dep => ['GraphQLString'].indexOf(dep) === -1);

    // Also remove `GraphQLString`, `GraphQLNonNull` & `GraphQLID` dependencies
    // from import if they exist, they are already hard-coded on `MutationEdit` template.
    const editDependencies = deps.dependencies.filter(dep =>
      ['GraphQLString', 'GraphQLNonNull', 'GraphQLID'].indexOf(dep) === -1,
    );

    // Map through the fields checking if any of them is `required: true`, if so, use `GraphQLNonNull`
    const fields = schema.fields.map((field) => {
      if (!field.required) {
        return field;
      }

      // Add `GraphQLNonNull` to `addDependencies` import if it hasn't been added yet.
      // Won't push to `editDependencies` because it's already specified on the template file.
      if (addDependencies.indexOf('GraphQLNonNull') === -1) {
        addDependencies.push('GraphQLNonNull');
      }

      return {
        ...field,
        type: `GraphQLNonNull(${field.type})`,
      };
    });

    return {
      ...schema,
      fields,
      addDependencies,
      editDependencies,
    };
  }

  _getConfigDirectories() {
    return getRelativeConfigDir('mutation', ['model', 'type', 'loader', 'connection']);
  }

  generateMutation() {
    let schema = null;
    if (this.options.model) {
      const modelSchema = getMongooseModelSchema({ model: this.options.model });
      const deps = getDependencies(modelSchema.fields);
      schema = this._parseSchema(modelSchema, deps);
    }

    const name = uppercaseFirstLetter(this.options.name);

    const mutations = {
      add: {
        fileName: `${name}Add`,
        template: {
          withSchema: 'MutationAddWithSchema.js.template',
          regular: 'MutationAdd.js.template',
        },
      },
      edit: {
        fileName: `${name}Edit`,
        template: {
          withSchema: 'MutationEditWithSchema.js.template',
          regular: 'MutationEdit.js.template',
        },
      },
    };

    const templateType = schema ? 'withSchema' : 'regular';
    const directories = this._getConfigDirectories();

    const templateVars = {
      name,
      camelCaseName: camelCaseText(this.options.name),
      schema,
      directories,
    };

    const moduleName = this.options.name.toLowerCase();
    const modulePath = getModulePath(this.destinationDir, moduleName);
    const mutationPath = getMutationPath(modulePath);

    Object.keys(mutations).forEach((mutationType) => {
      const { template, fileName } = mutations[mutationType];

      const mutationFilePath = path.join(mutationPath, `${fileName}Mutation.js`);

      this.fs.copyTpl(
        this.templatePath(template[templateType]),
        mutationFilePath,
        templateVars,
      );

      this._generateMutationTest({
        name,
        mutationName: fileName,
        template: template[templateType],
        schema,
      });
    });
  }

  _generateMutationTest({ name, mutationName, template, schema }) {
    const templatePath = this.templatePath(`test/${template}`);

    const moduleName = this.options.name.toLowerCase();
    const modulePath = getModulePath(this.destinationDir, moduleName);
    const mutationPath = getMutationPath(modulePath);
    const mutationTestPath = getTestPath(mutationPath);

    const destinationPath = this.destinationPath(
      path.join(mutationTestPath, `${mutationName}Mutation.spec.js`),
    );

    const directories = this._getConfigDirectories();

    const templateVars = {
      name,
      camelCaseName: camelCaseText(name),
      mutationName,
      schema,
      directories,
    };

    this.fs.copyTpl(templatePath, destinationPath, templateVars);
  }

  end() {
    this.log('🔥 Mutation created!');
  }
}

module.exports = MutationGenerator;
