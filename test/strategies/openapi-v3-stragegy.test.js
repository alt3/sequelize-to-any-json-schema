/* eslint-disable no-unused-vars */

/**
 * Please note that we are ONLY testing strategy-specific behavior here. All
 * non-strategy-specific tests are handled by the StrategyInterface test case.
 */

const _cloneDeep = require('lodash.clonedeep');
const SwaggerParser = require('swagger-parser');
const models = require('../models');
const { JsonSchemaManager, OpenApi3Strategy } = require('../../lib');
const schemaWrapper = require('./openapi-v3-validation-wrapper');

describe('OpenApi3Strategy', function() {
  describe('Test output using default options', function() {
    // ------------------------------------------------------------------------
    // generate schema
    // ------------------------------------------------------------------------
    const schemaManager = new JsonSchemaManager({
      disableComments: false,
    });
    const strategy = new OpenApi3Strategy();
    const schema = schemaManager.generate(models.user, strategy);

    // ------------------------------------------------------------------------
    // make sure sequelize DataTypes render as expected
    // ------------------------------------------------------------------------
    describe('Ensure Sequelize DataTypes are properly converted and thus:', function() {
      describe('STRING_ALLOWNULL_EXPLICIT', function() {
        it("has property 'type' of type 'string'", function() {
          expect(schema.properties.STRING_ALLOWNULL_EXPLICIT.type).toEqual('string');
        });

        it("has property 'nullable' of type 'boolean'", function() {
          expect(typeof schema.properties.STRING_ALLOWNULL_EXPLICIT.nullable).toEqual('boolean');
        });
      });

      // Sequelize allows null values by default so we need to make sure rendered schema
      // keys allow null by default (even when not explicitely setting `allowNull: true`)
      describe('STRING_ALLOWNULL_IMPLICIT', function() {
        it("has property 'type' of type 'string'", function() {
          expect(schema.properties.STRING_ALLOWNULL_IMPLICIT.type).toEqual('string');
        });

        it("has property 'nullable' of type 'boolean'", function() {
          expect(typeof schema.properties.STRING_ALLOWNULL_IMPLICIT.nullable).toEqual('boolean');
        });
      });

      describe('JSONB_ALLOWNULL', function() {
        it("has property 'anyOf' with values of type 'object', 'array', 'boolean', 'integer', 'number' and 'string'", function() {
          expect(schema.properties.JSONB_ALLOWNULL.anyOf).toEqual([
            { type: 'object' },
            { type: 'array' },
            { type: 'boolean' },
            { type: 'integer' },
            { type: 'number' },
            { type: 'string' },
          ]);
        });

        it("has property 'nullable' of type 'boolean'", function() {
          expect(typeof schema.properties.JSONB_ALLOWNULL.nullable).toEqual('boolean');
        });
      });

      describe('ARRAY_ALLOWNULL_EXPLICIT', function() {
        it("has property 'type' of type 'string'", function() {
          expect(schema.properties.ARRAY_ALLOWNULL_EXPLICIT.type).toEqual('array');
        });

        it("has property 'nullable' of type 'boolean'", function() {
          expect(typeof schema.properties.ARRAY_ALLOWNULL_EXPLICIT.nullable).toEqual('boolean');
        });
      });

      describe('ARRAY_ALLOWNULL_IMPLICIT', function() {
        it("has property 'type' of type 'string'", function() {
          expect(schema.properties.ARRAY_ALLOWNULL_IMPLICIT.type).toEqual('array');
        });

        it("has property 'nullable' of type 'boolean'", function() {
          expect(typeof schema.properties.ARRAY_ALLOWNULL_IMPLICIT.nullable).toEqual('boolean');
        });
      });
    });

    // ------------------------------------------------------------------------
    // make sure custom Sequelize attribute options render as expected
    // ------------------------------------------------------------------------
    describe('Ensure custom Sequelize attribute options render as expected and thus:', function() {
      describe('CUSTOM_DESCRIPTION', function() {
        it(`has property 'description' with the expected string value`, function() {
          expect(schema.properties.CUSTOM_DESCRIPTION.description).toEqual(
            'Custom attribute description',
          );
        });
      });

      describe('CUSTOM_EXAMPLES', function() {
        it("has property 'example' of type 'array'", function() {
          expect(Array.isArray(schema.properties.CUSTOM_EXAMPLES.example)).toBe(true);
        });

        it('with the two expected string values', function() {
          expect(schema.properties.CUSTOM_EXAMPLES.example).toEqual([
            'Custom example 1',
            'Custom example 2',
          ]);
        });
      });

      describe('CUSTOM_READONLY', function() {
        it(`has property 'readOnly' with value 'true'`, function() {
          expect(schema.properties.CUSTOM_READONLY.readOnly).toEqual(true);
        });
      });

      describe('CUSTOM_WRITEONLY', function() {
        it(`has property 'writeOnly' with value 'true'`, function() {
          expect(schema.properties.CUSTOM_WRITEONLY.writeOnly).toEqual(true);
        });
      });
    });

    // ------------------------------------------------------------------------
    // make sure associations render as expected
    // ------------------------------------------------------------------------
    describe('Ensure associations are properly generated and thus:', function() {
      describe("user.HasOne(profile) generates singular property 'profile' with:", function() {
        it("property '$ref' pointing to '#/components/schemas/profile'", function() {
          expect(schema.properties.profile.$ref).toEqual('#/components/schemas/profile');
        });
      });

      describe("user.HasOne(user, as:boss) generates singular property 'boss' with:", function() {
        it("property '$ref' pointing to '#/components/schemas/user'", function() {
          expect(schema.properties.boss.$ref).toEqual('#/components/schemas/user');
        });
      });

      describe("user.BelongsTo(company) generates singular property 'company' with:", function() {
        it("property '$ref' pointing to '#/components/schemas/company'", function() {
          expect(schema.properties.company.$ref).toEqual('#/components/schemas/company');
        });
      });

      describe("user.HasMany(document) generates plural property 'documents' with:", function() {
        it("property 'type' with value 'array'", function() {
          expect(schema.properties.documents.type).toEqual('array');
        });

        it("array 'items' holding an object with '$ref' pointing to '#/components/schemas/document'", function() {
          expect(schema.properties.documents.items).toEqual({
            $ref: '#/components/schemas/document', // eslint-disable-line unicorn/prevent-abbreviations
          });
        });
      });

      describe("user.BelongsToMany(user) generates plural property 'friends' with:", function() {
        it("property 'type' with value 'array'", function() {
          expect(schema.properties.friends.type).toEqual('array');
        });

        it("property 'items.allOf' of type 'array'", function() {
          expect(Array.isArray(schema.properties.friends.items.allOf)).toBe(true);
        });

        it("array 'items.allOf' holding an object with '$ref' pointing to '#/components/schemas/user'", function() {
          expect(schema.properties.friends.items.allOf[0]).toEqual({
            $ref: '#/components/schemas/user', // eslint-disable-line unicorn/prevent-abbreviations
          });
        });

        it("array 'items.allOf' holding an object with type object and properties.friendships an object with '$ref' pointing at '#/components/schemas/friendship'", function() {
          expect(schema.properties.friends.items.allOf[1]).toEqual({
            type: 'object',
            properties: {
              friendships: {
                $ref: '#/components/schemas/friendship', // eslint-disable-line unicorn/prevent-abbreviations
              },
            },
          });
        });
      });
    });

    // ------------------------------------------------------------------------
    // make sure the resultant document is valid OpenAPI 3.0
    //
    // Please note that we MUST include the profiles and documents schemas or
    // the $refs will not resolve causing the validation to fail.
    // ------------------------------------------------------------------------
    describe('Ensure that the resultant document:', function() {
      schemaWrapper.components.schemas.user = schema;
      schemaWrapper.components.schemas.profile = schemaManager.generate(models.profile, strategy);
      schemaWrapper.components.schemas.document = schemaManager.generate(models.document, strategy);
      schemaWrapper.components.schemas.company = schemaManager.generate(models.company, strategy);
      schemaWrapper.components.schemas.friendship = schemaManager.generate(
        models.friendship,
        strategy,
      );

      it("has leaf /openapi with string containing version '3.n.n'", function() {
        expect(schemaWrapper.openapi).toMatch(/^3\.\d\.\d/); // 3.n.n
      });

      it('has non-empty container /components/schemas/user', function() {
        expect(Object.keys(schemaWrapper.components.schemas.user).length).toBeGreaterThan(0);
      });

      // validate document using Swagger Parser
      it('successfully validates as JSON API 3.0', async () => {
        expect.assertions(1);

        // https://github.com/APIDevTools/swagger-parser/issues/77
        // @todo: enable once fixed, now blocks husky pre-commit hooks
        const result = await SwaggerParser.validate(_cloneDeep(schemaWrapper));
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
