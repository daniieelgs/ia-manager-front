// Loader Container
function startLoader(container, size = "100%"){
    const loader = document.createElement('div');
    loader.classList.add('loader');
    loader.style.width = size;
    loader.style.height = size;
    container.appendChild(loader);
    container.classList.add('loading-animation');
}

function stopLoader(container){
    let loader = container.querySelector('.loader')
    if(loader) loader.remove();
    container.classList.remove('loading-animation');
}