import pkg from 'pg';
let { Client } = pkg;

// Now you can use Client as before
const client = new Client({
    user: "postgres",
    password: "MAnoj123@786",
    database: "postgres",
    port: 5432,
    host: "db.ffhgklroggnimgnnkarw.supabase.co",
    ssl: { rejectUnauthorized: false },
});

client.connect(function (res, error) {
    console.log(`Connected!!!`);
});

export default client;
