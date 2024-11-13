
class DatabaseModal extends Modal{
    constructor(botController, apiConfig) {
        super(document.createElement('div'), true);

        this.botController = botController;
        this.apiConfig = apiConfig;

        this.modal.classList.add('modal-settings');

        const closeBtn = document.createElement('i');
        closeBtn.classList.add('close-modal');
        this.modal.appendChild(closeBtn);

        this.content = document.createElement('div');
        this.content.classList.add('database-content');
        this.modal.appendChild(this.content);

        document.body.appendChild(this.modal);

        this.isOpened = false;

        closeBtn.addEventListener('click', this.close.bind(this));
     
        this.#buildDatabaseContent();

        this.botController = botController;
        this.apiConfig = apiConfig;

        this.on_open(this.#buildDatabaseContent.bind(this));

    }

    #buildDatabaseContent(){

        this.content.innerHTML = `
            <div class="database-header">
                <h2>Database</h2>
            </div>
            <div class="database-form">
                <div class="vector-database database-section">
                    <h2>Vector Database</h2>
                    <select name="vector-database" id="vector-database">
                    </select>
                    <div class="index-results">
                    </div>
                </div>
                <div class="separator"></div>
                <div class="doc-database database-section">  
                    <h2>Document Database</h2>
                    <select name="doc-database" id="doc-database">
                    </select>
                    <div class="index-results">
                    </div>
                </div>
            </div>

            <div class="options">
                <div class="main-mode">
                    <h2>Main Mode</h2>
                    <select name="main-mode" id="main-mode">
                        <option disabled value="1">VectorStore</option>
                        <option value="2">DocumentStore</option>
                    </select>
                </div>
                <div class="mode">
                    <h2>Mode</h2>
                    <select name="mode" id="mode">
                        <option value="hybrid">Hybrid</option>
                        <option disabled value="vector">Vector</option>
                        <option disabled value="document">Document</option>
                    </select>
                </div>
            </div>

            <h2>Files</h2>
            <div class="files-section">
            </div>

            <input type="button" value="Check Compatibility" class="check-btn">

            <div class="database-check-result">
            </div>
        `;

        const config = this.apiConfig.getApiConfig();
        const botConfig = this.apiConfig.getBotConfigSelected();

        const vectorDatabaseSettings = config['vector_database'];
        const docDatabaseSettings = config['doc_database'];

        const vectorDatabaseSelect = this.content.querySelector('#vector-database');
        const docDatabaseSelect = this.content.querySelector('#doc-database');

        Object.keys(vectorDatabaseSettings).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.text = key;
            option.selected = key === botConfig.vector_database;
            vectorDatabaseSelect.appendChild(option);
        });

        Object.keys(docDatabaseSettings).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.text = key;
            option.selected = key === botConfig.doc_database;
            docDatabaseSelect.appendChild(option);
        });

        const mainModeSelect = this.content.querySelector('#main-mode');
        const modeSelect = this.content.querySelector('#mode');

        vectorDatabaseSelect.addEventListener('change', () => {
            
            this.#getIndexDatabase(vectorDatabaseSettings[vectorDatabaseSelect.value], this.content.querySelector('.vector-database .index-results'))
            this.#loadFiles(vectorDatabaseSettings[vectorDatabaseSelect.value], docDatabaseSettings[docDatabaseSelect.value], mainModeSelect.value, modeSelect.value);

        });
        
        docDatabaseSelect.addEventListener('change', () => {
            
            this.#getIndexDatabase(docDatabaseSettings[docDatabaseSelect.value], this.content.querySelector('.doc-database .index-results'))
            this.#loadFiles(vectorDatabaseSettings[vectorDatabaseSelect.value], docDatabaseSettings[docDatabaseSelect.value], mainModeSelect.value, modeSelect.value);

        });

        this.#getIndexDatabase(vectorDatabaseSettings[botConfig.vector_database], this.content.querySelector('.vector-database .index-results'));
        this.#getIndexDatabase(docDatabaseSettings[botConfig.doc_database], this.content.querySelector('.doc-database .index-results'));
        this.#loadFiles(vectorDatabaseSettings[botConfig.vector_database], docDatabaseSettings[botConfig.doc_database], mainModeSelect.value, modeSelect.value);
    
        document.querySelector('.check-btn').addEventListener('click', () => this.#checkCompatibility(vectorDatabaseSettings[vectorDatabaseSelect.value], docDatabaseSettings[docDatabaseSelect.value], mainModeSelect.value, modeSelect.value));
    
    }

    #getIndexDatabase(databaseSettings, resultsContainer){

        startLoader(resultsContainer.parentElement);
        resultsContainer.innerHTML = '';

        let h3 = document.createElement('h3');
        h3.textContent = 'Indexes:';
        resultsContainer.appendChild(h3);

        this.botController.getAllIndex(databaseSettings)
            .then(response => {

                const tableIndex = document.createElement('table');
                const thead = document.createElement('thead');
                const tbody = document.createElement('tbody');
                const titles = ['Index', 'Chunks'];
                const tr = document.createElement('tr');
                titles.forEach(title => {
                    const th = document.createElement('th');
                    th.textContent = title;
                    tr.appendChild(th);
                });

                thead.appendChild(tr);
                tableIndex.appendChild(thead);

                let indexExists = false;

                response.index.forEach(index => {
                    const name = index.name;
                    const chunks = index.data.chunks;
                    const tr = document.createElement('tr');
                    const tdName = document.createElement('td');
                    tdName.textContent = name;
                    tr.appendChild(tdName);
                    const tdChunks = document.createElement('td');
                    tdChunks.textContent = chunks;
                    tr.appendChild(tdChunks);
                    tbody.appendChild(tr);
                    if(name == databaseSettings.settings.name){
                        tr.classList.add('selected');
                        indexExists = true;
                    }

                });

                tableIndex.appendChild(tbody);
                resultsContainer.appendChild(tableIndex);

                if(indexExists){

                    const removeBtn = document.createElement('input');
                    removeBtn.type = 'button';
                    removeBtn.value = 'Remove Index';
                    removeBtn.classList.add('remove-btn');
                    resultsContainer.appendChild(removeBtn);

                    removeBtn.addEventListener('click', () => {
                        
                        startLoader(resultsContainer.parentElement, '10%');

                        this.botController.removeIndex(databaseSettings)
                            .then(response => {
                                globalNotification.show('Index removed', NOTIFICATION_SUCCESS);
                                this.#getIndexDatabase(databaseSettings, resultsContainer);
                            })
                            .catch(error => {
                                console.log(error);
                                globalNotification.show('Error removing index', NOTIFICATION_ERROR)
                            })
                            .finally(() => stopLoader(resultsContainer.parentElement));

                    });

                }else{

                    const createBtn = document.createElement('input');
                    createBtn.type = 'button';
                    createBtn.value = 'Create Index';
                    createBtn.classList.add('create-btn');
                    resultsContainer.appendChild(createBtn);

                    createBtn.addEventListener('click', () => {
                            
                        startLoader(resultsContainer.parentElement, '10%');
        
                            this.botController.createIndex(databaseSettings)
                                .then(response => {
                                    globalNotification.show('Index created', NOTIFICATION_SUCCESS);
                                    this.#getIndexDatabase(databaseSettings, resultsContainer);
                                })
                                .catch(error => {
                                    console.log(error);
                                    globalNotification.show('Error creating index', NOTIFICATION_ERROR)
                                })
                                .finally(() => stopLoader(resultsContainer.parentElement));
        
                        });
                }

            })
            .catch(error => 
                resultsContainer.innerHTML = `<p class="error">Error</p>`
            )
            .finally(() => {
                stopLoader(resultsContainer.parentElement);
            });

    }

    #loadFiles(vectorSettings, docSettings, main_mode, mode){
    
        const data = {
            "vector_database_settings": vectorSettings,
            "document_database_settings": docSettings,
            "main_mode": main_mode,
            "mode": mode
        }

        console.log(data);

        this.botController.getFiles(data)
            .then(response => {
                const tableFiles = document.createElement('table');
                const thead = document.createElement('thead');
                const tbody = document.createElement('tbody');
                const titles = ['File', 'Chunks'];
                const tr = document.createElement('tr');
                titles.forEach(title => {
                    const th = document.createElement('th');
                    th.textContent = title;
                    tr.appendChild(th);
                });

                thead.appendChild(tr);
                tableFiles.appendChild(thead);

                response.forEach(file => {
                    const tr = document.createElement('tr');
                    const tdName = document.createElement('td');
                    tdName.textContent = file.filename;
                    tr.appendChild(tdName);
                    const tdChunks = document.createElement('td');
                    tdChunks.textContent = file.total_chunks;
                    tr.appendChild(tdChunks);
                    tbody.appendChild(tr);
                });

                tableFiles.appendChild(tbody);
                const filesSection = this.content.querySelector('.files-section');
                filesSection.innerHTML = '';
                filesSection.appendChild(tableFiles);
                
            })
            .catch(error => filesSection.innerHTML = `<p class="error">Error</p>`);

    }

    #checkCompatibility(vectorSettings, docSettings, main_mode, mode){

        const resultsContainer = this.content.querySelector('.database-check-result');

        resultsContainer.innerHTML = '';

        startLoader(resultsContainer.parentElement, '10%');

        const data = {
            "vector_database_settings": vectorSettings,
            "document_database_settings": docSettings,
            "main_mode": main_mode,
            "mode": mode
        }

        this.botController.checkCompatibility(data)
            .then(response => {
                console.log(response);

                resultsContainer.innerHTML = '<h2>Results:</h2>';


                const compatible = response.compatible;
                const errors = response.errors;
                const vectorstore = response.vectorstore;
                const docstore = response.docstore;
                const filestore = response.filestore;

                const table = document.createElement('table');
                const thead = document.createElement('thead');
                const tbody = document.createElement('tbody');
                const titles = ['Filename', `VectorStore [${vectorstore.vendor}]`, `DocumentStore [${docstore.vendor}]`, `FileStore [${filestore.vendor}]`];
                const tr = document.createElement('tr');
                titles.forEach(title => {
                    const th = document.createElement('th');
                    th.textContent = title;
                    tr.appendChild(th);
                });

                thead.appendChild(tr);
                table.appendChild(thead);


                const results = {};

                filestore.files.forEach(file => {
                    results[file.filename] = {
                        'vectorstore': '-',
                        'docstore': '-',
                        'filestore': file.total_chunks
                    }
                });

                const vectorStoreFiles = vectorstore.files.length;

                [...vectorstore.files, ...docstore.files].forEach((file, i) => {
                
                    if(file.filename.endsWith('&thumbnails')) file.filename = file.filename.replace('&thumbnails', ' (thumbnails)'); 

                    if(results[file.filename]){
                        results[file.filename][i < vectorStoreFiles ? 'vectorstore' : 'docstore'] = file.total_chunks;
                    }else{
                        results[file.filename] = {
                            'vectorstore': i < vectorStoreFiles ? file.total_chunks : '-',
                            'docstore': i < vectorStoreFiles ? '-' : file.total_chunks,
                            'filestore': '-'
                        }
                    }
                
                });

                Object.keys(results).forEach(filename => {
                    const tr = document.createElement('tr');
                    const tdFilename = document.createElement('td');
                    tdFilename.textContent = filename;
                    tr.appendChild(tdFilename);
                    const tdVectorStore = document.createElement('td');
                    tdVectorStore.textContent = results[filename]['vectorstore'];
                    tr.appendChild(tdVectorStore);
                    const tdDocStore = document.createElement('td');
                    tdDocStore.textContent = results[filename]['docstore'];
                    tr.appendChild(tdDocStore);
                    const tdFileStore = document.createElement('td');
                    tdFileStore.textContent = results[filename]['filestore'];
                    tr.appendChild(tdFileStore);
                    tbody.appendChild(tr);
                });

                table.appendChild(tbody);

                resultsContainer.appendChild(table);

                let h2 = document.createElement('h2');
                h2.innerHTML = `<span class='compatibility ${compatible ? 'compatibility-ok' : 'compatibility-no-ok'}'>${compatible ? 'COMPATIBLE' : 'NO COMPATIBLE'}</span>`;
                resultsContainer.appendChild(h2);
                
                if(errors.length){

                    h2 = document.createElement('h2');
                    h2.textContent = 'Errors:';
                    resultsContainer.appendChild(h2);

                    const ul = document.createElement('ul');
                    ul.classList.add('errors');
                    errors.forEach(error => {
                        const li = document.createElement('li');
                        li.textContent = error;
                        ul.appendChild(li);
                    });

                    resultsContainer.appendChild(ul);
                }

                //scroll down:
                resultsContainer.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});

            })
            .catch(error => resultsContainer.innerHTML = `<p class="error">Error</p>`)
            .finally(() => {
                stopLoader(resultsContainer.parentElement);
            });


    }
}