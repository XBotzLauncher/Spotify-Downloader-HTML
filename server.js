const express = require("express");
const axios = require("axios");
const savetube = require("ytdl-xl");
const path = require("path");
const cors = require("cors");
const os = require("os");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const TOKEN_URL = "https://restapi-v2.vercel.app/api/other/spotify-token";

const getAccessToken = async () => {
  try {
    const response = await axios.get(TOKEN_URL);
    return response.data.response.access_token;
  } catch (error) {
    console.error("Error fetching token:", error.response?.data || error.message);
    return null;
  }
};

const extractSpotifyID = (url) => {
  const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

const getMetadata = async (trackId) => {
  const token = await getAccessToken();
  const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const track = response.data;
  return {
    title: track.name,
    artist: track.artists.map(artist => artist.name).join(", "),
    album: track.album.name,
    duration_ms: track.duration_ms,
    cover: track.album.images[0]?.url || null,
    spotify_url: track.external_urls.spotify
  };
};

app.get("/api/spotify/metadata", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({
    status: false,
    code: 400,
    error: "Masukkan parameter ?url=spotify_url"
    });

  const trackId = extractSpotifyID(url);
  if (!trackId) return res.status(400).json({
    status: false,
    code: 400,
    error: "URL tidak valid"
  });

  try {
    const metadata = await getMetadata(trackId);
    res.json({
      status: true,
      code: 200,
      result: metadata
    });
  } catch (error) {
    res.status(500).json({ 
      status: false,
      code: 500,
      error: error.message
      });
  }
});

app.get("/api/spotify/download", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ 
    status: false,
    code: 400,
    error: "Masukkan parameter ?url=spotify_url" 
  });

  const trackId = extractSpotifyID(url);
  if (!trackId) return res.status(400).json({
    status: false,
    code: 400,
    error: "URL tidak valid"
  });

  try {
    const metadata = await getMetadata(trackId);
    const query = metadata.title;
    const search = await savetube.search(query);
    const data = search.result[1];
    const download = await savetube.download(data.url, "mp3");
    const result = download.result.download;
    res.json({
      status: true,
      code: 200,
      result: {
        metadata: metadata,
        download: result
      }
    })
  } catch (error) {
    res.status(500).json({ 
      status: false,
      code: 500,
      error: error.message
      });
  }
});

app.get("/api/spotify/play", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({
    status: false,
    code: 400,
    error: "Masukkan parameter ?q=sweater wheater"
  });

  const token = await getAccessToken();
  if (!token) {
    return res.status(500).json({
      status: false,
      code: 500,
      error: "Gagal mendapatkan Access Token"
    });
  }

  try {
    const keywords = encodeURIComponent(q);
    const response = await axios.get(`https://api.spotify.com/v1/search`, {
      params: { q: keywords, type: "track", limit: 20 },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.data.tracks.items.length) {
      return res.status(404).json({
        status: false,
        code: 404,
        error: "Tidak ada hasil yang ditemukan untuk query tersebut."
      });
    }

    const tracks = response.data.tracks.items.map((track) => ({
      artist: track.artists.map((artist) => artist.name).join(", "),
      title: track.name,
      url: track.external_urls.spotify,
    }));

    const match = tracks[0];

    const trackId = extractSpotifyID(match.url);
    if (!trackId) return res.status(400).json({
      status: false,
      code: 400,
      error: "URL tidak valid"
    });

    const metadata = await getMetadata(trackId);
    const search = await savetube.search(`${metadata.artist} - ${metadata.title}`);
    const data = search.result[0];
    const download = await savetube.download(data.url, "mp3");
    const result = download.result.download;

    res.json({
      status: true,
      code: 200,
      result: {
        metadata: metadata,
        download: result
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      code: 500,
      error: error.message
    });
  }
});

app.get("/api/spotify/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ 
    status: false,
    code: 400,
    error: "Masukkan parameter ?q=sweater wheater"
    });
  
  const token = await getAccessToken();
  if (!token) {
    return res.status(500).json({
      status: false,
      code: 500,
      error: "Gagal mendapatkan Access Token"
    });
  }
  
  try {
    const keywords = encodeURIComponent(q);
    const response = await axios.get(`https://api.spotify.com/v1/search`, {
      params: { q: keywords, type: "track", limit: 10 },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.data.tracks.items.length) {
      return res.status(404).json({
        status: false,
        code: 404,
        error: "Tidak ada hasil yang ditemukan untuk query tersebut."
      });
    }

    const tracks = response.data.tracks.items.map((track) => ({
      id: track.id,
      artist: track.artists.map((artist) => artist.name).join(", "),
      title: track.name,
      release_date: track.album.release_date,
      images: track.album.images[0].url,
      url: track.external_urls.spotify,
    }));
    res.json({
      status: true,
      code: 200,
      result: tracks
    })
  } catch (error) {
    res.status(500).json({ 
      status: false,
      code: 500,
      error: error.message
      });
  }
})

const PORT = 1204;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});