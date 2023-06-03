// Import libraries
const { Configuration, OpenAIApi } = require("openai");
const { Client } = require("@elastic/elasticsearch");
const client = new Client({
  node: "http://localhost:9200",
  auth: {
    username: "elastic",
    password: "gHxeNUfOo*lKDnfF1erq",
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

const books = [
  // sample books with titles and descriptions
  {
    title: "The Hitchhiker's Guide to the Galaxy",
    description:
      "The intergalactic adventures of Arthur Dent, a hapless Englishman who escapes Earth moments before its destruction by aliens.",
  },
  {
    title: "The Lord of the Rings",
    description:
      "The epic fantasy saga of Frodo Baggins, a hobbit who must destroy an evil ring of power before it falls into the hands of the Dark Lord Sauron.",
  },
  {
    title: "Harry Potter and the Philosopher's Stone",
    description:
      "The magical journey of Harry Potter, an orphan who discovers he is a wizard and enrolls at Hogwarts School of Witchcraft and Wizardry.",
  },
  {
    title: "1984",
    description:
      "The dystopian novel of Winston Smith, a man who lives in a totalitarian society where Big Brother controls everything.",
  },
  {
    title: "The Da Vinci Code",
    description:
      "The thrilling mystery of Robert Langdon, a symbologist who unravels a conspiracy involving secret societies, ancient codes, and religious secrets.",
  },
];

const createIndices = async () => {
  await client.indices.create({
    index: "books",
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

const createIndexes = () => {
  const response = [];
  books.forEach((book, index) => {
    response.push(
      new Promise((resolve) => {
        const input = {
          input: book.title + ". " + book.description,
          model: "text-embedding-ada-002",
        };
        openai
          .createEmbedding(input)
          .then((response) => {
            const embedding = response.data.data[0].embedding; // extract embedding array
            client
              .index({
                // store document and embedding in Elasticsearch
                index: "books",
                //   type: 'document',
                //   id: index,
                body: {
                  title: book.title,
                  description: book.description,
                  embedding: embedding,
                },
              })
              .then((e) => resolve());
          })
          .catch((e) => {
            throw new Error("Failed once, dont try again");
            console.log(e.message);
          });
      })
    );
  });
  return response;
};

const query = () => {
  return new Promise((resolve) => {
    // Get embedding for user's favorite book
    const favorite_book = {
      // sample favorite book with title and description
      title: 'The Hitchhiker"s Guide to the Galaxy',
      description:
        "The intergalactic adventures of Arthur Dent, a hapless Englishman who escapes Earth moments before its destruction by aliens.",
    };
    const input = {
      input: favorite_book.title + ". " + favorite_book.description,
      model: "text-embedding-ada-002",
    };
    openai.createEmbedding(input).then((response) => {
      const favorite_book_embedding = response.data.data[0].embedding; // extract favorite book embedding array

      // Search books by favorite book embedding
      client
        .search({
          index: "books",
          body: {
            knn: {
              field: "embedding",
              query_vector: favorite_book_embedding,
              k: 5, // Return the top 3 nearest neighbors
              num_candidates: 10,
            },
            
          },
        })
        .then((result) => {
          const hits = result.hits.hits; // get the matched books
          hits.forEach((hit) => {
            console.log(hit._source.title); // print the book title
            console.log(hit._score); // print the similarity score
            resolve();
          });
        });
    });
  });
};

const main = async () => {
  Promise.resolve(createIndices()).catch(console.log);
  await Promise.all(createIndexes());
  await query();
};

main();
