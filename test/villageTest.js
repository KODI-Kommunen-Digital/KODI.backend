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

const villageRouter = rewire('../routes/village');
villageRouter.__set__('database', database);

const indexFile = rewire('./testServer');
indexFile.__set__('villageRouter', villageRouter);

describe('Village Endpoint Test', () => {
    let mockDbSQL;
    let server;
    let app;


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

    it('should return all villages data', (done) => {
        chai
            .request(app)
            .get('/cities/1/villages')
            .end(async (err, res) => {
                if (err) done(err);
                try {
                    expect(res).to.have.status(200);

                    const dbResponse = await mockDbSQL.all('SELECT * FROM village');
                    expect(res.body.data).to.deep.equal(dbResponse);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });

    it('should return village data for a specific name', async() => {
        const dbResponse = await mockDbSQL.all('SELECT * FROM village WHERE id = ?', [1]);
        const res = await chai
            .request(app)
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
        const dbResponse = await mockDbSQL.all('SELECT * FROM village WHERE name = ?', ['Salzkotten']);
        const res = await chai
            .request(app)
            .get('/cities/1/villages')
            .send();
        const responseDataNames = res.body.data.map((item) => item.name);
        const commonNames = dbResponse
            .map((item) => item.name)
            .filter((name) => responseDataNames.includes(name));
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.name));

    });

    it('non-existent village id', async () => {
        const villageId = Math.floor(Math.random() * 1000);
        const dbResponse = await mockDbSQL.all('SELECT * FROM village WHERE id = ?', [villageId]);
        const res = await chai
            .request(app)
            .get('/cities/1/villages')
            .send();
        const responseDataNames = res.body.data.map((item) => item.id);
        const commonNames = dbResponse
            .map((item) => item.id)
            .filter((id) => responseDataNames.includes(id));
        expect(commonNames).to.deep.equal(dbResponse.map((item) => item.id));

    });
});
