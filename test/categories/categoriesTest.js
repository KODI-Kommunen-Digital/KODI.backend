const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../testServer'); 
const createCategoriesMockDatabase = require('./categoriesDB'); 
const expect = chai.expect;
const { describe, before, after, it } = require('mocha');
chai.use(chaiHttp);

describe('Categories Endpoint Test', () => {
    let mockDb;

    before(async () => {
        try {
            mockDb = await createCategoriesMockDatabase();
        } catch (err) {
            console.error('Error creating mock database:', err);
        }
    });

    after(async () => {
        try {
            if (mockDb) {
                await mockDb.close();
            }
            server.close();
        } catch (err) {
            console.error('Error closing mock database or server:', err);
        }
    });

    it('should return all categories', (done) => {
        mockDb.all('SELECT * FROM categories')
            .then((dbResponse) => {
                const expectedData = dbResponse.map((item) => ({
                    id: item.id,
                    name: item.name,
                    noOfSubcategories: item.noOfSubcategories,
                }));

                chai.request(server)
                    .get('/categories')
                    .end((err, res) => {
                        if (err) {
                            return done(err);
                        }

                        const responseData = res.body.data;
                        expect(res).to.have.status(200);
                        expect(responseData).to.deep.equal(expectedData);
                        done();
                    });
            })
            .catch((err) => {
                console.error('Error:', err);
                done(err);
            });
    });

    it('should return subcategories for a specific category', (done) => {
        const categoryId = 1; 
        let expectedData;

        mockDb.all('SELECT * FROM subcategory WHERE categoryId = ?', [categoryId])
            .then((dbResponse) => {
                expectedData = dbResponse.map((item) => ({
                    id: item.id,
                    name: item.name,
                    categoryId: item.categoryId,
                }));
                return chai.request(server).get(`/categories/${categoryId}/subcategories`).send();
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
    });

    it('should return listings count for a specific cityId', (done) => {
        const cityId = 1; 
        const query = `SELECT categoryId, COUNT(*) as count FROM heidi_city_${cityId}.listings GROUP BY categoryId;`;
        const mockResponse = [
            { categoryId: 10, count: 1 },
        ];
        chai.request(server)
            .get(`/categories/listingsCount?cityId=${cityId}`)
            .end(async (err, res) => {
                if (err) {
                    return done(err);
                }
                mockDb.exec = async (sql) => {
                    if (sql === query) {
                        return {
                            all: async () => mockResponse,
                        };
                    }
                };
                expect(res).to.have.status(200);
                expect(res.body.status).to.equal('success');
                expect(res.body.data).to.deep.equal(mockResponse);
                done();
            });
    });

    it('should handle an invalid cityId by returning a 404 error', (done) => {
        const invalidCityId = Math.floor(Math.random() * 1000);
        chai.request(server)
            .get(`/categories/listingsCount?cityId=${invalidCityId}`)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                expect(res).to.have.status(404);
                expect(res.body.message).to.equal(`Invalid City '${invalidCityId}' given`);
                done();
            });
    });
});