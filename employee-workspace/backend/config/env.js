import dotenv from "dotenv";

// Load environment variables once for the entire ESM dependency graph.
// `quiet` suppresses dotenv's informational startup banners without hiding errors.
dotenv.config({ quiet: true });

