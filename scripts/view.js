
const viewContainer = document.getElementById('view-container');

let results = {};

function showResult(result) {
    const resultElement = document.createElement('div');
    resultElement.classList.add('result');
    const title = document.createElement('h4');
    title.innerHTML = `${result.filename ?? 'Unknown'} ${result.page ? `[Page ${result.page}]` : ''} ${result.score ? `(score: ${result.score})` : ''} <a target="_blank" href="${botController.getFileURL(result.filename)}#page=${result.page}">View</a>`;
    
    const content = document.createElement('p');
    content.innerHTML = result.text;
    resultElement.appendChild(title);
    if(result.image_origin){
        const image = document.createElement('img');
        image.src = result.image_origin;
        resultElement.appendChild(image);
    }
    resultElement.appendChild(content);
    viewContainer.appendChild(resultElement);

}

function setResults(results) {
    let sorted = Object.keys(results).sort((a, b) => results[b].score - results[a].score).map(id => results[id]);
    sorted.forEach(showResult);
}

function addResult(result){
    results[result.id] = result;
    viewContainer.innerHTML = '';
    setResults(results);
}

function clearResults() {
    viewContainer.innerHTML = '';
    results = {};
}