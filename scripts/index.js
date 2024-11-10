
let filter_files = "all";

let filter_files_own = [];

const collectionOwnContainer = document.getElementById('collection-own-container');

//API SELECTOR

apiStorage = new ApiStorage();

let api_host = [];

let botController = null;

const apiHost = document.getElementById('api-host');
const apiSelector = document.getElementById('api-selector');


function updateApiHost() {
    api_host = apiStorage.getApiServer().map(server => {
        return {
            'name': server.name,
            'controller': new BotController(server.host),
            'selected': server.selected
        }
    });
}

function setApiHost() {

    let hostObj = api_host.find(host => host.name === apiSelector.value);

    botController = hostObj.controller;

    apiStorage.selectApiServer(hostObj.name);

    const host = botController.getSwagger();

    apiHost.innerHTML = host;
    apiHost.href = host;
    apiHost.title = host;

}

function initApiSelector() {

    updateApiHost();

    apiSelector.innerHTML = '';

    api_host.forEach(host => {
        const option = document.createElement('option');
        option.value = host.name;
        option.textContent = host.name;
        option.selected = host.selected;
        apiSelector.appendChild(option);
    });

    setApiHost();

}

apiSelector.addEventListener('change', e => {
    setApiHost();

    updateFileList();

    setUpChat();

});

initApiSelector(); // Set the initial value

document.getElementById('add-api').addEventListener('click', e => {
    const modal = new NewApiModal(api_host)
    modal.open().then(btn => {
        if(btn !== 'save') return;
        console.log("adding");
        apiStorage.addApiServer(modal.get_name(), modal.get_host(), true);
        initApiSelector();
    });

});

document.getElementById('remove-api').addEventListener('click', e => {
    apiStorage.removeApiServer(apiSelector.value);
    initApiSelector();
});
//Upload files

const fileList = document.getElementById('file-list');
const dropArea = document.querySelector('#uploader-container > .container');
const uploader = document.getElementById('uploader');
const infoUpload = dropArea.querySelector('div');
const inputUpload = document.getElementById('uploader');

let filesUploaded = [];

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
});

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;
  
    //filter only pdf files:

    const preLength = files.length;

    files = [...files].filter(file => file.type === 'application/pdf');

    if(preLength !== files.length){
        globalNotification.show('Solo se permiten archivos PDF.', NOTIFICATION_ERROR);
    }

    
    if (files.length === 0) {
        return;
    }

    handleFiles(files);
}

inputUpload.addEventListener('change', e => {
    let files = e.target.files;
    handleFiles(files);
});

function handleFiles(files) {
    [...files].forEach(uploadFile);
    displayFiles(filesUploaded);
}

function uploadFile(file) {
    // Aquí podrías implementar la lógica para subir el archivo a un servidor
    console.log('Subiendo archivo:', file.name);
    filesUploaded.push(file);
}

function displayFiles(files) {
    fileList.innerHTML = '';

    if (files.length === 0) {
        infoUpload.style.display = 'flex';
        return;
    }

    infoUpload.style.display = 'none';

    [...files].forEach(file => {
      let fileItem = document.createElement('p');
      fileItem.textContent = `${file.name}`;
      fileItem.title = file.name;
      let removeIcon = document.createElement('i');
        removeIcon.textContent = '❌';
        removeIcon.style.cursor = 'pointer';
        removeIcon.style.marginLeft = '10px';
        removeIcon.style.color = 'red';
        removeIcon.addEventListener('click', () => {
            filesUploaded = filesUploaded.filter(f => f !== file);
            displayFiles(filesUploaded);
        });
        fileItem.appendChild(removeIcon);
      fileList.appendChild(fileItem);
    });
}

uploader.addEventListener('change', e => {

    console.log(e.target.files);

});

document.getElementById('upload-files-btn').addEventListener('click', async e => {
    
        if(filesUploaded.length === 0){
            return;
        }
    
        const formData = new FormData();
    
        [...filesUploaded].forEach(file => {
            formData.append('files[]', file);
        });
    
        //set loading animation

        const loading = document.createElement('div');
        loading.classList.add('loading');
        //gif
        const gif = document.createElement('img');
        gif.src = '../images/icons/loading.gif';

        loading.appendChild(gif);

        dropArea.appendChild(loading);

        const loggerContainer = document.createElement('div');
        loggerContainer.classList.add('logger-container');

        try{

            e.target.style.display = 'none';

            e.target.parentElement.appendChild(loggerContainer);

            let filesProcessed = 0;

            let counter = document.createElement('p');
            counter.classList.add('counter');
            loggerContainer.appendChild(counter);

            let fileLog = document.createElement('p');
            fileLog.classList.add('log-filename');
            loggerContainer.appendChild(fileLog);

            let msgLog = document.createElement('p');
            msgLog.classList.add('log');
            loggerContainer.appendChild(msgLog);

            const totalFiles = filesUploaded.length;

            const updateCounter = (n) => {
                counter.innerHTML = `Processing <span class="counter-num">${n}/${totalFiles}</span> files.`;
            }

            updateCounter(filesProcessed);

            let currentFilename = null;

            for await (const json of stream(await botController.uploadFilesStream(formData))) {

                for(data of json){

                    if(data.data?.filename){
                        currentFilename = data.data.filename;
                        fileLog.textContent = data.data.filename;
                    }

                    if(data.data?.status == "started"){
                        updateCounter(++filesProcessed);
                    }

                    if(data.data?.status == "done"){
                        filesUploaded = filesUploaded.filter(f => f.name !== currentFilename);
                    }

                    msgLog.textContent = data.msg;

                    console.log(data);
                }
            }
        
            if(filesUploaded.length > 0){
                globalNotification.show('No se pudieron subir todos los archivos.', NOTIFICATION_WARNING);
            }else{
                globalNotification.show('Archivos subidos correctamente.', NOTIFICATION_SUCCESS);
            }

            // filesUploaded = [];

            displayFiles(filesUploaded);

        }catch(err){
                console.log(err.data);
                globalNotification.show('Error al subir los archivos.', NOTIFICATION_ERROR);
        }finally{
            loading.remove();
            e.target.style.display = 'block';
            e.target.parentElement.removeChild(loggerContainer);

            updateFileList();
        }


    
    });

// Get files

const filesList = document.getElementById('indexed-files-list');

function clearFileList() {
    const children = filesList.children;

    for (let i = 0; i < children.length; i++) {
        filesList.removeChild(children[i]);
    }

}

function clearFileCollection() {
    const children = collectionOwnContainer.children;

    for (let i = 0; i < children.length; i++) {
        collectionOwnContainer.removeChild(children[i]);
    }

}

function updateFileList(){
    clearFileList();
    clearFileList();
    clearFileList();

    clearFileCollection();
    clearFileCollection();
    clearFileCollection();

    botController.getFiles()
    .then(files => {

        console.log(files);

        [...files].forEach(file => {

            let fileItem = document.createElement('a');
            fileItem.href = `${botController.getFileURL(file.filename)}`;
            fileItem.target = '_blank';
            fileItem.textContent = `${file.filename}`;
            fileItem.title = file.filename;
            fileItem.classList.add('file-item');

            let removeFileItem = document.createElement('i');
            removeFileItem.textContent = '❌';
            removeFileItem.style.cursor = 'pointer';

            removeFileItem.addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();

                new YesNoModalQuestion(`¿Está seguro que desea eliminar '${file.filename}'?`).open().then(btn => {
                
                    if(btn != YES_BUTTON) return;
                    
                    startLoader(filesList);

                    botController.removeFile(file.filename)
                    .then(response => {
                        console.log(response);
                        updateFileList();
                        globalNotification.show('Archivo eliminado correctamente.', NOTIFICATION_SUCCESS);
                    })
                    .catch(err => {
                        console.error(err);
                        globalNotification.show('Error al eliminar el archivo.', NOTIFICATION_ERROR);
                    })
                    .finally(() => stopLoader(filesList));

                });
            });

            fileItem.appendChild(removeFileItem);

            filesList.appendChild(fileItem);

            let fileItemCheckboxContainer = document.createElement('div');
            fileItemCheckboxContainer.classList.add('file-item-checkbox-container');
            fileItemCheckboxContainer.title = file.filename;
            let fileItemCheckbox = document.createElement('input');
            fileItemCheckbox.type = 'checkbox';
            fileItemCheckbox.name = 'file';
            fileItemCheckbox.value = file.filename;
            fileItemCheckbox.id = file.filename;
            fileItemCheckbox.classList.add('file-item-checkbox');
            fileItemCheckbox.addEventListener('change', e => {
                if(e.target.checked){
                    filter_files_own.push(e.target.value);
                }else{
                    filter_files_own = filter_files_own.filter(f => f !== e.target.value);
                }
            });

            let fileItemLabel = document.createElement('label');
            fileItemLabel.textContent = file.filename;
            fileItemLabel.htmlFor = file.filename;
            fileItemLabel.classList.add('file-item-label');

            fileItemCheckboxContainer.appendChild(fileItemCheckbox);
            fileItemCheckboxContainer.appendChild(fileItemLabel);

            collectionOwnContainer.appendChild(fileItemCheckboxContainer);

        });

        dropdownContainer(collectionOwnContainer, document.getElementById('collection-own').checked);

    })
    .catch(err => {
        console.log(err.data);
        let msgError = document.createElement('p');
        msgError.classList.add('error');
        msgError.textContent = `No se pudieron obtener los archivos.`;
        filesList.appendChild(msgError);

        console.error(err);

    });
    
}

updateFileList();


// Chat

setUpChat();

// File Collection


function dropdownContainer(container, show = false) {
    if(!container.classList.contains('dropdown')) container.classList.add('dropdown');

    if(show){
        container.style.height = container.dataset.height && parseInt(container.dataset.height) ? `${container.dataset.height}px` : 'auto';
        if(container.style.height == 'auto'){
            const height = container.clientHeight;
            container.style.height = height + 'px';
        }
    }else{
        const height = container.clientHeight;
        container.dataset.height = height;
        container.style.height = '0px';
    }

}

document.getElementById('collection-all').addEventListener('change', e => {

    if(e.target.checked){
        filter_files = "all";
        dropdownContainer(collectionOwnContainer, false);
    }

});


document.getElementById('collection-own').addEventListener('change', e => {

    if(e.target.checked){
        filter_files = "own";
        dropdownContainer(collectionOwnContainer, true);
    }

});

// Settings
let modal = null;
document.getElementById('settings-btn').addEventListener('click', e => {
    if(!!modal && modal.isOpen) return;
    modal = new SettingsModal(botController, new ApiConfigStorage());
    modal.open();

    modal.on_close(() => {
        updateFileList();
        setUpChat();
    });

});
// Loader Container
function startLoader(container){
    const loader = document.createElement('div');
    loader.classList.add('loader');
    container.appendChild(loader);
    container.classList.add('loading-animation');
}

function stopLoader(container){
    let loader = container.querySelector('.loader')
    if(loader) loader.remove();
    container.classList.remove('loading-animation');
}