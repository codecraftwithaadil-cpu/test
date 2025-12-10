const express = require("express");
const bodyParser = require("body-parser");
const SerpApi = require("google-search-results-nodejs");
const cors = require("cors");
const gplay = require("google-play-scraper").default; // for size & MOD

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public")); // for serving index.html + static files

const search = new SerpApi.GoogleSearch("a5c665f7ecfa2d180809bcd936f75ae4bc34cd0a7dc49cf74409860d58fd5861"); // Replace with your SerpApi key

app.post("/getAppInfo", async (req, res) => {
  const { appId } = req.body;
  if (!appId) {
    return res.status(400).json({ error: "appId is required" });
  }

  try {
    // 1️⃣ Get size & MOD info from google-play-scraper
    const gplayData = await gplay.app({ appId });

    // 2️⃣ Get version, updated_on, category, requires_android from SerpApi
    const params = {
      engine: "google_play_product",
      store: "apps",
      product_id: appId,
      gl: "us",
      hl: "en"
    };

    const serpData = await new Promise((resolve, reject) => {
      search.json(params, (data) => resolve(data));
    });

    const serpInfo = serpData;

    // Merge info from both sources
    const info = {
      title: gplayData.title,
      size: gplayData.size || "Not available",
      mod: gplayData.offersIAP ? "Yes" : "No",
      version: serpInfo.about_this_app.version || "Not available",
      updated_on: serpInfo.about_this_app.updated_on || "Not available",
      category: serpInfo.categories || [],
      requires_android: serpInfo.about_this_app.requires_android || "Not available",
      developer: gplayData.developer,
      url: gplayData.url,
      data:serpInfo,
      check:gplayData
     };

    res.json({ success: true, data: info });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch app info" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
