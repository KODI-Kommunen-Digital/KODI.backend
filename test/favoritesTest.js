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

const data = require("./staticdata/favoritesStaticData1.json");
const MockDb = require("./mockDBServices/mockDb")

const tables = require("../constants/tableNames");

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
        await server.close();
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
        const expectedData =data;
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

    it('post api', (done) => {
        new Promise((resolve) => {
            const requestBody = {
                cityId: 1,
                listingId: 1
            }

            const response = chai.request(app)
                .post('/users/7/favorites')
                .set({ "Authorization": `Bearer ${token}` })
                .send(requestBody);
            resolve(response);
        })
            .then((res) => {
                const responseData = JSON.parse(res.text);
                expect(res).to.have.status(200);
                // expect(responseData).to.be.not.undefined;
                // expect(responseData.id).to.be.not.undefined;
                done();
                return responseData.id;
            })
            .then((id) =>{
                console.log(id);
                return coreDb.all(`DELETE FROM ${tables.FAVORITES_TABLE} where id = ${id}`);
            })
    });

    it('delete', async () => {
        const newFavorite = {
            id: 90,
            userId: 7,
            cityId: 1,
            listingId: 1
        };

        const mockDb = new MockDb();
        await mockDb.create(tables.FAVORITES_TABLE, newFavorite);
        const res = await chai.request(app)
            .delete(`/users/7/favorites/90`)
            .set({ "Authorization": `Bearer ${token}` })
            .send();

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');
    
    });


});
