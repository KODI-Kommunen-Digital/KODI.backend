const chai = require('chai');
const expect = chai.expect;
const app = require('../testServer');
const createCityMockDatabase = require('./citiesDB');
const { describe, before, after, it } = require('mocha');
describe('Cities Endpoint Test', () => {
    let mockDb; 

    before(async () => {

        mockDb = await createCityMockDatabase();

    });

    after(() => {
        mockDb.close();
    });

    it('should return a list of cities without filters', (done) => {
        let expectedData;

        mockDb.all('SELECT id, name, image FROM cities')
            .then((dbResponse) => {
                expectedData = dbResponse.map((item) => ({
                    id: item.id,
                    name: item.name,
                    image: item.image,
                }));
    
                return chai.request(app).get('/cities').send();
            })
            .then((res) => {
                const responseData = res.body.data;
                expect(res).to.have.status(200);
    
                // Sort both arrays by id for comparison
                responseData.sort((a, b) => a.id - b.id);
                expectedData.sort((a, b) => a.id - b.id);
                expect(res.body.status).to.equal('success');
                expect(responseData).to.deep.equal(expectedData);
                done();
            })
    })


              
});