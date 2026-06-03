// EXECUTION: mongosh "URI" --file scripts/02_transform.js

db = db.getSiblingDB("spotify");

/*
if (db.getCollectionNames().includes("tracks")) {
    db.tracks.drop();
    print("Dropped existing 'tracks' collection.");
}
*/

print("Starting data transformation...");

// Aggregation pipeline to transform and save the data
db.tracks_raw.aggregate([
    {
        $project: {
            // keep required fields, _id is included for consistency
            _id: 1,
            track_id: 1,
            track_name: 1,
            album_name: 1,
            explicit: 1,
            popularity: 1,
            duration_ms: 1,
            track_genre: 1,

            // transform artists: split by ';' and trim spaces
            artists: {
                $map: {
                    input: { $split: ["$artists", ";"] },
                    as: "artist",
                    in: { $trim: { input: "$$artist" } }
                }
            },

            // create nested audio_features object
            audio_features: {
                danceability: "$danceability",
                energy: "$energy",
                loudness: "$loudness",
                speechiness: "$speechiness",
                acousticness: "$acousticness",
                instrumentalness: "$instrumentalness",
                liveness: "$liveness",
                valence: "$valence",
                tempo: "$tempo",
                key: "$key",
                mode: "$mode",
                time_signature: "$time_signature"
            },

            // calculate duration in seconds
            duration_sec: {
                $round: [{ $divide: ["$duration_ms", 1000] }, 1]
            },

            // calculate popularity tier
            popularity_tier: {
                $switch: {
                    branches: [
                        { case: { $gte: ["$popularity", 70] }, then: "high" },
                        { case: { $gte: ["$popularity", 40] }, then: "medium" }
                    ],
                    default: "low"
                }
            }
        }
    },
    // save the result to the new tracks collection
    { $out: "tracks" }
]);


const newCount = db.tracks.countDocuments();
print(`\nTransformation completed. Total documents in 'tracks': ${newCount}`);

print("\nSample document from the new the collection:");
printjson(db.tracks.findOne());