// Import libraries
const { Configuration, OpenAIApi } = require("openai");
const kmeans = require("node-kmeans"); // a library for k-means clustering

// Create instances
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const embeddings = []; // an array to store tweet embeddings
// Get embeddings for tweets
const tweets = [
  "I love Node.js!",
  "OpenAI rocks!",
  "text-embedding-ada-002 is awesome!",
  "Just watched Spider-Man: No Way Home and it was amazing!",
  "Happy holidays everyone!",
  "Cant wait for the new season of The Witcher!",
];
const getEmbeddingsForTweets = () => {
  const promises = []
  tweets.forEach(async (tweet) => {
   promises.push( new Promise(async (resolve)=>{
     const input = { input: tweet, model: "text-embedding-ada-002" };
     const response = await openai.createEmbedding(input).catch((e) => {
       throw new Error(e);
     });
     const embedding = response.data.data[0].embedding; // extract embedding array
     resolve(embedding); // add embedding to the array

    }))
  });

  return promises
};

const clusteringEmbeddings = (embeddings) => {
  // Cluster tweets by embeddings
  console.log(embeddings.length);
  kmeans.clusterize(embeddings, { k: 3 }, (err, res) => {
    // apply k-means clustering with k=3 clusters
    if (err) console.error(err);
    else {
      res.forEach((cluster, index) => {
        // for each cluster
        console.log("Cluster " + index + ":"); // print cluster number
        cluster.clusterInd.forEach((i) => {
          // for each tweet index in the cluster
          console.log(tweets[i]); // print tweet text
        });
      });
    }
  });
};

const main = () => {
  Promise.all(getEmbeddingsForTweets()).then(e => clusteringEmbeddings(e));
};

main();
