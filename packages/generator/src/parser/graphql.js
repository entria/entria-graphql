/* @flow */
import { uppercaseFirstLetter } from '../ejsHelpers';
import type { MongooseFieldDefinition } from './mongoose';

const MONGOOSE_TYPE_TO_GRAPHQL_TYPE = {
  Number: 'GraphQLInt', // it could be a GraphQLFloat
  Boolean: 'GraphQLBoolean',
  Date: 'GraphQLString',
  ObjectId: 'GraphQLID',
  DEFAULT: 'GraphQLString',
};

const getGraphQLTypeFromMongooseType = (mongooseType: string, mongooseChildType?: string) => {
  return mongooseType in MONGOOSE_TYPE_TO_GRAPHQL_TYPE
    ? MONGOOSE_TYPE_TO_GRAPHQL_TYPE[mongooseType]
    : MONGOOSE_TYPE_TO_GRAPHQL_TYPE.DEFAULT;
};

const MONGOOSE_TYPE_TO_FLOWTYPE = {
  Number: 'number',
  Boolean: 'boolean',
  Date: 'Date',
  ObjectId: 'string',
  DEFAULT: 'string',
};

const getFlowtypeFromMongooseType = (mongooseType: string, mongooseChildType?: string) => {
  if (mongooseType === 'Array') {
    const flowtype = mongooseChildType in MONGOOSE_TYPE_TO_FLOWTYPE
      ? MONGOOSE_TYPE_TO_FLOWTYPE[mongooseChildType]
      : MONGOOSE_TYPE_TO_FLOWTYPE.DEFAULT;

    return `${flowtype}[]`;
  }

  return mongooseType in MONGOOSE_TYPE_TO_FLOWTYPE
    ? MONGOOSE_TYPE_TO_FLOWTYPE[mongooseType]
    : MONGOOSE_TYPE_TO_FLOWTYPE.DEFAULT;
};

type GraphQLField = {
  name: string,
  description: string,
  required: boolean,
  originalType: string, // type from mongoose
  resolve: string, // resolver of this field
  resolveArgs?: string,
  type: string, // GraphQL Type
  flowType: string, // Flow Type
  graphqlType?: string, // graphql type name
  graphqlLoader?: string, // graphql loader name
  listType?: string, // type when using GraphQLList
}
export const parseFieldToGraphQL = (field: MongooseFieldDefinition, ref: boolean): GraphQLField => {
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
        type: getGraphQLTypeFromMongooseType(field.type),
        flowType: getFlowtypeFromMongooseType(field.type),
      };
    case 'Boolean':
      return {
        ...graphQLField,
        type: getGraphQLTypeFromMongooseType(field.type),
        flowType: getFlowtypeFromMongooseType(field.type),
      };
    case 'Array':
      field.type = field.childType;

      parsedChildField = parseFieldToGraphQL(field, ref);
      parsedChildField.flowType = getFlowtypeFromMongooseType('Array', parsedChildField.type);
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

      // TODO - review this
      parsedChildField.listType = parsedChildField.type[0];
      parsedChildField.type = `GraphQLList(${parsedChildField.type[0]})`;

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
          graphqlLoader: loaderFileName
        };
      }

      return {
        ...graphQLField,
        type: getGraphQLTypeFromMongooseType(field.type),
        flowType: getFlowtypeFromMongooseType(field.type),
      };
    case 'Date':
      return {
        ...graphQLField,
        type: getGraphQLTypeFromMongooseType(field.type),
        flowType: getFlowtypeFromMongooseType(field.type),
        resolve: `obj.${field.name} ? obj.${field.name}.toISOString() : null`
      };
    default:
      return {
        ...graphQLField,
        type: getGraphQLTypeFromMongooseType(field.type),
        flowType: getFlowtypeFromMongooseType(field.type),
      };
  }
};
