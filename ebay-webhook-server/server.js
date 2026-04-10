import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

const VERIFICATION_TOKEN = "vamsi-ssnworks-ebay-webhook-token"; // Replace with your own secure token
const ENDPOINT = "https://tangela-undecreased-alfonzo.ngrok-free.dev/ebay-notification";

// Health check
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

app.get("/ebay-notification", (req, res) => {
  const challengeCode = req.query.challenge_code;

  if (challengeCode) {
    const hash = crypto
      .createHash("sha256")
      .update(
        challengeCode +
        VERIFICATION_TOKEN +
        ENDPOINT
      )
      .digest("hex");

    return res.status(200).json({
      challengeResponse: hash
    });
  }

  res.sendStatus(200);
});

// REQUIRED POST handler
app.post("/ebay-notification", (req, res) => {
  console.log("Body:", req.body);

  if (req.body.challengeCode) {
    const hash = crypto
      .createHash("sha256")
      .update(
        req.body.challengeCode +
        VERIFICATION_TOKEN +
        ENDPOINT
      )
      .digest("hex");

    return res.json({
      challengeResponse: hash
    });
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("Server running on 3000"));