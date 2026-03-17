let store = [];

// Save chunks
export async function embedChunks(chunks) {
  store = chunks.map(chunk => ({
    text: chunk
  }));
}

// Search relevant chunks
export async function search(question) {

  const words = question.toLowerCase().split(" ");

  const scored = store.map(item => {

    const text = item.text.toLowerCase();

    let score = 0;

    words.forEach(word => {
      if (text.includes(word)) score++;
    });

    return {
      text: item.text,
      score
    };

  });

  scored.sort((a,b) => b.score - a.score);

  return scored.slice(0,4);
}