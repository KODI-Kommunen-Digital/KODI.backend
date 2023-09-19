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

const citizenServicesRouter = rewire('../routes/citizenServices');
citizenServicesRouter.__set__('database', database);

const indexFile = rewire('./testServer');
indexFile.__set__('citizenServicesRouter', citizenServicesRouter);

describe('Citizen Services Endpoint Test', () => {
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

    it('should return all citizen services data when no cityId is provided', (done) => {
        let expectedData;
        mockDbSQL.all('SELECT * FROM CITIZEN_SERVICES')
            .then((dbResponse) => {
                expectedData = dbResponse.map((item) => ({
                    id: item.id,
                    cityId: item.cityId,
                    title: item.title,
                    image: item.image,
                    link: item.link
                }));
                return chai.request(app).get('/citizenServices').send();
            })
            .then((res) => {
                const responseData = res.body.data;
                try {
                    expect(res).to.have.status(200);
                    expect(res.body.status).to.equal('success');
                    expect(responseData).to.deep.equal(expectedData);
                    done();
                }catch (e){
                    done(e);
                }
            })
            .catch((err) => {
                console.error('Error:', err);
                done(err);
            });
    });
    it('should handle an valid cityId', (done) => {
        const cityId = 1;
        let expectedData;
        mockDbSQL.all(`SELECT * FROM CITIZEN_SERVICES WHERE cityId=${cityId} `)
            .then((dbResponse) => {
                expectedData = dbResponse.map((item) => ({
                    id: item.id,
                    cityId: item.cityId,
                    title: item.title,
                    image: item.image,
                    link: item.link
                }));
                return chai.request(app).get(`/citizenServices?cityId=${cityId}`).send();
            })
            .then((res) => {
                const responseData = res.body.data;
                try{
                    expect(res).to.have.status(200);
                    expect(res.body.status).to.equal('success');
                    expect(responseData[0]).to.deep.equal(expectedData[0]);
                    done();
                }catch (e){
                    done(e);
                }
            })
    });
    it('should handle an invalid cityId by returning a 404 error', (done) => {
        const cityId = Math.floor(Math.random() * 1000);
        mockDbSQL.all(`SELECT * FROM CITIZEN_SERVICES WHERE cityId=${cityId} `)
            .then(() => {
                return chai.request(app).get(`/citizenServices?cityId=${cityId}`).send();
            })
            .then((res) => {
                expect(res).to.have.status(400);
                expect(res.body.status).to.equal('error');
                done();
            })
    });



});
