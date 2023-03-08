const config = {
  db: {
    host:'localhost',
    user: 'devuser',
    password: 'devpassword',
    database: 'heidi_core'
  },
  port: 8001,
  imagePath: "./images",
  keycloak: {
    client_id: "demo-api",
    client_secret: "vAJLUOF2EqkDg9j8YONPu6lGujxDrj0s",
    realm: "Demo-Realm",
    domain: "http://localhost:8080",
    rsaPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv2s05IbpZpxY2rca1A6nXwMA3uvj3tuCCsjNW6HdpG7TjeshUllBay5PVVjj0lUluNPvFLMBENvihdeBSNtuBvA6vOKQ/i8Trm7my2NLd83BqrqM/LCb9z4fcPsJNItr/ZQ05nQQmib+eFrz7yEiSwdobPl/duC7KipVRt96x+C5tcqCDbCa8tXyhzQfHEJShd0QHFd1cJioh9riOHdNxV0S+L3qbxc7vC3A7CVxnJGC4XgeOwmhEV10UhRsxxMBfQzlSh172UeD7EJWapyyj2ew5prTYFJ+1gwOFAf7ivC1oldahEMkPY1lkbQ55coLB98R+hREShVM5XiwJ1rijwIDAQAB'  
  }};

module.exports = config;