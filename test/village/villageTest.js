const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../testServer');
const createVillageMockDatabase = require('./villageDb');
const { expect } = chai;
chai.use(chaiHttp);
const { describe, before, after, it } = require('mocha');
  
describe('Village Endpoint Test', () => {
    let mockDb; 

    before(async () => {
        try {
            mockDb = await createVillageMockDatabase();
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

    it('should return all villages data', (done) => {
        chai
            .request(server)
            .get('/cities/1/villages')
            .end(async (err, res) => {
                if (err) done(err);
                expect(res).to.have.status(200);

                try {
                    const dbResponse = await mockDb.all('SELECT * FROM village');
                    expect(res.body.data).to.deep.equal(dbResponse);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });

    it('should return village data for a specific name', async() => {
        const dbResponse = await mockDb.all('SELECT * FROM village WHERE id = ?', [1]);
        const res = await chai
            .request(server)
            .get('/cities/1/villages') 
            .send();
        const responseDataNames = res.body.data.map((item) => item.id);
        const commonNames = dbResponse
            .map((item) => item.id)
            .filter((id) => responseDataNames.includes(id));
        expect(res).to.have.status(200);
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.id));
       
    });

    it('non-existent village name', async () => {
        const dbResponse = await mockDb.all('SELECT * FROM village WHERE name = ?', ['Salzkotten']);
        const res = await chai
            .request(server)
            .get('/cities/1/villages') 
            .send();
        const responseDataNames = res.body.data.map((item) => item.name);
        const commonNames = dbResponse
            .map((item) => item.name)
            .filter((name) => responseDataNames.includes(name));
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.name));
  
    });
  
    it('non-existent village id', async () => {
        const dbResponse = await mockDb.all('SELECT * FROM village WHERE id = ?', [4]);
        const res = await chai
            .request(server)
            .get('/cities/1/villages') 
            .send();
        const responseDataNames = res.body.data.map((item) => item.id);
        const commonNames = dbResponse
            .map((item) => item.id)
            .filter((id) => responseDataNames.includes(id));
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.id));
     
    });
});
