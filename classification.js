// Import libraries
const { Configuration, OpenAIApi } = require("openai");

// Create instances
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Get embeddings for categories
const categories = ['Business', 'Entertainment', 'Politics', 'Science', 'Sports']; // sample categories
const category_embeddings = {}; // an object to store category embeddings
categories.forEach(category => {
  const input = {input: category,model: 'text-embedding-ada-002'};
  openai.createEmbedding(input).then(response => {
    const embedding = response.data.data[0].embedding; // extract embedding array
    category_embeddings[category] = embedding; // add category and embedding to the object
  });
});

function euclideanDistance(a, b) {
  // a and b are arrays of numbers with the same length
  let sum = 0; // initialize sum to zero
  for (let i = 0; i < a.length; i++) { // for each element in the arrays
    let diff = a[i] - b[i]; // calculate the difference between corresponding elements
    sum += diff * diff; // add the square of the difference to the sum
  }
  return Math.sqrt(sum); // return the square root of the sum
}

// Get embedding for new article
const new_article = { // sample new article with title and content
  title: 'Elon Musk says Tesla will accept Dogecoin as payment',
  content: 'Tesla CEO Elon Musk announced on Twitter that the electric car company will start accepting Dogecoin, a cryptocurrency that started as a joke, as a form of payment.'
};
const input = {input: new_article.title + '. ' + new_article.content,model: 'text-embedding-ada-002'};
openai.createEmbedding(input).then(response => {
  const new_article_embedding = response.data.data[0].embedding; // extract new article embedding array

  // Compare new article embedding with category embeddings
  let min_distance = Infinity; // initialize minimum distance to infinity
  let best_category = ''; // initialize best category to empty string
  for (let category in category_embeddings) { // for each category in the object
    let category_embedding = category_embeddings[category]; // get category embedding array
    let distance = euclideanDistance(new_article_embedding, category_embedding); // calculate euclidean distance between new article and category embeddings
    if (distance < min_distance) { // if distance is smaller than minimum distance
      min_distance = distance; // update minimum distance
      best_category = category; // update best category
    }
  }

  // Assign best category as label for new article
  console.log('The label for the new article is: ' + best_category); // print the label
});