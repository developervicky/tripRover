const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./model/User.js");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const Token = require("./model/Token.js");
const sendEmail = require("./utils/sendEmail.js");
const crypto = require("crypto");
const download = require("image-downloader");
const multer = require("multer");
const fs = require("fs");
const Place = require("./model/Place.js");
const Booking = require("./model/Booking.js");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
require("dotenv").config();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "gfvdasuyhjfgbfciulhasdejkfbcvs";
const bucket = "triprover-app";

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);

// mongoose.connect(process.env.MONGO_URL);

async function uploadToS3(path, originalName, mimeType) {
  const client = new S3Client({
    region: "ap-south-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  const parts = originalName.split(".");
  const ext = parts[parts.length - 1];
  const newFilename = Date.now() + "." + ext;
  const data = await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Body: fs.readFileSync(path),
      Key: newFilename,
      ContentType: mimeType,
      ACL: "public-read",
    })
  );
  return `https://${bucket}.s3.amazonaws.com/${newFilename}`;
}

function getUserDatafromToken(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

app.get("/api/test", (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  console.log("hi");
  res.json("hello");
});

app.post("/api/register", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { fname, lname, email, password } = req.body;

  try {
    if (!fname || !lname || !email)
      return res.status(400).send("Fill the form");
    let user = await User.findOne({ email });
    if (user) return res.status(400).send("User already registered.");

    const userData = await User.create({
      fname,
      lname,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });

    const fullname = userData.fname + " " + userData.lname;

    jwt.sign(
      {
        email: userData.email,
        id: userData._id,
        fname: userData.fname,
        lname: userData.lname,
      },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        // res.json(userData);
      }
    );
    const verifToken = await new Token({
      userId: userData._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();
    const url = `${process.env.BASE_URL}users/${userData._id}/verify/${verifToken.token}`;
    // console.log(userData.email, url);
    await sendEmail(userData.email, "Verify Email - tripRover", url, fullname);
    res.json({ message: "Verify the Email" });
  } catch (e) {
    res.status(422);
  }
});

app.get("/api/:id/verify/:token", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  try {
    const user = await User.findOne({ _id: req.params.id });
    // res.send(user);
    if (!user) {
      return res.status(400).send({ message: "User not Existing" });
    }
    // Token.findOneAndDelete(
    //   {
    //     userId: user._id,
    //     token: req.params.token,
    //   },
    //   (err, doc) => {
    //     if (err) {
    //       res.json({ err });
    //     }

    //     res.json({ doc });
    //   }
    // );
    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) {
      return res.status(400).send({ message: "Link was Expired/Wrong" });
    }

    await User.updateOne({ _id: user._id }, { verified: true });
    res.status(200).send({ message: "Email verified successfully" });
    // token.remove();
  } catch (error) {
    res.send(error);
  }
});

app.post("/api/signin", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { email, password } = req.body;
  try {
    const userData = await User.findOne({ email });
    const fullname = userData.fname + " " + userData.lname;
    if (userData) {
      // res.json("Email already exist");
      const passOk = bcrypt.compareSync(password, userData.password);
      if (passOk) {
        if (userData.verified) {
          jwt.sign(
            { email: userData.email, id: userData._id },
            jwtSecret,
            {},
            (err, token) => {
              if (err) throw err;
              res.cookie("token", token).json(userData);
            }
          );
        } else if (!userData.verified) {
          const token = await Token.findOne({
            userId: userData._id,
          });
          if (token) {
            res
              .status(202)
              .send({ message: "Check Your Email and Vaildate the Account" });
          } else if (!token) {
            const verifToken = await new Token({
              userId: userData._id,
              token: crypto.randomBytes(32).toString("hex"),
            }).save();
            const url = `${process.env.BASE_URL}users/${userData._id}/verify/${verifToken.token}`;
            await sendEmail(
              userData.email,
              "Verify Email - tripRover",
              url,
              fullname
            );
            res.status(202).send({ message: "Email sent again" });
          }
        }
      } else {
        res.status(202).send({ message: "Password wrong!" });
      }
    } else {
      res.status(202).send({ message: "Email doesn't exist" });
    }
  } catch (e) {
    res.status(422).json(e);
  }
});

app.get("/api/profile", (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const { _id, email, fname, lname, verified } = await User.findById(
        userData.id
      );
      res.json({ _id, email, fname, lname, verified });
    });
  } else {
    res.json(null);
  }
  // res.json({ token });
});

app.post("/api/logout", (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  res.cookie("token", "").json("Succesful Logout");
});

// console.log(__dirname);
app.post("/api/uploads_link", async (req, res) => {
  const { photoLink: link } = req.body;
  const newName = "photo" + Date.now() + ".jpg";
  await download.image({
    url: `${link}`,
    dest: "/tmp/" + newName,
  });
  const url = await uploadToS3(
    "/tmp/" + newName,
    newName,
    mime.lookup("/tmp/" + newName)
  );
  res.json(url);
  // res.send(link);
  // res.send(dest);
});

// const photoMiddleware = multer({ dest: "uploads/" });
const photoMiddleware = multer({ dest: "/tmp" });
app.post(
  "/api/uploads",
  photoMiddleware.array("photos", 100),
  async (req, res) => {
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {
      // console.log(req.files[i]);
      const { path, originalname, mimetype } = req.files[i];
      const url = await uploadToS3(path, originalname, mimetype);
      uploadedFiles.push(url);
      // const parts = originalname.split(".");
      // const ext = parts[parts.length - 1];
      // const newPath = path + "." + ext;
      // fs.renameSync(path, newPath); => local server function
      // uploadedFiles.push(newPath.replace("uploads\\", ""));
    }
    res.json(uploadedFiles);
  }
);

app.post("/api/accommodation", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  const {
    title,
    address,
    country,
    state,
    city,
    description,
    addedPhoto: photos,
    amenities,
    maxGuests,
    bedrooms,
    beds,
    bathrooms,
    checkIn,
    checkOut,
    extraInfo,
    price,
  } = req.body;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      console.log(userData);
      const placeData = await Place.create({
        ownerId: userData.id,
        title,
        address,
        country,
        state,
        city,
        description,
        photos,
        amenities,
        maxGuests,
        bedrooms,
        beds,
        bathrooms,
        checkIn,
        checkOut,
        extraInfo,
        price,
      });
      res.json(placeData);
    });
  }
});

app.put("/api/accommodation", (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    country,
    state,
    city,
    description,
    addedPhoto: photos,
    amenities,
    maxGuests,
    bedrooms,
    beds,
    bathrooms,
    checkIn,
    checkOut,
    extraInfo,
    price,
  } = req.body;
  try {
    if (token) {
      jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        const placeData = await Place.findById(id);
        if (userData.id == userData.id.toString()) {
          placeData.set({
            title,
            address,
            country,
            state,
            city,
            description,
            photos,
            amenities,
            maxGuests,
            bedrooms,
            beds,
            bathrooms,
            checkIn,
            checkOut,
            extraInfo,
            price,
          });
          await placeData.save();
          res.json("Updated");
        }
      });
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get("/api/placeFind", (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const { id } = userData;
      res.json(await Place.find({ ownerId: id }));
    });
  }
});

app.get("/api/user/:id", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  try {
    const { id } = req.params;
    res.json(await Place.findById(id));
  } catch (error) {
    res.json(error);
  }
});

app.get("/api/home-place", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  res.json(await Place.find());
});

app.post("/api/bookings", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const userData = await getUserDatafromToken(req);
  const {
    checkinDate,
    checkoutDate,
    noGuests,
    noRooms,
    fullName,
    email,
    phone,
    place,
    price,
    ownerId,
  } = req.body;
  Booking.create({
    checkinDate,
    checkoutDate,
    noGuests,
    noRooms,
    fullName,
    email,
    phone,
    place,
    price,
    user: userData.id,
    ownerId,
  })
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      throw err;
    });
});

app.get("/api/bookings", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  try {
    const userData = await getUserDatafromToken(req);
    res.json(await Booking.find({ user: userData.id }).populate("place"));
  } catch (error) {
    res.json(error);
  }
});

app.get("/api/accbookings", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const userData = await getUserDatafromToken(req);
  res.json(await Booking.find({ ownerId: userData.id }).populate("place"));
});

app.get("/api/bookings/:id", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  try {
    const { id } = req.params;
    res.json(await Booking.findById(id).populate("place"));
  } catch (error) {
    res.json(error);
  }
});

app.delete("/api/acc/:id", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { id } = req.params;
  res.json(await Place.findByIdAndDelete(id));
});

app.delete("/api/bookings/user/:id", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { id } = req.params;
  res.json(await Booking.findByIdAndDelete(id));
});

app.listen(5000);
