const mongoose = require("mongoose");
const MONGO_URI = "mongodb+srv://khushsofty24_db_user:nhmDR7lVUpTby76L@vedicstore.vpq8aea.mongodb.net/test";

async function fix() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    const collection = mongoose.connection.collection("ratings");
    
    // Check indexes
    const indexes = await collection.indexes();
    console.log("Current indexes:", JSON.stringify(indexes, null, 2));

    const indexName = "productId_1_userId_1";
    const exists = indexes.some(idx => idx.name === indexName);
    
    if (exists) {
      console.log(`🗑️ Dropping index: ${indexName}`);
      await collection.dropIndex(indexName);
      console.log("✅ Index dropped successfully");
    } else {
      console.log("ℹ️ Index does not exist or has different name");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

fix();
