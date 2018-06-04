/* @flow */
import recast from 'recast';
import type { GraphQLField } from './graphql';
import { parseFieldToGraphQL } from './graphql';

const { visit } = recast.types;

type MongooseFields = {
  [key: string]: MongooseFieldDefinition,
};
export const parseGraphQLSchema = (mongooseFields: MongooseFields, ref: boolean) => {
  const dependencies = new Set();
  const typeDependencies = new Set();
  const loaderDependencies = new Set();

  const fields: GraphQLField[] = Object.keys(mongooseFields).map((name: string) => {
    const field = parseFieldToGraphQL(mongooseFields[name], ref);

    // we have a special case for array types, since we need to add as dependency
    //  both the GraphQLList and the type itself.
    if (Array.isArray(field.type)) {
      // array of scalar types
      if (!field.graphqlType) {
        dependencies.add(field.type[0]);
      } else {
        typeDependencies.add(field.graphqlType);
        loaderDependencies.add(field.graphqlLoader);
      }

      field.type = `GraphQLList(${field.type[0]})`;

      dependencies.add('GraphQLList');
    } else if (field.graphqlType) {
      typeDependencies.add(field.graphqlType);
      loaderDependencies.add(field.graphqlLoader);

    } else {
      dependencies.add(field.type);
    }

    return field;
  });

  return {
    fields,
    dependencies: [...dependencies],
    typeDependencies: [...typeDependencies],
    loaderDependencies: [...loaderDependencies],
  };
};

/**
 * Parse the _options_ argument of a Mongoose model and check if it has a `timestamps` entry,
 * parse its content if it does
 * @param nodes {Array} The _options_ argument of `new mongoose.Schema()`
 * @returns {Array} The parsed value of timestamps with the provided field name
 */
const getSchemaTimestampsFromAst = (nodes: ArgumentProperty[]) => {
  const timestampFields = {};

  // TODO - use filter and reduce
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
const getArrayTypeElementFromPropertiesArray = (properties: ArgumentProperty[]) => properties.find(
  ({ key, value: item }) => key.name === 'type' && item.type === 'ArrayExpression',
);

// MemberExpression: { field1: Schema.Types.ObjectId }
// Identifier: { field1: ObjectId }
const validSingleValueTypes = ['MemberExpression', 'Identifier'];

const FIELD_TYPE = {
  Number: 'Number',
  Boolean: 'Boolean',
  Array: 'Array',
  ObjectId: 'ObjectId',
  Date: 'Date',
};

type FieldType = $Values<typeof FIELD_TYPE>;

export type MongooseFieldDefinition = {
  name: string,
  type: FieldType,
  childType?: string,
  [key: string]: string,

  description?: string,
  required?: boolean,
};

type ArgumentValue = {
  type: string,
  properties: ArgumentProperty[],
  value: string,
}
type ArgumentProperty = {
  key: {
    name: string,
  },
  value: ArgumentValue,
};
const getFieldDefinition = (field: ArgumentProperty, parent = null): MongooseFieldDefinition => {
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

    return fieldDefinition;
  }

  if (validSingleValueTypes.indexOf(value.type) !== -1) {
    fieldDefinition.type = value.property ? value.property.name : value.name;

    return fieldDefinition;
  }

  value.properties.forEach(({ key, value: item }) => {
    fieldDefinition[key.name] = item.name || item.value;
  });

  return fieldDefinition;
};

type Argument = {
  properties: ArgumentProperty[],
};
type Callee = {
  object: {
    name: string,
  },
  property: {
    name: string,
  },
};
type Node = {
  type: string,
  callee: Callee,
  arguments: Argument[],
}
const getSchemaFieldsFromAst = (node: Node, withTimestamps: boolean) => {
  const astSchemaFields = node.arguments[0].properties;

  const fields = {};

  astSchemaFields.forEach((field) => {
    const { name } = field.key;

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

export const getSchemaDefinition = (modelCode: string, withTimestamps: boolean, ref: boolean) => {
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