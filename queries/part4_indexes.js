// Execution: mongosh "YOUR_URI" --file queries/part4_indexes.js

db = db.getSiblingDB("spotify");

print("=== Task 1 ===");
const query = {
    track_genre: "pop",
    "audio_features.danceability": { $gte: 0.7 }
};
const sortParams = { popularity: -1 };

// db.tracks.dropIndex("genre_pop_dance");

print("Query Analysis BEFORE Indexing");
const explainBefore = db.tracks.find(query).sort(sortParams).explain("executionStats");

print(`Execution time (ms): ${explainBefore.executionStats.executionTimeMillis}`);
print(`Documents examined: ${explainBefore.executionStats.totalDocsExamined}`);
print("Winning plan:", explainBefore.queryPlanner.winningPlan.stage);

print("\nCreating Index...");
db.tracks.createIndex(
    { 
        track_genre: 1, //E
        popularity: -1, //S
        "audio_features.danceability": 1 //R
    },
    { name: "genre_pop_dance" }
);
print("Index successfully created");

print("\nQuery Analysis AFTER Indexing");
const explainAfter = db.tracks.find(query).sort(sortParams).explain("executionStats");

print(`Execution time (ms): ${explainAfter.executionStats.executionTimeMillis}`);
print(`Documents examined: ${explainAfter.executionStats.totalDocsExamined}`);
print(`Index keys examined: ${explainAfter.executionStats.totalKeysExamined}`);
print("Main plan stage:", explainAfter.queryPlanner.winningPlan.stage);
print("Input stage:", explainAfter.queryPlanner.winningPlan.inputStage.stage);
print("Index used:", explainAfter.queryPlanner.winningPlan.inputStage.indexName);


print("=== Task 2 ===");
const workMusicQuery = {
    explicit: false,
    "audio_features.instrumentalness": { $gt: 0.5 },
    "audio_features.speechiness": { $lt: 0.1 }
};

db.tracks.dropIndex("work_music");

print("Creating the Compound Index...");
db.tracks.createIndex(
    { 
        explicit: 1, //E
        "audio_features.instrumentalness": -1, //R
        "audio_features.speechiness": 1 //R
    },
    { name: "work_music" }
);
print("Index successfully created");

const explainWorkMusic = db.tracks.find(workMusicQuery).explain("executionStats");
print("\nMain plan stage:", explainWorkMusic.queryPlanner.winningPlan.stage);
print("Input stage:", explainWorkMusic.queryPlanner.winningPlan.inputStage.stage);
print("Index used:", explainWorkMusic.queryPlanner.winningPlan.inputStage.indexName);
print(`Execution time (ms): ${explainWorkMusic.executionStats.executionTimeMillis}`);
print(`Documents examined: ${explainWorkMusic.executionStats.totalDocsExamined}`);
print(`Index keys examined: ${explainWorkMusic.executionStats.totalKeysExamined}`);