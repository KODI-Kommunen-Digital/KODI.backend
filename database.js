let mysql = require('mysql');

let connection = mysql.createConnection({
    host:'localhost',
    user: 'root',
    password: 'sonu12345',
    database: 'tester'
});

connection.connect();

const sql = `CREATE TABLE Persons ( 
  username varchar(255),
  lastname varchar(255),
  firstname varchar(255), 
  image varchar(255), 
  description varchar(255),
  website varchar(255),
  password varchar(255),
  email varchar(255),
  id int PRIMARY KEY,
  role int
  );`;

  connection.query(sql, (error, results) => {
    if (error){

     throw error;
    }
    else{
      console.log("Connection done::---" + results)
    }
  });

  connection.end();