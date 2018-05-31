/* @flow */
import recast from 'recast';
import { uppercaseFirstLetter } from './ejsHelpers';

const { visit } = recast.types;

export const parseFieldToGraphQL = (field, ref) => {
  const graphQLField = {
    name: field.name,
    description: field.description,
    required: !!field.required,
    originalType: field.type,
    resolve: `obj.${field.name}`,
  };

  const name = uppercaseFirstLetter(field.name);
  const typeFileName = `${name}Type`;
  const loaderFileName = `${name}Loader`;

  let parsedChildField;
  let typeFileNameSingular;
  let loaderFileNameSingular;

  switch (field.type) {
    case 'Number':
      return {
        ...graphQLField,
        type: 'GraphQLInt',
        flowType: 'number',
      };
    case 'Boolean':
      return {
        ...graphQLField,
        type: 'GraphQLBoolean',
        flowType: 'boolean',
      };
    case 'Array':
      field.type = field.childType;

      parsedChildField = parseFieldToGraphQL(field, ref);
      parsedChildField.flowType = 'array';
      parsedChildField.type = [parsedChildField.type];

      if (field.childType === 'ObjectId' && ref) {
        typeFileNameSingular = `${field.ref}Type`;
        loaderFileNameSingular = `${field.ref}Loader`;

        parsedChildField = {
          ...parsedChildField,
          type: [typeFileNameSingular],
          resolve: `await ${loaderFileNameSingular}.load${name}ByIds(context, obj.${field.name})`,
          resolveArgs: 'async (obj, args, context)',
          graphqlType: typeFileNameSingular,
          graphqlLoader: loaderFileNameSingular,
        };
      }

      return parsedChildField;
    case 'ObjectId':
      if (ref) {
        return {
          ...graphQLField,
          type: typeFileName,
          flowType: 'string',
          resolve: `await ${loaderFileName}.load(context, obj.${field.name})`,
          resolveArgs: 'async (obj, args, context)',
          graphqlType: typeFileName,
          graphqlLoader: loaderFileName,
        };
      }

      return {
        ...graphQLField,
        type: 'GraphQLID',
        flowType: 'string',
      };
    case 'Date':
      return {
        ...graphQLField,
        type: 'GraphQLString',
        flowType: 'string',
        resolve: `obj.${field.name}.toISOString()`,
      };
    default:
      return {
        ...graphQLField,
        type: 'GraphQLString',
        flowType: 'string',
      };
  }
};

export const parseGraphQLSchema = (mongooseFields, ref) => {
  const dependencies = [];
  const typeDependencies = [];
  const loaderDependencies = [];

  // $FlowFixMe
  const fields = Object.keys(mongooseFields).map((name) => {
    const field = parseFieldToGraphQL(mongooseFields[name], ref);

    // we have a special case for array types, since we need to add as dependency
    //  both the GraphQLList and the type itself.
    if (Array.isArray(field.type)) {
      // array of scalar types
      if (!field.graphqlType) {
        if (dependencies.indexOf(field.type[0]) === -1) {
          dependencies.push(field.type[0]);
        }
      } else {
        if (typeDependencies.indexOf(field.graphqlType) === -1) {
          typeDependencies.push(field.graphqlType);
        }

        if (loaderDependencies.indexOf(field.graphqlLoader) === -1) {
          loaderDependencies.push(field.graphqlLoader);
        }
      }

      field.type = `new GraphQLList(${field.type[0]})`;

      if (dependencies.indexOf('GraphQLList') === -1) {
        dependencies.push('GraphQLList');
      }
    } else if (field.graphqlType) {
      if (typeDependencies.indexOf(field.graphqlType) === -1) {
        typeDependencies.push(field.graphqlType);
      }

      if (loaderDependencies.indexOf(field.graphqlLoader) === -1) {
        loaderDependencies.push(field.graphqlLoader);
      }
    } else if (dependencies.indexOf(field.type) === -1) {
      dependencies.push(field.type);
    }

    return field;
  });

  return {
    fields,
    dependencies,
    typeDependencies,
    loaderDependencies,
  };
};

/**
 * Parse the _options_ argument of a Mongoose model and check if it has a `timestamps` entry,
 * parse its content if it does
 * @param nodes {Array} The _options_ argument of `new mongoose.Schema()`
 * @returns {Array} The parsed value of timestamps with the provided field name
 */
const getSchemaTimestampsFromAst = (nodes) => {
  const timestampFields = [];

  nodes.forEach((node) => {
    if (node.key.name === 'timestamps') {
      node.value.properties.forEach((timestampProperty) => {
        const fieldName = timestampProperty.value.value;

        timestampFields[fieldName] = {
          name: fieldName,
          type: 'Date',
        };
      });
    }
  });

  return timestampFields;
};

/**
 * Check if there is an ObjectProperty with key named "type" and with value of type "ArrayExpression".
 * @param properties {Array}
 * @returns {Object} The ObjectProperty if found, undefined otherwise.
 */
const getArrayTypeElementFromPropertiesArray = properties => properties.find(
  ({ key, value: item }) => key.name === 'type' && item.type === 'ArrayExpression',
);

// MemberExpression: { field1: Schema.Types.ObjectId }
// Identifier: { field1: ObjectId }
const validSingleValueTypes = ['MemberExpression', 'Identifier'];

const getFieldDefinition = (field, parent = null) => {
  const value = field.value || field;
  let fieldDefinition = {};

  const isArrayValue = value.type === 'ArrayExpression';
  const isObjectValue = value.type === 'ObjectExpression';
  const isArrayFieldDefinition = isArrayValue || (
    isObjectValue && !!getArrayTypeElementFromPropertiesArray(value.properties)
  );

  // This handles the following array types:
  // [Scalar]
  //  or {type: [Scalar]}
  //  or [{type:ObjectId,ref:'Object'}]
  //  or {type:[ObjectId],ref:'Object'}
  if (isArrayFieldDefinition) {
    if (parent) {
      throw new Error('Nested fields are not supported.');
    }

    let childValue;

    if (isObjectValue) {
      // we are going to change from { type: [Object] } to { type: Object }
      const typeProperty = getArrayTypeElementFromPropertiesArray(value.properties);
      typeProperty.value = typeProperty.value.elements[0];
      childValue = value;
    } else {
      childValue = value.elements[0];
    }

    fieldDefinition = getFieldDefinition(childValue, value);

    // override type, specify Array
    fieldDefinition.childType = fieldDefinition.type;
    fieldDefinition.type = 'Array';
  } else if (validSingleValueTypes.indexOf(value.type) !== -1) {
    fieldDefinition.type = value.property ? value.property.name : value.name;
  } else {
    value.properties.forEach(({ key, value: item }) => {
      fieldDefinition[key.name] = item.name || item.value;
    });
  }

  return fieldDefinition;
};

const getSchemaFieldsFromAst = (node, withTimestamps) => {
  const astSchemaFields = node.arguments[0].properties;

  const fields = [];

  astSchemaFields.forEach((field) => {
    const name = field.key.name;

    const fieldDefinition = getFieldDefinition(field);

    fields[name] = {
      name,
      ...fieldDefinition,
    };
  });

  if (withTimestamps) {
    const astSchemaTimestamp = getSchemaTimestampsFromAst(node.arguments[1].properties);

    return {
      ...fields,
      ...astSchemaTimestamp,
    };
  }

  return fields;
};

export const getSchemaDefinition = (modelCode, withTimestamps, ref) => {
  const ast = recast.parse(modelCode, {
    parser: {
      parse: source => require('babylon').parse(source, { // eslint-disable-line global-require
        sourceType: 'module',
        plugins: [
          'asyncFunctions',
          'asyncGenerators',
          'classConstructorCall',
          'classProperties',
          'flow',
          'objectRestSpread',
          'trailingFunctionCommas',
        ],
      }),
    },
  });

  let fields = null;

  visit(ast, {
    visitExpression: function visitExpression(expressionPath) { // eslint-disable-line object-shorthand
      const { node } = expressionPath;

      if (
        node.type === 'NewExpression' &&
        node.callee.object.name === 'mongoose' &&
        node.callee.property.name === 'Schema'
      ) {
        fields = getSchemaFieldsFromAst(node, withTimestamps);

        this.abort();
      }

      return this.traverse(expressionPath);
    },
  });

  return parseGraphQLSchema(fields, ref);
};
