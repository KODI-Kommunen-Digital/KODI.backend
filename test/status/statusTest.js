const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../testServer'); // Import your test server
const createMockDatabase = require('./statusDb');
const { expect } = chai;
chai.use(chaiHttp);
const { describe, before, after, it } = require('mocha');

describe('Endpoint Test with Mock Database', () => {
    let mockDb; // Declare a variable to hold the mock database instance

    // Before running the tests, create the mock database and start the server
    before(async () => {
        try {
            // Create the mock database
            mockDb = await createMockDatabase();
        } catch (err) {
            console.error('Error creating mock database:', err);
        }
    });

    // After running the tests, close the mock database and stop the server
    after(async () => {
        try {
            // Close the mock database if it's defined
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

                // Ensure the response status code is 200
                expect(res).to.have.status(200);

                try {
                    // Retrieve data from the mock database
                    const dbResponse = await mockDb.all('SELECT * FROM status');
                    // Compare the entire response body with the data from the mock database
                    expect(res.body.data).to.deep.equal(dbResponse);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });

    it('should return status data for a specific name', async() => {
        // Retrieve data from the mock database where name = 'Green'
        const dbResponse = await mockDb.all('SELECT * FROM status WHERE name = ?', ['Active']);

        // Make a request to the endpoint
        const res = await chai
            .request(server)
            .get('/status') 
            .send();


        // Extract the names from res.body.data
        const responseDataNames = res.body.data.map((item) => item.name);
        const commonNames = dbResponse
            .map((item) => item.name)
            .filter((name) => responseDataNames.includes(name));
        // Compare the data from res.body.data with dbResponse
        expect(res).to.have.status(200);
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.name));
       
    });

    it('non-existent status name', async () => {
        // Retrieve data from the mock database where name = 'Green'
        const dbResponse = await mockDb.all('SELECT * FROM status WHERE name = ?', ['Green']);

        // Make a request to the endpoint
        const res = await chai
            .request(server)
            .get('/status') 
            .send();


        // Extract the names from res.body.data
        const responseDataNames = res.body.data.map((item) => item.name);
        const commonNames = dbResponse
            .map((item) => item.name)
            .filter((name) => responseDataNames.includes(name));
        // Compare the data from res.body.data with dbResponse
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.name));
  
    });
  
    it('non-existent status id', async () => {
        // Retrieve data from the mock database where name = 'Green'
        const dbResponse = await mockDb.all('SELECT * FROM status WHERE id = ?', [4]);

        // Make a request to the endpoint
        const res = await chai
            .request(server)
            .get('/status') 
            .send();


        // Extract the names from res.body.data
        const responseDataNames = res.body.data.map((item) => item.id);
        const commonNames = dbResponse
            .map((item) => item.id)
            .filter((id) => responseDataNames.includes(id));
        // Compare the data from res.body.data with dbResponse
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.id));
     
    });
});
