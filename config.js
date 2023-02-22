const config = {
  db: {
    host:'localhost',
    user: 'devuser',
    password: 'devpassword',
    database: 'heidi_local'
  },
  imagePath: "./images"
};

const coreDbConfig = {
  db:{
    host: 'localhost',
    user: 'devuser',
    password: 'devpassword',
    database: 'core_db',
  }
};

const cityDbConfigs = [
  {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'city0_db',
    dialect: 'mysql'
  },
  {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'city1_db',
    dialect: 'mysql'
  },
  {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'city2_db',
    dialect: 'mysql'
  },
  {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'city3_db',
    dialect: 'mysql'
  },
  {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'city4_db',
    dialect: 'mysql'
  },
  {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'city5_db',
    dialect: 'mysql'
  }
  // add more city databases as needed
];
module.exports = {config, coreDbConfig, cityDbConfigs };