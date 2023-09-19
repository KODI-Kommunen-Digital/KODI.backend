const chai = require('chai');
const expect  =chai.expect;

const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const { describe, before, after, it } = require('mocha');

const rewire = require('rewire');
const path = require("path");

const {open} = require("sqlite");
const dbPath = path.join(__dirname, '.', 'test.db');
const sqlite3 = require('sqlite3').verbose();

const mockConnection = require('./mockDBServices/mockConnection')

const database = rewire('../services/database');
database.__set__('getConnection', mockConnection.getConnection);

const statusRouter = rewire('../routes/status');
statusRouter.__set__('database', database);

const indexFile = rewire('./testServer');
indexFile.__set__('statusRouter', statusRouter);

describe('Endpoint Test with Mock Database', () => {
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

    it('should return all status data', (done) => {
        chai
            .request(app)
            .get('/status')
            .end(async (err, res) => {
                if (err) done(err);
                expect(res).to.have.status(200);
                try {
                    const dbResponse = await mockDbSQL.all('SELECT * FROM status');
                    expect(res.body.data).to.deep.equal(dbResponse);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });

    it('should return status data for a specific name', async() => {
        const dbResponse = await mockDbSQL.all('SELECT * FROM status WHERE name = ?', ['Active']);
        const res = await chai
            .request(app)
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
        const dbResponse = await mockDbSQL.all('SELECT * FROM status WHERE name = ?', ['Green']);
        const res = await chai
            .request(app)
            .get('/status')
            .send();
        const responseDataNames = res.body.data.map((item) => item.name);
        const commonNames = dbResponse
            .map((item) => item.name)
            .filter((name) => responseDataNames.includes(name));
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.name));

    });

    it('non-existent status id', async () => {
        const dbResponse = await mockDbSQL.all('SELECT * FROM status WHERE id = ?', [4]);
        const res = await chai
            .request(app)
            .get('/status')
            .send();
        const responseDataNames = res.body.data.map((item) => item.id);
        const commonNames = dbResponse
            .map((item) => item.id)
            .filter((id) => responseDataNames.includes(id));
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.id));

    });
});
