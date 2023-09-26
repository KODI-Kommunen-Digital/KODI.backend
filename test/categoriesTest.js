const chai = require('chai');
const expect = chai.expect;

const { describe, before, after, it } = require('mocha');

const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const rewire = require('rewire');
const path = require("path");

const {open} = require("sqlite");
const dbPath = path.join(__dirname, '.', 'test.db');
const sqlite3 = require('sqlite3').verbose();

const mockConnection = require('./mockDBServices/mockConnection')

const database = rewire('../services/database');
database.__set__('getConnection', mockConnection.getConnection);

const categoriesRouter = rewire('../routes/categories');
categoriesRouter.__set__('database', database);

const indexFile = rewire('./testServer');
indexFile.__set__('categoriesRouter', categoriesRouter);

describe('Categories Endpoint Test', () => {
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

    it('should return all categories', (done) => {

        mockDbSQL.all('SELECT * FROM categories')
            .then((dbResponse) => {
                const expectedData = dbResponse.map((item) => ({
                    id: item.id,
                    name: item.name,
                    noOfSubcategories: item.noOfSubcategories,
                }));

                chai.request(app)
                    .get('/categories')
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }
                        const responseData = res.body.data;
                        expect(res).to.status(200);
                        expect(responseData).to.deep.equal(expectedData);
                        done();
                    });
            })
            .catch((err) => {
                console.error('Error:', err);
                done(err);
            });

    }).timeout(3000);

    it('should return subcategories for a specific category', (done) => {
        const categoryId = 1;
        let expectedData;

        mockDbSQL.all('SELECT * FROM subcategory WHERE categoryId = ?', [categoryId])
            .then((dbResponse) => {
                expectedData = dbResponse.map((item) => ({
                    id: item.id,
                    name: item.name,
                    categoryId: item.categoryId,
                }));
                return chai.request(app).get(`/categories/${categoryId}/subcategories`).send();
            })
            .then((res) => {
                const responseData = res.body.data;
                expect(res).to.have.status(200);
                expect(res.body.status).to.equal('success');
                expect(responseData).to.deep.equal(expectedData);
                expect(responseData[0].categoryId).to.deep.equal(categoryId);
                done();
            })
            .catch((err) => {
                console.error('Error:', err);
                done(err);
            });
    }).timeout(3000);

    it('should return listings count for a specific cityId', (done) => {
        const cityId = 1;
        const query = `SELECT categoryId, COUNT(*) as count FROM heidi_city_${cityId}.listings GROUP BY categoryId;`;
        const mockResponse = [];
        chai.request(app)
            .get(`/categories/listingsCount?cityId=${cityId}`)
            .end(async (err, res) => {
                if (err) {
                    return done(err);
                }
                mockDbSQL.exec = async (sql) => {
                    if (sql === query) {
                        return {
                            all: async () => mockResponse,
                        };
                    }
                };
                try {
                    expect(res).to.have.status(200);
                    expect(res.body.status).to.equal('success');
                    expect(res.body.data ).to.deep.equal(mockResponse);
                    done();
                }
                catch (err){
                    done(err);
                }
            });

    }).timeout(3000);

    it('should handle an invalid cityId by returning a 404 error', (done) => {
        const invalidCityId = Math.floor(Math.random() * 1000);
        chai.request(app)
            .get(`/categories/listingsCount?cityId=${invalidCityId}`)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                expect(res).to.have.status(404);
                expect(res.body.message).to.equal(`Invalid City '${invalidCityId}' given`);
                done();
            });
    }).timeout(3000);
});
