/* eslint-disable no-unused-vars */

const _ = require('lodash'); // limit later to `merge`, `capitalize`, etc.
const SwaggerParser = require('swagger-parser');
const models = require('../models');
const { SchemaManager, OpenApi3Strategy } = require('../../lib');
const schemaWrapper = require('./openapi-v3-validation-wrapper');

describe('OpenApi3Strategy', function() {
  describe('Test output using default options', function() {
    // ------------------------------------------------------------------------
    // generate schema
    // ------------------------------------------------------------------------
    const schemaManager = new SchemaManager();
    const strategy = new OpenApi3Strategy();
    const schema = schemaManager.generate(models.user.build(), strategy);

    // ------------------------------------------------------------------------
    // confirm sequelize model properties render as expected
    // ------------------------------------------------------------------------
    describe('Ensure schema.model:', function() {
      it("has property 'title' with value 'users'", function() {
        expect(schema).toHaveProperty('title');
        expect(schema.title).toEqual('User');
      });

      it("has property 'type' with value 'object'", function() {
        expect(schema).toHaveProperty('type');
        expect(schema.type).toEqual('object');
      });
    });

    // ------------------------------------------------------------------------
    // confirm sequelize attributes render as expected
    // ------------------------------------------------------------------------
    describe('Ensure Sequelize DataTypes are properly converted and thus:', function() {
      describe('_STRING_ALLOWNULL_', function() {
        it("has property 'type' of type 'string'", function() {
          expect(schema.properties).toHaveProperty('_STRING_ALLOWNULL_');
          expect(schema.properties._STRING_ALLOWNULL_).toHaveProperty('type');
          expect(schema.properties._STRING_ALLOWNULL_.type).toEqual('string');
        });

        it("has property 'nullable' of type 'boolean'", function() {
          expect(schema.properties._STRING_ALLOWNULL_).toHaveProperty('nullable');
          expect(typeof schema.properties._STRING_ALLOWNULL_.nullable).toEqual('boolean');
        });
      });
    });

    // ------------------------------------------------------------------------
    // confirm user-definable attribute properties render as expected
    // ------------------------------------------------------------------------
    describe('Ensure user-enriched Sequelized attributes are properly converted and thus:', function() {
      describe('_USER_ENRICHED_PROPERTIES_', function() {
        it("has property 'description' of type 'string'", function() {
          expect(schema.properties).toHaveProperty('_USER_ENRICHED_PROPERTIES_');
          expect(schema.properties._USER_ENRICHED_PROPERTIES_).toHaveProperty('description');
          expect(typeof schema.properties._USER_ENRICHED_PROPERTIES_.description).toBe('string');
        });

        it("has property 'example' of type 'array'", function() {
          expect(schema.properties._USER_ENRICHED_PROPERTIES_).toHaveProperty('example');
          expect(Array.isArray(schema.properties._USER_ENRICHED_PROPERTIES_.example)).toBe(true);
        });
      });
    });

    // ------------------------------------------------------------------------
    // confirm the document is valid OpenAPI 3.0
    // ------------------------------------------------------------------------
    describe('Ensure that the resultant document:', function() {
      schemaWrapper.components.schemas.users = schema;

      it("has leaf /openapi with string containing version '3.n.n'", function() {
        expect(schemaWrapper).toHaveProperty('openapi');
        expect(schemaWrapper.openapi).toMatch(/^3\.\d\.\d/); // 3.n.n
      });

      it('has non-empty container /components/schemas/users', function() {
        expect(schemaWrapper.components.schemas).toHaveProperty('users');
        expect(Object.keys(schemaWrapper.components.schemas.users).length).toBeGreaterThan(0);
      });

      // validate document using Swagger Parser
      it('successfully validates as JSON API 3.0', async () => {
        expect.assertions(1);

        // https://github.com/APIDevTools/swagger-parser/issues/77
        // @todo: enable once fixed, now blocks husky pre-commit hooks
        const result = await SwaggerParser.validate(_.cloneDeep(schemaWrapper));
        expect(result).toHaveProperty('info');
      });
    });

    // @todo this should be detected by eslint-plugin-jest no-disabled-tests (but is not)
    // test('', function() {
    //   console.log('Does nothing');
    // });

    // @todo add this to the StrategyInterface test suite, it should throw an exception
    // Model.rawAttributes._FAKE_TYPE_ = {
    //   type: "FAKETYPE"
    // };
  });
});

/*
describe('foo', () => {});
*/
