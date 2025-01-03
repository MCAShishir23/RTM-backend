import express from "express";
import cors from 'cors';
import pkg from 'pg';
import Jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
import multer from "multer";
import path from "path";
import cookieParser from "cookie-parser";
const { Client } = pkg;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static('Public'))
app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH,DELETE,HEAD"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-with, Content-Type,Accept"
  );
  next();
});

const client = new Client({
  user: "postgres.owoozffnerrloxbrkfmh",
  password: "MAnoj123@",
  database: "postgres",
  port: 5432,
  host: "aws-0-ap-southeast-1.pooler.supabase.com",
  ssl: { rejectUnauthorized: false },
});

client.connect()
  .then(() => {
    console.log("Connected!!!");
  })
  .catch((error) => {
    console.error("Connection error:", error);
  });

  const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if(token) {
        Jwt.verify(token, "jwt_secret_key", (err, decoded) => {
            if(err) return res.json({ Status: false, Error: "Wrong Token" });
            req.id = decoded.id;
            req.role = decoded.role;
            next();
        });
    } else {
        return res.json({ Status: false, Error: "Not authenticated" });
    }
};

app.get('/verify', verifyUser, (req, res) => {
    return res.json({ Status: true, role: req.role, id: req.id });
});
app.post("/api/addReservation", (req, res) => {
  // Log the request body to the console for debugging
  console.log(req.body, "Received Reservation Data");

  // SQL query to insert the reservation data into the database
  const sql = `INSERT INTO bookings (name, contact, date, time, guests) 
               VALUES ($1, $2, $3, $4, $5)`;

  // Extracting data from the request body
  const values = [
    req.body.name,   // Name of the person making the reservation
    req.body.contact, // Contact number of the person
    req.body.date,    // Reservation date
    req.body.time,    // Reservation time
    req.body.guests   // Number of guests
  ];

  // Execute the query to insert data
  client.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting reservation:", err); // Log the error to the console
      res.status(500).json({ message: "Error inserting reservation data", error: err });
    } else {
      console.log("Reservation added successfully:", result); // Log success message
      res.status(201).json({ message: "Reservation added successfully" });
    }
  });
});

app.get("/getBookings", function (req, res) {
  let query = "SELECT * FROM bookings";
  client.query(query, (err, result) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send(result.rows);
    }
  });
});

app.delete('/deleteBooking/:id', (req, res) => {
  const bookingId = req.params.id;
console.log(bookingId,"185");
  // SQL query to delete the booking by id
  const sql = 'DELETE FROM bookings WHERE id = $1';

  // Execute the query
  client.query(sql, [bookingId], (err, result) => {
    if (err) {
      console.error('Error deleting booking:', err);
      return res.status(500).json({ message: 'Error deleting booking', error: err });
    }

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Booking deleted successfully' });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  });
});

app.put('/editBooking/:id', (req, res) => {
  const bookingId = req.params.id;
  const { name, contact, date, time, guests } = req.body;

  // SQL query to update the booking details
  const sql = `
    UPDATE bookings 
    SET name = $1, contact = $2, date = $3, time = $4, guests = $5
    WHERE id = $6
  `;

  // Execute the query
  client.query(sql, [name, contact, date, time, guests, bookingId], (err, result) => {
    if (err) {
      console.error('Error updating booking:', err);
      return res.status(500).json({ message: 'Error updating booking', error: err });
    }

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Booking updated successfully' });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  });
});


app.post("/api/checkBooking", (req, res) => {
  const { date, time } = req.body;
  console.log(req.body, "153");

  // Validate input
  if (!date || !time) {
    return res.status(400).json({ error: "Missing required fields: date and time." });
  }

  const query = `
    SELECT * FROM bookings 
    WHERE date = $1 AND time = $2
  `;

  client.query(query, [date, time], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Database query failed. Please try again later." });
    }

    if (results.rows.length > 0) {
      console.log(results.rows[0], "171");

      // Data exists
      res.status(200).json({ message: "Booking found", booking: results.rows[0] });
    } else {
      // Data not found
      const availableSlotsQuery = `
        SELECT DISTINCT time 
        FROM bookings 
        WHERE date = $1
      `;

      client.query(availableSlotsQuery, [date], (slotErr, slotResults) => {
        if (slotErr) {
          console.error("Error fetching available slots:", slotErr);
          return res.status(500).json({ error: "Failed to fetch available slots. Please try again later." });
        }

        const availableSlots = slotResults.rows.map((row) => row.time);

        res.status(200).json({
          message: "No bookings found for the provided date and time.",
          suggestedSlots: availableSlots.length > 0 ? availableSlots : "No bookings available on this date.",
        });
      });
    }
  });
});





  
   
const port = process.env.PORT || 2410;
app.listen(port, () => console.log(`Node app listening on port ${port}!`));
