const ModbusRTU = require("modbus-serial");
const mysql = require("mysql2/promise");

const client = new ModbusRTU();
const HOST = "192.168.0.202";
const PORT = 502;
const ADDRESS = 0;
const ADDRESS_2 = 1000;
const SLAVE_ID = 1; 

const DB_HOST = "localhost";
const DB_USER = "root";
const DB_PASSWORD = "";
const DB_DATABASE = "tk4s";
const DB_TABLE = "temperature_ruangan";
const DB_UPDATE_ID = 1;

async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_DATABASE,
    });

    console.log("Connected to database");

    return connection;
  } catch (error) {
    console.error(`Error connecting to database: ${error}`);
    process.exit(1);
  }
}

async function updateValueInDatabase(connection, value) {
  try {
    const roundedValue = parseFloat(value.toFixed(1));
    const [rows, fields] = await connection.execute(
      `UPDATE ${DB_TABLE} SET sv = ? WHERE id = ?`,
      [roundedValue, DB_UPDATE_ID]
    );
  } catch (error) {
    console.error(`Error updating value in database: ${error}`);
  }
}


async function updateValueInDatabasepv(connection, value) {
  try {
    const roundedValue = parseFloat(value.toFixed(1));
    const [rows, fields] = await connection.execute(
      `UPDATE ${DB_TABLE} SET pv = ? WHERE id = ?`,
      [roundedValue, DB_UPDATE_ID]
    );
  } catch (error) {
    console.error(`Error updating value in database: ${error}`);
  }
}

client
  .connectTCP(HOST, { port: PORT })
  .then(() => {
    client.setID(SLAVE_ID);
    connectToDatabase().then((connection) => {
      setInterval(() => {
        client.readHoldingRegisters(ADDRESS, 2, function (err, data) {
          if (err) {
            console.error(`Error reading data: ${err}`);
            process.exit(1);
          } else {
          
            
            // Read the data as a signed integer
            const buffer = Buffer.from(data.buffer);
            const value = buffer.readInt16BE();
            
            // console.log(value);
            updateValueInDatabase(connection, value);
          }
        });
      }, 1000);
    });
  })

  client
  .connectTCP(HOST, { port: PORT })
  .then(() => {
    client.setID(SLAVE_ID);
    connectToDatabase().then((connection) => {
      setInterval(() => {
        client.readInputRegisters(ADDRESS_2, 2, function (err, data) {
          if (err) {
            console.error(`Error reading data: ${err}`);
            process.exit(1);
          } else {
          
            
            // Read the data as a signed integer
            const buffer = Buffer.from(data.buffer);
            const value = buffer.readInt16BE();
            
            console.log(value);
            updateValueInDatabasepv(connection, value);
          }
        });
      }, 1000);
    });
  })

  
  .catch((error) => {
    console.error(`Error connecting to Modbus TCP server: ${error}`);
    process.exit(1);
  });
