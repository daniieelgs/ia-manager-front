DEFAULT_API = {
    "name": "POC API",
    "host": "https://ia-manager.ddns.net/backend",
    "selected": true
}

class BaseStorage {
    setItem(name, data) {
        localStorage.setItem(name, JSON.stringify(data));
    }

    getItem(name) {
        return JSON.parse(localStorage.getItem(name));
    }

    removeItem(name) {
        localStorage.removeItem(name);
    }

    clear() {
        localStorage.clear();
    }
}

class ApiStorage {

    constructor() {
        this.storage = new BaseStorage();
    }
    

    getApiServer() {
        let saved = this.storage.getItem('api_server');
        if (saved === null || saved.length === 0) {
            saved = [DEFAULT_API];
            this.storage.setItem('api_server', saved);
        }
        return saved;
    }
    
    addApiServer(name, host, selected = false) {
        let servers = this.storage.getItem('api_server');
        if (servers === null) {
            servers = [DEFAULT_API];
        }
        servers.push({"name": name, "host": host, "selected": selected});
        this.storage.setItem('api_server', servers);
    }
    
    removeApiServer(name) {
        let servers = this.storage.getItem('api_server');
        if (servers === null) {
            return;
        }
        let index = servers.findIndex(server => server.name === name);
        if (index !== -1) {
            servers.splice(index, 1);
            this.storage.setItem('api_server', servers);
        }
    }
    
    selectApiServer(name) {
        let servers = this.storage.getItem('api_server');
        if (servers === null) {
            return;
        }
        servers.forEach(server => {
            server.selected = server.name === name;
        });
        this.storage.setItem('api_server', servers);
    }

}

DEFAULT_CONFIG = {

    "vector_database": {
        "vendor": "chroma",
        "settings": {
            "name": "default",
            "top_k": 10,
        }
    },

    "doc_database": {
        "vendor": "lance",
        "settings": {
            "name": "default",
        }
    },

    "embedding": {
        "vendor": "azureopenai",
        "settings": {
            "api_key": "",
            "endpoint": "",
            "api_version": "2024-05-01-preview",
            "model": "text-embedding-3-small"
        }

    },

    "rerank": {
        "vendor": "Cohere",
        "settings": {
            "api_key": "",
            "model": "rerank-multilingual-v3.0"
        }

    },

    "llm": {
        "vendor": "AzureOpenAIChat",
        "settings": {
            "api_key": "",
            "endpoint": "",
            "api_version": "2024-05-01-preview",
            "deployment_name": "gpt-4o-mini",
            "model": "gpt-4o-mini",
            "temperature": 0.4
        },
        "system_prompt": "This is a question answering system, answwer always in spanish",
        "qa_prompt": "Use the following pieces of context to answer the question at the end in detail with clear explanation. If you don't know the answer, just say that you don't know, don't try to make up an answer. Give answer in spanish.\n\n{context}\nQuestion: {question}\nHelpful Answer:",
    },
    
    "bot": {
        "mode": "hybrid",
        "main_mode": 2,
        "mult_top_k": 10,
        "top_history": null,
        "add_thumbnail": true,
        "scorer": true
    },

    "scorer": {
        "vendor": "llmtrulens",
        "settings": {}
    },

    "splitter": {
        "vendor": "llamatoken",
        "settings": {
            "chunk_size": 1024,
            "chunk_overlap": 256,
            "content_page": true,
            "separator": "\n\n",
            "backup_separators": ["\n", ".", " ", "\u200b"]
        }
    }
}

class ApiConfigStorage {

    constructor() {
        this.storage = new BaseStorage();
    }

    getApiConfig() {
        let saved = this.storage.getItem('api_config');
        if (saved === null || !Object.keys(saved).length) {
            saved = DEFAULT_CONFIG;
            this.storage.setItem('api_config', saved);
        }
        return saved;
    }

    setApiConfig(config) {
        this.storage.setItem('api_config', config);
    }

}