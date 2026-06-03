// Execution: mongosh "YOUR_URI" --file queries/part2_queries.js

db = db.getSiblingDB("spotify");
/*
print("\n=== Task 1: Party Tracks ===");
const partyTracks = db.tracks.find(
    {
        "audio_features.danceability": { $gt: 0.7 },
        "audio_features.energy": { $gt: 0.7 },
        duration_ms: { $gte: 180000, $lte: 300000 }
    },
    { 
        track_name: 1, 
        artists: 1, 
        "audio_features.danceability": 1, 
        "audio_features.energy": 1, 
        duration_ms: 1, 
        _id: 0 
    }
).limit(5).toArray(); // comment limit to see all tracks

print("Party tracks:");
printjson(partyTracks);


print("\n=== Task 2: Popular Artists ===");
const popularArtists = db.tracks.aggregate([
    // deconstruct the artists array to group by individual artist
    { $unwind: "$artists" },
    {
        $group: {
            _id: "$artists",
            track_count: { $sum: 1 },
            min_popularity: { $min: "$popularity" },
            avg_popularity: { $avg: "$popularity" }
        }
    },
    {
        $match: {
            track_count: { $gte: 3 },
            min_popularity: { $gte: 60 }
        }
    },
    {
        $project: {
            _id: 0,
            artist: "$_id",
            track_count: 1,
            min_popularity: 1,
            avg_popularity: { $round: ["$avg_popularity", 1] }
        }
    },
    { $sort: { avg_popularity: -1 } },
    { $limit: 20 }
]).toArray();

print("Top 20 popular artists:");
printjson(popularArtists);
*/

print("\n=== Task 3: High Tempo Tracks ===");
const outlierTracks = db.tracks.aggregate([
    // calculate avg and stdDev per genre
    {
        $setWindowFields: {
            partitionBy: "$track_genre",
            output: {
                avg_tempo: { $avg: "$audio_features.tempo" },
                stdDev_tempo: { $stdDevPop: "$audio_features.tempo" }
            }
        }
    },
    // calculate the outlier threshold
    {
        $addFields: {
            outlier_threshold: {
                $add: ["$avg_tempo", { $multiply: [2, "$stdDev_tempo"] }]
            }
        }
    },
    // filter tracks that exceed the threshold
    {
        $match: {
            $expr: { $gt: ["$audio_features.tempo", "$outlier_threshold"] }
        }
    },
    // group the results by genre as requested in the output format
    {
        $group: {
            _id: "$track_genre",
            avg_tempo: { $first: "$avg_tempo" },
            outlier_threshold: { $first: "$outlier_threshold" },
            outlier_tracks: {
                $push: {
                    _id: "$_id",
                    track_name: "$track_name",
                    popularity: "$popularity",
                    artists: "$artists",
                    audio_features: { tempo: "$audio_features.tempo" }
                }
            }
        }
    },
    // clean up the output
    {
        $project: {
            _id: 0,
            genre: "$_id",
            avg_tempo: { $round: ["$avg_tempo", 1] },
            outlier_threshold: { $round: ["$outlier_threshold", 1] },
            outlier_tracks: 1
        }
    },
    { $limit: 2 } // limiting output in console for readability
]).toArray();

print("Outlier tracks by genre:");
printjson(outlierTracks);


print("\n=== Task 4: Background Work Tracks ===");
const backgroundTracks = db.tracks.find(
    {
        "audio_features.loudness": { $lt: -10 },
        "audio_features.speechiness": { $lt: 0.1 },
        "audio_features.instrumentalness": { $gt: 0.5 },
        explicit: false
    },
    { 
        track_name: 1, 
        artists: 1, 
        "audio_features.loudness": 1, 
        "audio_features.instrumentalness": 1, 
        _id: 0 
    }
).limit(5).toArray(); // comment limit to see all tracks

print("Tracks suitable for background work:");
printjson(backgroundTracks);