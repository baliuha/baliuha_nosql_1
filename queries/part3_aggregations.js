// Execution: mongosh "YOUR_URI" --file queries/part3_aggregations.js

db = db.getSiblingDB("spotify");

print("\n=== Task 1: Top 10 Artists by Average Popularity ===");
const topArtists = db.tracks.aggregate([
    // deconstruct artists array
    { $unwind: "$artists" },
    // group by artist, calculate average popularity and track count
    {
        $group: {
            _id: "$artists",
            track_count: { $sum: 1 },
            avg_popularity: { $avg: "$popularity" }
        }
    },
    // filter artists with at least 5 tracks
    {
        $match: {
            track_count: { $gte: 5 }
        }
    },
    // sort by average popularity in descending order and limit
    { $sort: { avg_popularity: -1 } },
    { $limit: 10 },
    // format the output
    {
        $project: {
            _id: 0,
            artist: "$_id",
            track_count: 1,
            avg_popularity: { $round: ["$avg_popularity", 1] }
        }
    }
]).toArray();

print("Top 10 artists:");
printjson(topArtists);


print("\n=== Task 2: Track Distribution by Mood ===");
// assuming threshold 0.5
const moodDistribution = db.tracks.aggregate([
    {
        $project: {
            mood: {
                $switch: {
                    branches: [
                        { // High valence + High energy -> happy
                            case: { 
                                $and: [ 
                                    { $gte: ["$audio_features.valence", 0.5] }, 
                                    { $gte: ["$audio_features.energy", 0.5] } 
                                ] 
                            }, 
                            then: "happy" 
                        },
                        { // Low valence + High energy -> angry
                            case: { 
                                $and: [ 
                                    { $lt: ["$audio_features.valence", 0.5] }, 
                                    { $gte: ["$audio_features.energy", 0.5] } 
                                ] 
                            }, 
                            then: "angry" 
                        },
                        { // High valence + Low energy -> calm
                            case: { 
                                $and: [ 
                                    { $gte: ["$audio_features.valence", 0.5] }, 
                                    { $lt: ["$audio_features.energy", 0.5] } 
                                ] 
                            }, 
                            then: "calm" 
                        },
                        { // Low valence + Low energy -> sad
                            case: { 
                                $and: [ 
                                    { $lt: ["$audio_features.valence", 0.5] }, 
                                    { $lt: ["$audio_features.energy", 0.5] } 
                                ] 
                            }, 
                            then: "sad" 
                        }
                    ],
                    default: "unknown"
                }
            }
        }
    },
    // group by the created mood field and count
    {
        $group: {
            _id: "$mood",
            track_count: { $sum: 1 }
        }
    },
    { $sort: { track_count: -1 } },
    {
        $project: {
            _id: 0,
            mood: "$_id",
            track_count: 1
        }
    }
]).toArray();

print("Mood distribution:");
printjson(moodDistribution);


print("\n=== Task 3: Most Danceable Genres ===");
const danceableGenres = db.tracks.aggregate([
    // group by genre and calculate averages
    {
        $group: {
            _id: "$track_genre",
            track_count: { $sum: 1 },
            avg_danceability: { $avg: "$audio_features.danceability" },
            avg_energy: { $avg: "$audio_features.energy" },
            avg_valence: { $avg: "$audio_features.valence" }
        }
    },
    // filter out genres with fewer than 100 tracks
    {
        $match: {
            track_count: { $gte: 100 }
        }
    },
    // sort by danceability descending and limit
    { $sort: { avg_danceability: -1 } },
    { $limit: 10 },
    {
        $project: {
            _id: 0,
            genre: "$_id",
            track_count: 1,
            avg_danceability: { $round: ["$avg_danceability", 3] },
            avg_energy: { $round: ["$avg_energy", 3] },
            avg_valence: { $round: ["$avg_valence", 3] }
        }
    }
]).toArray();

print("Top 10 most danceable genres:");
printjson(danceableGenres);