const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../testServer'); 
const createCitizenServicesMockDatabase = require('./citizenServicesDB'); 
const expect  =chai.expect;
const { describe, before, after, it } = require('mocha');
chai.use(chaiHttp);

describe('Citizen Services Endpoint Test', () => {
    let mockDb;
    before(async () => {
        try {
            mockDb = await createCitizenServicesMockDatabase();
        } catch (err) {
            console.error('Error creating mock database:', err);
        }
    });

    after(async () => {
        try {
            if (mockDb) {
                await mockDb.close();
            }
            server.close();
        } catch (err) {
            console.error('Error closing mock database or server:', err);
        }
    });

    it('should return all citizen services data when no cityId is provided', (done) => {
        let expectedData;
        mockDb.all('SELECT * FROM CITIZEN_SERVICES')
            .then((dbResponse) => {
                expectedData = dbResponse.map((item) => ({
                    id: item.id,
                    cityId: item.cityId,
                    title: item.title,
                    image: item.image,
                    link: item.link
                }));    
                return chai.request(server).get('/citizenServices').send();
            })
            .then((res) => {
                const responseData = res.body.data;
                expect(res).to.have.status(200);
                expect(res.body.status).to.equal('success');
                expect(responseData).to.deep.equal(expectedData);
                done();
            })
            .catch((err) => {
                console.error('Error:', err);
                done(err);
            });
    });
    it('should handle an valid cityId', (done) => {
        const cityId = 1; 
        let expectedData;
        mockDb.all(`SELECT * FROM CITIZEN_SERVICES WHERE cityId=${cityId} `)
            .then((dbResponse) => {
                expectedData = dbResponse.map((item) => ({
                    id: item.id,
                    cityId: item.cityId,
                    title: item.title,
                    image: item.image,
                    link: item.link
                }));    
                return chai.request(server).get(`/citizenServices?cityId=${cityId}`).send();
            })
            .then((res) => {
                const responseData = res.body.data;
                expect(res).to.have.status(200);
                expect(res.body.status).to.equal('success');
                expect(responseData[0]).to.deep.equal(expectedData[0]);
                done();
            })
    });
    it('should handle an invalid cityId by returning a 404 error', (done) => {
        const cityId = 999; 
        mockDb.all(`SELECT * FROM CITIZEN_SERVICES WHERE cityId=${cityId} `)
            .then(() => {
                return chai.request(server).get(`/citizenServices?cityId=${cityId}`).send();
            })
            .then((res) => {
                expect(res).to.have.status(400);
                expect(res.body.status).to.equal('error');
                done();
            })
    });
    
    

});



   