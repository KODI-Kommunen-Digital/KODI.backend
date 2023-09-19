const chai = require('chai');
const expect = chai.expect;

const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const { describe, before, after, it } = require('mocha');

const rewire = require('rewire');
const path = require("path");

const {open} = require("sqlite");
const dbPath = path.join(__dirname, '.', 'test.db');
const sqlite3 = require('sqlite3').verbose();

const mockConnection = require('./services/mockConnection')

const database = rewire('../services/database');
database.__set__('getConnection', mockConnection.getConnection);

const citiesRouter = rewire('../routes/cities');
citiesRouter.__set__('database', database);

const indexFile = rewire('./testServer');
indexFile.__set__('citiesRouter', citiesRouter);

describe('Cities Endpoint Test', () => {
    let mockDbSQL;
    let app;
    let server;

    before(async () => {
        mockDbSQL = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        server = new indexFile.Server();
        app = server.init();
    });

    after(async () => {
        await server.close();
        await mockDbSQL.close();
    });

    it('should return a list of cities without filters', (done) => {
        let expectedData;

        mockDbSQL.all('SELECT id, name, image FROM cities')
            .then((dbResponse) => {
                expectedData = dbResponse.map((item) => ({
                    id: item.id,
                    name: item.name,
                    image: item.image,
                }));

                return chai.request(app)
                    .get('/cities')
                    .send();
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
