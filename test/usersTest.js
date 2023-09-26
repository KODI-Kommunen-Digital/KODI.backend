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

const usersRouter = rewire('../routes/users');
usersRouter.__set__('database', database);
usersRouter.__set__('axios', require('./mockDBServices/axios'));
usersRouter.__set__('sendMail', require('./mockDBServices/sendMail'));
usersRouter.__set__('imageDeleteMultiple', require('./mockDBServices/ImageDeleteMultiple'));

const indexFile = rewire('./testServer');
indexFile.__set__('usersRouter', usersRouter);

const MockDb = require("./mockDBServices/mockDb")

const tokenUtil = require('./../utils/token');

const tables = require("../constants/tableNames");

const data = require("./staticdata/usersStaticData1.json");
const data2 = require("./staticdata/usersStaticData2.json");
const crypto = require("crypto");

describe('Users Endpoint Test', () => {
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

    it('login', async () => {
        const requestPayload = {
            username: 'login',
            password: 'Test123!'
        }
        const res = await chai.request(app)
            .post('/users/login')
            .send(requestPayload);

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');
        // expect(res.body.data.accessToken).to.be.not.null;
        // expect(res.body.data.refreshToken).to.be.not.undefined;
    });

    it('register', async () => {
        const requestPayload = {
            username: 'test',
            email: 'test@test.com',
            password: 'Test123!',
            firstname: 'test',
            lastname: 'test'
        }
        const response = await chai.request(app)
            .post('/users/register')
            .send(requestPayload);

        const mockDb = new MockDb();
        const data = await mockDb.get(tables.USER_TABLE, {username: 'test'});
        await mockDb.deleteData(tables.USER_TABLE, {id: data[0].id});
        await mockDb.deleteData(tables.VERIFICATION_TOKENS_TABLE, {userId: data[0].id});
        console.log(response);
    });

    it('get by id', async () => {

        const res = await chai.request(app)
            .get('/users/7')
            .send();

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');
        // expect(res.body.data.id).to.be.not.null;
        // expect(res.body.data.username).to.be.not.undefined;
    });

    it('update user', async () => {

        const token = tokenUtil.generator({
            userId: 7,
            roleId: 1
        }).accessToken;

        const requestPayload = {
            description: 'Updated'
        }

        const res = await chai.request(app)
            .patch('/users/7')
            .set({ "Authorization": `Bearer ${token}` })
            .send(requestPayload);

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');

        const mockDb = new MockDb();
        const userData = await mockDb.get(tables.USER_TABLE, {id: 7});
        expect(userData[0].description).to.equal('Updated');
        await mockDb.update(tables.USER_TABLE, {description: ''},{id: 7});
    });

    it('delete user', async () => {

        const mockDb = new MockDb();

        await mockDb.deleteData(tables.USER_TABLE, {id: 15});
        const newUser = await mockDb.create(tables.USER_TABLE, {id: 15, username: 'testnew'});

        const token = tokenUtil.generator({
            userId: 15,
            roleId: 1
        }).accessToken;


        const res = await chai.request(app)
            .delete('/users/'+newUser[0].insertId)
            .set({ "Authorization": `Bearer ${token}` })
            .send();

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');

        const getUser = await mockDb.get(tables.USER_TABLE, {id: newUser[0].insertId});
        // expect(getUser).to.be.empty;
        console.log(getUser)

    });

    it('get listings by user id', async () => {

        const expectedData = data;
        const token = tokenUtil.generator({
            userId: 7,
            roleId: 1
        }).accessToken;
        const res = await chai.request(app)
            .get('/users/2/listings')
            .set({ "Authorization": `Bearer ${token}`})
            .send();

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');
        // expect(res.body.data).to.be.not.null;
        expect(res.body.data).to.be.deep.equal(expectedData);
    });

    it('refresh', async () => {

        const requestPayload = {
            username: 'login',
            password: 'Test123!'
        }
        const loginRes = await chai.request(app)
            .post('/users/login')
            .send(requestPayload);

        const requestBody = {
            refreshToken: loginRes.body.data.refreshToken
        }
        const res = await chai.request(app)
            .post('/users/7/refresh')
            .send(requestBody);

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');
        // expect(res.body.data).to.be.not.null;
        // expect(res.body.data.refreshToken).to.be.not.null;
        // expect(res.body.data.accessToken).to.be.not.null;
    });

    it('forgotPassword', async () => {

        const requestPayload = {
            username: 'login'
        }
        const res = await chai.request(app)
            .post('/users/forgotPassword')
            .send(requestPayload);

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');
        // expect(res.body.data).to.be.not.null;

        const mockDb = new MockDb();
        const dbEntry = await mockDb.get(tables.FORGOT_PASSWORD_TOKENS_TABLE, {
            userId: 7
        });
        console.log(dbEntry)
        // expect(dbEntry).to.be.not.empty;
    });

    // it('resetPassword', async () => {

    //     const mockDb = new MockDb();

    //     const response = await database.deleteData(
    //         tables.FORGOT_PASSWORD_TOKENS_TABLE,
    //         { userId: 7 }
    //     );

    //     const now = new Date();
    //     now.setMinutes(now.getMinutes() + 30);
    //     const token = crypto.randomBytes(32).toString("hex");
    //     // const tokenData = {
    //     //     userId: 7,
    //     //     token,
    //     //     expiresAt: now.toISOString().slice(0, 19).replace("T", " "),
    //     // };
    //     // response = await database.create(
    //     //     tables.FORGOT_PASSWORD_TOKENS_TABLE,
    //     //     tokenData
    //     // );

    //     const requestPayload = {
    //         userId: 7,
    //         password: 'Test123!',
    //         token,
    //     }
    //     const res = await chai.request(app)
    //         .post('/users/resetPassword')
    //         .send(requestPayload);

    //     expect(res).to.have.status(200);
    //     expect(res.body.status).to.equal('success');
    //     // expect(res.body.data).to.be.not.null;
    //     const dbEntry = await mockDb.get(tables.FORGOT_PASSWORD_TOKENS_TABLE, {
    //         userId: 7
    //     });
    //     console.log(dbEntry)
    // });

    it('sendVerificationEmail', async () => {

        const mockDb = new MockDb();

        await mockDb.deleteData(tables.VERIFICATION_TOKENS_TABLE, {
            userId: 7
        });

        await mockDb.update(
            tables.USER_TABLE,
            {emailVerified: undefined},
            { id: 7 },
        );

        const requestPayload = {
            email: 'username@gmail.com'
        }

        const res = await chai.request(app)
            .post('/users/sendVerificationEmail')
            .send(requestPayload);

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');
        // expect(res.body.data).to.be.not.null;

        const dbEntry = await mockDb.get(tables.VERIFICATION_TOKENS_TABLE, {
            userId: 7
        });
        console.log(dbEntry)
    });

    it('verifyEmail', async () => {

        const mockDb = new MockDb();

        await mockDb.deleteData(tables.VERIFICATION_TOKENS_TABLE, {
            userId: 7
        });

        const now = new Date();
        now.setHours(now.getHours() + 24);
        const token = crypto.randomBytes(32).toString("hex");
        const tokenData = {
            userId: 7,
            token,
            expiresAt: now.toISOString().slice(0, 19).replace("T", " "),
        };
        await database.create(tables.VERIFICATION_TOKENS_TABLE, tokenData);

        const requestPayload = {
            userId: 7,
            token
        }

        const res = await chai.request(app)
            .post('/users/verifyEmail')
            .send(requestPayload);

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');
        // expect(res.body.data).to.be.not.null;

        const dbEntry = await mockDb.get(tables.USER_TABLE, {
            id: 7
        });
        expect(dbEntry[0].emailVerified).to.be.equal(1);
    });

    it('logout', async () => {

        const requestPayload = {
            username: 'login',
            password: 'Test123!'
        }
        const loginRes = await chai.request(app)
            .post('/users/login')
            .send(requestPayload);

        const requestBody = {
            refreshToken: loginRes.body.data.refreshToken
        }

        const res = await chai.request(app)
            .post('/users/7/logout')
            .set({ "Authorization": `Bearer ${loginRes.body.data.accessToken}`})
            .send(requestBody);

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');
        // expect(res.body.data).to.be.not.null;

        const mockDb = new MockDb();
        const dbEntry = await mockDb.get(tables.REFRESH_TOKENS_TABLE, {
            userId: loginRes.body.data.userId,
            refreshToken: loginRes.body.refreshToken
        });
        console.log(dbEntry)
    });

    it('get users', async () => {

        const expectedData = data2;
        const res = await chai.request(app)
            .get('/users/')
            .send();

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');
        // expect(res.body.data).to.be.not.null;
        expect(res.body.data).to.be.deep.equal(expectedData);
    });

    it('post loginDevices', async () => {

        const loginRequestPayload = {
            username: 'login',
            password: 'Test123!'
        }
        const loginRes = await chai.request(app)
            .post('/users/login')
            .send(loginRequestPayload);

        expect(loginRes).to.have.status(200);

        const requestBody = {
            refreshToken: loginRes.body.data.refreshToken
        }

        const token = tokenUtil.generator({
            userId: 7,
            roleId: 1
        }).accessToken;

        const res = await chai.request(app)
            .post('/users/7/loginDevices')
            .set({ "Authorization": `Bearer ${token}`})
            .send(requestBody);

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');
        // expect(res.body.data).to.be.not.null;

        const mockDb = new MockDb();
        const dbGet = await mockDb.get(tables.REFRESH_TOKENS_TABLE, {userId : 7});

        // expect(db\Get).to.be.not.null;
        console.log(dbGet);
    });

    it('delete loginDevices', async () => {

        const refreshToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsInJvbGVJZCI6MSwiaWF0IjoxNjk1NTg3ODE4LCJleHAiOjE2OTYwMTk4MTh9.ZF7uLDF2dK6VxxkD81bsXTVUeIXSOUPnQwv7ZwCzSnlYR0x7ShHoKoQdh9om5kG6ETARqwQK1NdVdgs_urMDpMkO4iB-2zz2C16Jtwy9mjhU0tuXys21B1bPQXArXHNfmM8PJb_sza96mP9VK1kFtidbjXUV1tgVWsS3RDicYYHpLPIrG_rXzDvXKwVtmeRe_Ih5qlP_t6y0tzhuFRz-_kAPlyH3_hh1D_0BnNShfcbLr2DlR5hduBFoeChVqi1fiPzhZOgLd9lODj7gn_f5LPXBER_IaYH2IuSdrXWviw5Sq98TJ02GOx9MF-Okusawfrfyfp6NHzBEECeWS9twlQ';

        const mockDb = new MockDb();
        const dbCreate = await mockDb.create(tables.REFRESH_TOKENS_TABLE, {userId : 7, refreshToken});
        console.log(dbCreate)

        const requestBody = {
            refreshToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsInJvbGVJZCI6MSwiaWF0IjoxNjk1NTU0MzUyLCJleHAiOjE2OTU5ODYzNTJ9.dPbU2P2XkcCyIebtoMwh5JNbf7Rg0QZ7CAeqTWusslPOQVvCT1d3o22qAHvIDo3dvhYW7CcXDOGPtvJG34qbzAMeJPKoznvRng29dBYS_CL-bEWM3EWIC_TrUwo6jK2uc0_LlRdNc_VANBIEOE7s4jEl0J_ag5tLyf_yofQV3MZowNaCQMdLkTGHyS1ZXR2_G49S0BQrPoatMT7PRKu24i2UfLdpiNHX5HdDKuS7xlFLY42VPj7lHF8l0v6ECH6JKBVpgnEq62AnEQ1vYJXLhizuuiwe6yaMua7hODQwRfjrABA7VcI8jyOLRUHCF0I4GQMia79pkkWt7e8JapsTbQ'
        }

        const token = tokenUtil.generator({
            userId: 7,
            roleId: 1
        }).accessToken;

        const res = await chai.request(app)
            .delete('/users/7/loginDevices')
            .set({ "Authorization": `Bearer ${token}`})
            .send(requestBody);

        expect(res).to.have.status(200);
        expect(res.body.status).to.equal('success');

        const dbGet = await mockDb.get(tables.REFRESH_TOKENS_TABLE, refreshToken);
        console.log(dbGet)
    });


});
