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

const database = rewire('../services/database');
database.__set__('getConnection', mockConnection.getConnection);

const favoritesRouter = rewire('../routes/favorites');
favoritesRouter.__set__('database', database);

const indexFile = rewire('./testServer');
indexFile.__set__('favoriteRouter', favoritesRouter);

const tokenUtil = require('./../utils/token');

const tables = require("../constants/tableNames");
const data1 = require("./staticdata/favoritesStaticData1.json")

describe('Favorites Endpoint Test', () => {
    let coreDb;
    let cityDb;
    let app;
    let server;
    let token;

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

        token = tokenUtil.generator({
            userId: 7,
            roleId: 1
        }).accessToken;
    });

    after(async () => {
        // await server.close();
        await coreDb.close();
        await cityDb.close();
    });

    it('get api', (done) => {
        let expectedData;

        coreDb.all('SELECT id, userId, cityId, listingId FROM favorites')
            .then((dbResponse) => {
                expectedData = dbResponse;

                return chai.request(app)
                    .get('/users/7/favorites/')
                    .set({ "Authorization": `Bearer ${token}` })
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
    });

    it('get api 2', (done) => {
        const expectedData = data1;

        new Promise((resolve) => {
            const response = chai.request(app)
                .get('/users/7/favorites/listings')
                .set({ "Authorization": `Bearer ${token}` })
                .send();
            resolve(response);
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
    });

    // todo: fix below

    it('post api', (done) => {

        new Promise((resolve) => {
            const requestBody = {cityId: 1, listingId: 1}

            const response = chai.request(app)
                .post('/users/7/favorites')
                .set({ "Authorization": `Bearer ${token}` })
                .send(requestBody);
            resolve(response);
        })
            .then((res) => {
                const responseData = JSON.parse(res.text);
                expect(res).to.have.status(200);
                done();
                return responseData.id;
            })
            .then((id) =>{
                console.log(id);
                return coreDb.all(`DELETE FROM ${tables.FAVORITES_TABLE} where id = ${id}`);
            })
    });

    it('delete', (done) => {
        let expectedData;

        coreDb.all('SELECT id, name, image FROM cities')
            .then((dbResponse) => {
                expectedData = dbResponse.map((item) => ({
                    id: item.id,
                    name: item.name,
                    image: item.image,
                }));

                return chai.request(app)
                    .delete('/users/1/favorites/1')
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
    });


});
