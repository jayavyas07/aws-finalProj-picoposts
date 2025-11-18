import mysql from "mysql2/promise";

export function createPool() {
    const {
        DB_HOST_WRITE,
        DB_USER,
        DB_NAME,
        DB_PASSWORD
    } = process.env;

    if (!DB_HOST_WRITE || !DB_USER || !DB_NAME) {
        console.error("Missing DB config. Check environment variables.");
        process.exit(1);
    }

    const pool = mysql.createPool({
        host: DB_HOST_WRITE,
        user: DB_USER,
        database: DB_NAME,
        password: DB_PASSWORD,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0
    });

    return pool;
}
