const { response, json } = require('express');
const e = require('express');
var express = require('express');
var passport = require('passport');
const HeaderAPIKeyStrategy = require('passport-headerapikey').HeaderAPIKeyStrategy;
var app = express();
var fs = require("fs");
const {MongoClient} = require('mongodb');
const uri = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false";
const client = new MongoClient(uri);
const { Pool } = require('pg')


async function listDatabases(client){
    databasesList = await client.db().admin().listDatabases(); 
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};
 
async function insPerson() {
  try {
    // Connect the client to the server
    await client.connect();
    const database = client.db("crdb");
    const physicalentities = database.collection("citizens");
    // create a document to be inserted
    const pe = { _id:713242, pin: "000012345678", name: "GEORGE", lastName: "PAPACHARALAMBOUS",latinName:"GEORGIOS",latinLastName:"PAPACHARALAMBOUS",  mother : { id:3948384, pin: "000012345679", name:"DESPINA", surname:"PAPACHARALAMBOUS", maiden:"JAMES"} ,dob : new Date("1979-11-15"), cob: "600", gender: "1", nationality:"600", creationDate: new Date(), lastUpdatedDate: new Date(), height: 183 };
    const result = await physicalentities.insertOne(pe);
    console.log(
      `${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`,
    );
     
  // Query for a movie that has the title 'The Room'
  const query = { _id: result.insertedId};
  const options = {
  // sort matched documents in descending order by rating
  sort: { name: -1 }//,
  // Include only the `title` and `imdb` fields in the returned document
  // projection: { _id: 0, id: 1, name: 1, lastName: 1,  },
  };
  const obj = await physicalentities.findOne(query, options);
  // since this method returns the matched document, not a cursor, print it directly
  return obj;
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

async function run() {
    try {
      // Connect the client to the server
      await client.connect();
      // Establish and verify connection
      await client.db("admin").command({ ping: 1 });
      console.log("Connected successfully to server");
      await listDatabases(client);
      const database = client.db("sportsdb");
      const sports = database.collection("sport");
      // create a document to be inserted
      const doc = { name: "Table Tennis", id: 103 };
      const result = await sports.insertOne(doc);
      console.log(
        `${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`,
      );
    
     
    // Query for a movie that has the title 'The Room'
    const query = { name: "Tennis"};
    const options = {
    // sort matched documents in descending order by rating
    sort: { name: -1 },
    // Include only the `title` and `imdb` fields in the returned document
     projection: { _id: 0, id: 1, name: 1 },
    };
    const sport = await sports.findOne(query, options);
    // since this method returns the matched document, not a cursor, print it directly
    console.log(sport);
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }

  passport.use(new HeaderAPIKeyStrategy(
    { header: 'X-Api-Key', prefix: '' },
    false,
    function (apikey, done) {
        console.log(apikey);
       
        /* User.findOne({ apikey: apikey }, (err, user) => {
            if (err) {
                console.error(err);
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }
            return done(null, user);
        });
        */
        const user = { username: 'george', userKey: 'blahblah'};
        if (apikey===user.userKey)
        {        
          return done(null,user);
        }
        else{
        return done(null,false);
        }
     
    }
));

app.post('/authenticate', passport.authenticate('headerapikey', {session: false}), (req,res) => {
  console.log('authenticated!');
  res.status(req.user? 200 : 401).send({ user: `${req.user.username}`})
 });


     

  app.get('/postgres', function (req, res) {
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'sportsdb',
        password: 'sql',
        port: 5432,
      });

    const q = `SELECT * FROM sport`;
  
    pool.query(q, (err, result) => {

        var listOfObjects = [];

        if (err) {
            console.error(err);
            return;
        }        
        for (let row of result.rows) {
          
            listOfObjects.push(row);  
            console.log(JSON.stringify(listOfObjects));        
        }       
        pool.end();
        res.end(JSON.stringify(listOfObjects));
    });   
   
 })




app.get('/listUsers', function (req, res) {
   fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
      console.log( data );
      res.end( data );
   });
})


app.get('/insertPerson', function (req, res) {
   // run().catch(console.dir);
   // First read existing users.
  var obj  = insPerson().catch(console.dir);
  console.log( obj );
  res.end( JSON.stringify(obj));
})

 app.get('/getPerson/:id', async function (req, res) {
  try {
    // Connect the client to the server
    await client.connect();
    const database = client.db("crdb");
    const physicalentities = database.collection("citizens");
    
    const query = { pin: req.params.id};
    const options = {
    // sort matched documents in descending order by rating
    sort: { pin: -1 },
    // Include only the `title` and `imdb` fields in the returned document
    projection: { _id: 0  },
    };
    const obj = await physicalentities.findOne(query, options);   
  // since this method returns the matched document, not a cursor, print it directly
    console.log( JSON.stringify(obj));
    res.end( JSON.stringify(obj));
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
})

app.get('/:id', function (req, res) {
   // run().catch(console.dir);
    // First read existing users.
    fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
       var users = JSON.parse( data );
       var user = users["user" + req.params.id] 
       console.log( user );
       res.end( JSON.stringify(user));
    });
 })

 var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})