const chai = require('chai');
const expect = chai.expect;

const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const { describe, before, after, it } = require('mocha');

const rewire = require('rewire');
const path = require("path");

const {open} = require("sqlite");
const coreDbPath = path.join(__dirname, 'test.db');
const cityDbPath = path.join(__dirname, 'city-1.db');
const sqlite3 = require('sqlite3').verbose();

const mockConnection = require('./mockDBServices/mockConnection')

const database = rewire('./../services/database');
database.__set__('getConnection', mockConnection.getConnection);

const cityListingsRouter = rewire('./../routes/listings');
cityListingsRouter.__set__('database', database);

const indexFile = rewire('./testServer');
indexFile.__set__('listingsRouter', cityListingsRouter);

// const data = require("./staticdata/listingsStaticData1.json");

describe(' Listing Endpoints Test', () => {
    let coreDb;
    let cityDb;
    let app;
    let server;

    before(async () => {
        coreDb = await open({
            filename: coreDbPath,
            driver: sqlite3.Database,
        });
        cityDb = await open({
            filename: cityDbPath,
            driver: sqlite3.Database,
        });
        server = new indexFile.Server();
        app = server.init();
    });

    after(async () => {
        await server.close();
        await coreDb.close();
        await cityDb.close();
    });

    it('get api', async () => {
        const expectedData = [];

        const res = await chai.request(app)
            .get('/listings')
            .send();

        const responseData = res.body.data;
        expect(res).to.have.status(200);

        // Sort both arrays by id for comparison
        responseData.sort((a, b) => a.id - b.id);
        expectedData.sort((a, b) => a.id - b.id);
        expect(res.body.status).to.equal('success');
        expect(responseData).to.deep.equal(expectedData);
    });


});
