const {
  getRawResponse, describe, expect, it, nock,
} = require('../../../helpers/bdo_client');

const { GetWorldMarketSubList } = require('../../../../src/api/bdo_client/index');

describe('GetWorldMarketSubList method', () => {
  const worldMarketSubList = new GetWorldMarketSubList('NA');
  const responseJSON = getRawResponse('worldmarketsublist-11607.json');
  const invalidResponseTXT = getRawResponse('invalid-response.txt');
  const reqParams = worldMarketSubList.getRequestParameters(11607);

  it('has valid request parameters', () => {
    const req = worldMarketSubList.getRequestParameters(11607);
    expect(req.url.href).to.equal('http://127.0.0.1:8000/Trademarket/GetWorldMarketSubList');
    expect(req.opt.method).to.equal('POST');
    expect(req.opt.body).to.equal('{"keyType":0,"mainKey":11607}');
  });

  it('byMainKeyAndKeyType has valid handling of req/resp', async () => {
    nock(`http://${reqParams.url.host}`)
      .post(reqParams.url.pathname)
      // eslint-disable-next-line func-names
      .reply((uri, requestBody) => {
        expect(uri).to.equal('/Trademarket/GetWorldMarketSubList');
        expect(requestBody.mainKey).to.equal(11607);
        expect(requestBody.keyType).to.equal(0);

        return [
          200,
          responseJSON,
          { 'Content-Type': 'application/json' }];
      });

    const resp = await new GetWorldMarketSubList('NA').byMainKeyAndKeyType(11607);
    const parsedResp = GetWorldMarketSubList.handleResponse(resp);
    expect(resp.resultCode).to.equal(0);
    expect(parsedResp.isValid).to.be.true;
    expect(parsedResp.marketSubList[1].itemId).to.equal(11607);
    expect(parsedResp.marketSubList[1].enhancementMin).to.equal(1);
    expect(parsedResp.marketSubList[1].enhancementMax).to.equal(1);
    expect(parsedResp.marketSubList[1].enhancementMax).to.equal(1);
    expect(parsedResp.marketSubList[1].basePrice).to.equal(238000000);
    expect(parsedResp.marketSubList[1].currentStock).to.equal(37);
    expect(parsedResp.marketSubList[1].totalTrades).to.equal(59163);
    expect(parsedResp.marketSubList[1].priceHardCapMin).to.equal(25900000);
    expect(parsedResp.marketSubList[1].priceHardCapMax).to.equal(775000000);
    expect(parsedResp.marketSubList[1].lastSalePrice).to.equal(221000000);
    expect(parsedResp.marketSubList[1].lastSaleTime).to.equal(1616799742);
    expect(parsedResp.errorMsg).to.be.undefined;
  });

  it('byMainKeyAndKeyType throws on invalid HTTP status code', async () => {
    nock(`http://${reqParams.url.host}`)
      .post(reqParams.url.pathname)
      // eslint-disable-next-line func-names
      .reply((uri, requestBody) => {
        expect(uri).to.equal('/Trademarket/GetWorldMarketSubList');
        expect(requestBody.mainKey).to.equal(11607);
        expect(requestBody.keyType).to.equal(0);

        return [
          444, invalidResponseTXT];
      });

    await expect(new GetWorldMarketSubList('NA').byMainKeyAndKeyType(11607)).to.be.rejectedWith(Error);
  });
});