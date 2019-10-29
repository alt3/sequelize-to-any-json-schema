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
    const userSchema = schemaManager.generate(models.user, strategy);

    // ------------------------------------------------------------------------
    // make sure sequelize DataTypes render as expected
    // ------------------------------------------------------------------------
    describe('Ensure Sequelize DataTypes are properly converted and thus:', function() {
      describe('STRING_ALLOWNULL', function() {
        it("has property 'type' of type 'string'", function() {
          expect(userSchema.properties.STRING_ALLOWNULL.type).toEqual('string');
        });

        it("has property 'nullable' of type 'boolean'", function() {
          expect(typeof userSchema.properties.STRING_ALLOWNULL.nullable).toEqual('boolean');
        });
      });
    });

    // ------------------------------------------------------------------------
    // make sure custom Sequelize attribute options render as expected
    // ------------------------------------------------------------------------
    describe('Ensure custom Sequelize attribute options render as expected and thus:', function() {
      describe('CUSTOM_DESCRIPTION', function() {
        it(`has property 'description' with the expected string value`, function() {
          expect(userSchema.properties.CUSTOM_DESCRIPTION.description).toEqual(
            'Custom attribute description',
          );
        });
      });

      describe('CUSTOM_EXAMPLES', function() {
        it("has property 'example' of type 'array'", function() {
          expect(Array.isArray(userSchema.properties.CUSTOM_EXAMPLES.example)).toBe(true);
        });

        it('with the two expected string values', function() {
          expect(userSchema.properties.CUSTOM_EXAMPLES.example).toEqual([
            'Custom example 1',
            'Custom example 2',
          ]);
        });
      });

      describe('CUSTOM_READONLY', function() {
        it(`has property 'readOnly' with value 'true'`, function() {
          expect(userSchema.properties.CUSTOM_READONLY.readOnly).toEqual(true);
        });
      });

      describe('CUSTOM_WRITEONLY', function() {
        it(`has property 'writeOnly' with value 'true'`, function() {
          expect(userSchema.properties.CUSTOM_WRITEONLY.writeOnly).toEqual(true);
        });
      });
    });

    // ------------------------------------------------------------------------
    // make sure associations render as expected
    // ------------------------------------------------------------------------
    describe('Ensure associations are properly generated and thus:', function() {
      describe("user.HasOne(profile) generates singular property 'profile' with:", function() {
        it("property '$ref' pointing to plural '#/components/schemas/profiles'", function() {
          expect(userSchema.properties.profile.$ref).toEqual('#/components/schemas/profiles');
        });
      });

      describe("user.HasMany(document) generates plural property 'documents' with:", function() {
        it("property 'type' with value 'array'", function() {
          expect(userSchema.properties.documents.type).toEqual('array');
        });

        it("property 'items.oneOf' of type 'array'", function() {
          expect(Array.isArray(userSchema.properties.documents.items.oneOf)).toBe(true);
        });

        it("array 'items.oneOf' holding an object with '$ref' pointing to plural '#/components/schemas/documents'", function() {
          expect(userSchema.properties.documents.items.oneOf[0]).toEqual({
            $ref: '#/components/schemas/documents', // eslint-disable-line unicorn/prevent-abbreviations
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
      schemaWrapper.components.schemas.users = userSchema;
      schemaWrapper.components.schemas.profiles = schemaManager.generate(models.profile, strategy);
      schemaWrapper.components.schemas.documents = schemaManager.generate(
        models.document,
        strategy,
      );

      it("has leaf /openapi with string containing version '3.n.n'", function() {
        expect(schemaWrapper.openapi).toMatch(/^3\.\d\.\d/); // 3.n.n
      });

      it('has non-empty container /components/schemas/users', function() {
        expect(Object.keys(schemaWrapper.components.schemas.users).length).toBeGreaterThan(0);
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
