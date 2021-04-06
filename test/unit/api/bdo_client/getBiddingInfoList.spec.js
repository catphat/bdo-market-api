const doTest = require('../../../helpers/bdoClientHandlerTest');

describe('bdo_client/getBiddingInfoList', () => {
  const config = {
    responseFile: 'biddinginfolist-11629.json',
    expectedFile: 'biddinginfolist-expected-parse-11629.json',
    handler: 'getBiddingInfoList',
    params: { mainKey: 11629, subKey: 0, keyType: 0 },
    validation: {
      mainKey: ['isRequired', 'isPositiveNumber'],
      subKey: ['isPositiveNumber'],
      keyType: ['isPositiveNumber'],
    },
  };

  doTest(config);
});
