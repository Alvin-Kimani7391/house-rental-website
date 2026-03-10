// backfillCoordinates.js
require('dotenv').config(); // ← load .env

const mongoose = require('mongoose');
const House = require('./models/House'); // path to your House model
const geocoder = require('./config/geocoder'); // path to your geocoder config

// Use the DB URI from .env
const mongoURI = process.env.MONGO_URI; 

if (!mongoURI) {
  console.error("Error: MONGO_URI is not defined in .env");
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

async function backfillCoordinates() {
  try {
    const houses = await House.find({ coordinates: { $exists: false } });
    console.log(`Found ${houses.length} houses without coordinates`);

    for (let house of houses) {
      const geoData = await geocoder.geocode(house.location);
      if (geoData.length) {
        await House.updateOne(
          { _id: house._id },
          {
            $set: {
              coordinates: {
                type: "Point",
                coordinates: [geoData[0].longitude, geoData[0].latitude]
              }
            }
          }
        );
        console.log(`Updated coordinates: ${house.title}`);
      } else {
        console.log(`Could not geocode: ${house.title}`);
      }
    }

    console.log("Backfill complete");
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
backfillCoordinates();