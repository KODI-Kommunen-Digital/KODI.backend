const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../testServer'); 
const createMockDatabase = require('./statusDb');
const { expect } = chai;
chai.use(chaiHttp);
const { describe, before, after, it } = require('mocha');

describe('Endpoint Test with Mock Database', () => {
    let mockDb; 
    before(async () => {
        try {
            mockDb = await createMockDatabase();
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

    it('should return all status data', (done) => {
        chai
            .request(server)
            .get('/status')
            .end(async (err, res) => {
                if (err) done(err);
                expect(res).to.have.status(200);
                try {
                    const dbResponse = await mockDb.all('SELECT * FROM status');
                    expect(res.body.data).to.deep.equal(dbResponse);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });

    it('should return status data for a specific name', async() => {
        const dbResponse = await mockDb.all('SELECT * FROM status WHERE name = ?', ['Active']);
        const res = await chai
            .request(server)
            .get('/status') 
            .send();
        const responseDataNames = res.body.data.map((item) => item.name);
        const commonNames = dbResponse
            .map((item) => item.name)
            .filter((name) => responseDataNames.includes(name));
        expect(res).to.have.status(200);
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.name));
       
    });

    it('non-existent status name', async () => {
        const dbResponse = await mockDb.all('SELECT * FROM status WHERE name = ?', ['Green']);
        const res = await chai
            .request(server)
            .get('/status') 
            .send();
        const responseDataNames = res.body.data.map((item) => item.name);
        const commonNames = dbResponse
            .map((item) => item.name)
            .filter((name) => responseDataNames.includes(name));
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.name));
  
    });
  
    it('non-existent status id', async () => {
        const dbResponse = await mockDb.all('SELECT * FROM status WHERE id = ?', [4]);
        const res = await chai
            .request(server)
            .get('/status') 
            .send();
        const responseDataNames = res.body.data.map((item) => item.id);
        const commonNames = dbResponse
            .map((item) => item.id)
            .filter((id) => responseDataNames.includes(id));
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.id));
     
    });
});
