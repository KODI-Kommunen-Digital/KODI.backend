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

const cityListingsRouter = rewire('./../routes/cityListings');
cityListingsRouter.__set__('database', database);

const indexFile = rewire('./testServer');
indexFile.__set__('cityListingsRouter', cityListingsRouter);

const tokenUtil = require("../utils/token");

const data = require("./staticdata/cityListingsStatic1.json");
const data2 = require("./staticdata/cityListingsStatic2.json");
const tables = require("../constants/tableNames");
const MockDb = require("./mockDBServices/mockDb");


describe('City Listing Endpoints Test', () => {
    let coreDb;
    let cityDb;
    let app;
    let server;
    let token;
    before(async () => {
        token = tokenUtil.generator({
            userId: 7,
            roleId: 1
        }).accessToken;

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
        // await server.close();
        await coreDb.close();
        await cityDb.close();
    });

    it('get listing of a particular category and statusId', (done) => {
        const expectedData = data;

        new Promise((resolve) => {

            const response = chai.request(app)
                .get('/cities/1/listings?statusId=1&categoryId=3')
                .send();

            resolve(response);
        }).then((res) => {
            const responseData = res.body.data;
            try {
                expect(res).to.have.status(200);

                // Sort both arrays by id for comparison
                responseData.sort((a, b) => a.id - b.id);
                expectedData.sort((a, b) => a.id - b.id);
                expect(res.body.status).to.equal('success');
                expect(responseData).to.deep.equal(expectedData);
                done();
            }catch (err){
                done(err)
            }
        })
    });

    it('get a particular listing', (done) => {
        const expectedData = data2;

        new Promise((resolve) => {

            const response = chai.request(app)
                .get('/cities/1/listings/4')
                .send();
            resolve(response);
        }).then((res) => {
            const responseData = res.body.data;
            try {
                expect(res).to.have.status(200);
                expect(res.body.status).to.equal('success');
                expect(responseData).to.deep.equal(expectedData);
                done();
            } catch (err) {
                done(err);
            }
        })
    });

    it('post a particular listing', (done) => {
        const requestData = {
            "userId":7,
            "roleId":1,
            "cityId":1,
            "villageId": 1,
            "title": "new",
            "place": "Bochum",
            "description": "Test",
            "categoryId": 1
        };

        new Promise((resolve) => {

            const response = chai.request(app)
                .post('/cities/1/listings/')
                .set({ "Authorization": `Bearer ${token}`})
                .send(requestData);
            resolve(response);
        }).then((res) => {
            let responseData = res.body.data;
            responseData = JSON.parse(res.text);
            expect(res).to.have.status(200);
            // expect(responseData).to.be.not.undefined;
            // expect(responseData.id).to.be.not.undefined;
            done();
            return responseData.id;
        }).then((id) =>{
            return coreDb.all(`DELETE FROM ${tables.LISTINGS_TABLE} where id = ${id}`);
        }).catch((err) => {
            done(err);
        })
    });

    it('update a particular listing', async () => {

        const newListings = {
            "id":100,
            "userId":1,
            "title":'test',
            "place":'',
            "description":'Test',
            "categoryId":1,
            "statusId":1,
            "sourceId":1,
            "villageId":1,
            "createdAt": '2023-09-08 10:19:35'
        };
        const mockDb = new MockDb('1');
        await mockDb.create(tables.LISTINGS_TABLE, newListings);

        const requestData= newListings;
        requestData.description = 'Changed';

        const response = await chai.request(app)
            .patch('/cities/1/listings/'+newListings.id)
            .set({ "Authorization": `Bearer ${token}`})
            .send(requestData);

        const updatedEntry = await mockDb.get( tables.LISTINGS_TABLE, {id: 100});
        await mockDb.deleteData( tables.LISTINGS_TABLE, {id: 100});

        expect(response).to.have.status(200);
        // expect(response.body).to.be.not.undefined;
        expect(updatedEntry[0].description).to.equal(requestData.description);
    });

    it('delete a particular listing ', async () => {

        const newListings = {
            "id":99,
            "userId":1,
            "title":'test',
            "place":'',
            "description":'Test',
            "categoryId":1,
            "statusId":1,
            "sourceId":1,
            "villageId":1,
            "createdAt": '2023-09-08 10:19:35'
        };

        const mockDb = new MockDb('1');
        await mockDb.create( tables.LISTINGS_TABLE, newListings);
        const res = await chai.request(app)
            .delete(`/cities/1/listings/99`)
            .set({ "Authorization": `Bearer ${token}` })
            .send();

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');
    });

    // it('post image', (done) => {
    //     let expectedData;
    //
    //     coreDb.all('SELECT id, name, image FROM cities')
    //         .then((dbResponse) => {
    //             expectedData = dbResponse.map((item) => ({
    //                 id: item.id,
    //                 name: item.name,
    //                 image: item.image,
    //             }));
    //
    //             return chai.request(app)
    //                 .post('/cities/1/listings/1/imageUpload')
    //                 .set({ "Authorization": `Bearer ${token}` })
    //                 .send();
    //         })
    //         .then((res) => {
    //             const responseData = res.body.data;
    //             expect(res).to.have.status(200);
    //
    //             // Sort both arrays by id for comparison
    //             responseData.sort((a, b) => a.id - b.id);
    //             expectedData.sort((a, b) => a.id - b.id);
    //             expect(res.body.status).to.equal('success');
    //             expect(responseData).to.deep.equal(expectedData);
    //             done();
    //         })
    // });
    //
    // it('delete image', (done) => {
    //     let expectedData;
    //
    //     coreDb.all('SELECT id, name, image FROM cities')
    //         .then((dbResponse) => {
    //             expectedData = dbResponse.map((item) => ({
    //                 id: item.id,
    //                 name: item.name,
    //                 image: item.image,
    //             }));
    //
    //             return chai.request(app)
    //                 .delete('/cities/1/listings/1/imageDelete')
    //                 .set({ "Authorization": `Bearer ${token}` })
    //                 .send();
    //         })
    //         .then((res) => {
    //             const responseData = res.body.data;
    //             expect(res).to.have.status(200);
    //
    //             // Sort both arrays by id for comparison
    //             responseData.sort((a, b) => a.id - b.id);
    //             expectedData.sort((a, b) => a.id - b.id);
    //             expect(res.body.status).to.equal('success');
    //             expect(responseData).to.deep.equal(expectedData);
    //             done();
    //         })
    // });

});
