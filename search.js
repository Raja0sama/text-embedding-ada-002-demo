// Import libraries
const { Configuration, OpenAIApi } = require("openai");
const { Client } = require("@elastic/elasticsearch");
const client = new Client({
  node: "http://localhost:9200",
  auth: {
    username: "elastic",
    password: process.env.ELASTIC_SEARCH,
  },
});

// Test the connection
client.ping((err, res) => {
  if (err) {
    console.error("Connection failed:", err);
  } else {
    console.log("Connection successful:", res);
  }
});

// Create instances
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const createIndices = async () => {
  await client.indices.create({
    index: "pets",
    body: {
      mappings: {
        properties: {
          // The document field stores the text of the animal
          document: {
            type: "text",
          },
          // The embedding field stores the vector representation of the animal
          embedding: {
            type: "dense_vector",
            dims: 1536,
            index: true,
            similarity: "cosine",
          },
        },
      },
    },
  });
};

const createIndexs = () => {
  // // Get embeddings for documents
  const documents = [
    "A cat is a domesticated animal that likes to sleep.",
    "A dog is a loyal companion that likes to play.",
    "A bird is a feathered creature that likes to fly.",
    "A fish is an aquatic animal that likes to swim.",
    "A lion is a wild animal that likes to hunt.",
  ]; // sample documents
  documents.forEach((document, index) => {
    const input = { input: document, model: "text-embedding-ada-002" };
    openai
      .createEmbedding(input)
      .then((response) => {
        const embedding = response.data.data[0].embedding; // extract embedding array
        client.index({
          // store document and embedding in Elasticsearch
          index: "pets",
          //   type: 'document',
          //   id: index,
          body: {
            document: document,
            embedding: embedding,
          },
        });
      })
      .catch((e) => {
        throw new Error("Failed once, dont try again");
        console.log(e.message);
      });
  });
};

const query = () => {
  // Get embedding for query
  const query = "What animal likes water?"; // sample query
  const input = { input: query, model: "text-embedding-ada-002" };
  openai.createEmbedding(input).then((response) => {
    const query_embedding = response.data.data[0].embedding; // extract query embedding array

    // Search documents by query embedding
    client
      .search({
        index: "pets",
        body: {
          knn: {
            field: "embedding",
            query_vector: query_embedding,
            k: 5, // Return the top 3 nearest neighbors
            "num_candidates": 10
          },
        },
      })
      .then((result) => {
        const hits = result.hits.hits; // get the matched documents
        hits.forEach((hit) => {
          console.log(hit._source.document); // print the document text
          console.log(hit._score); // print the similarity score
        });
      });
  });
};

const main = () => {
  createIndices();
  createIndexs()
  query()
};

main();
