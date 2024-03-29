const doTest = require('../../../helpers/bdoClientHandlerTest');

describe('bdo_client/getWorldMarketSubList', () => {
  const config = {
    responseFile: 'worldmarketsublist-11607.json',
    expectedFile: 'worldmarketsublist-expected-parse-11607.json',
    handler: 'getWorldMarketSubList',
    params: { mainKey: 11607, keyType: 1 },
    paramsRequired: { mainKey: 11607, keyType: 0 },
    paramsExpected: { mainKey: 11607, keyType: 0 },
    validation: {
      mainKey: ['isRequired', 'isPositiveNumber'],
      keyType: ['isRequired', 'isNonNegativeNumber'],
    },
  };

  doTest(config);
});
