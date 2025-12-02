const pool = require("./src/db");

async function testDB(){
    try{
        const [rows] = await pool.query("SELECT COUNT(*) AS count FROM users");
        console.log("Connected! Users:", rows[0].count);
    } catch (error){
        console.error("Error connecting to the database:", error);
    } finally {
        process.exit();
    }
}

testDB();