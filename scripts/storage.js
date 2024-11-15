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
        try{
            return JSON.parse(localStorage.getItem(name));
        }catch{
            return null;
        }
        
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

const DEFAULT_CONFIG = {

    "vector_database": {

        "default" : {
            "vendor": "chroma",
            "settings": {
                "name": "default",
                "top_k": 10,
            }
        }
    },

    "doc_database": {
        "default" : {
            "vendor": "lance",
            "settings": {
                "name": "default",
            }
        }
    },

    "embedding": {
        "default" : {
            "vendor": "azureopenai",
            "settings": {
                "api_key": "",
                "endpoint": "",
                "api_version": "2024-05-01-preview",
                "model": "text-embedding-3-small"
            }
        }
    },

    "rerank": {
        "default" : {
            "vendor": "Cohere",
            "settings": {
                "api_key": "",
                "model": "rerank-multilingual-v3.0"
            }
        }

    },

    "llm": {
        "default" : {
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
        }    
    },
    
    "bot_settings": {
        "default" : {
            "mode": "hybrid",
            "main_mode": 2,
            "mult_top_k": 10,
            "top_history": null,
            "add_thumbnail": true,
            "scorer": true
        }
    },

    "scorer": {
        "default" : {
            "vendor": "llmtrulens",
            "settings": {}
        }
    },

    "splitter": {
        "default" : {
            "vendor": "llamatoken",
            "settings": {
                "chunk_size": 1024,
                "chunk_overlap": 256,
                "content_page": true,
                "separator": "\n\n",
                "backup_separators": ["\n", ".", " ", "\u200b"]
            }
        }
    },
}

const DEFAULT_BOT_CONFIG = {
    "default" : {
        "vector_database": "default",
        "doc_database": "default",
        "embedding": "default",
        "rerank": "default",
        "llm": "default",
        "bot_settings": "default",
        "scorer": "default",
        "splitter": "default",
        "selected": true
    }
}

class ApiConfigStorage {

    constructor() {
        this.storage = new BaseStorage();
        this.botSelected = null;
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

    getBotConfig() {
        let saved = this.storage.getItem('bot_config');
        if (saved === null || !Object.keys(saved).length) {

            const apiConfig = this.getApiConfig();

            for (const key in apiConfig) {
                if(!apiConfig[key].hasOwnProperty('default')) {
                   apiConfig[key]['default'] = DEFAULT_CONFIG[key]['default'];
                }
            }

            this.setApiConfig(apiConfig);

            saved = DEFAULT_BOT_CONFIG;
            this.storage.setItem('bot_config', saved);
        }
        return saved;
    }

    getBotConfigSelected() {
        const botConfig = this.getBotConfig();
        return botConfig[Object.keys(botConfig).find(key => botConfig[key].selected)];
    }

    setBotConfig(config) {
        this.storage.setItem('bot_config', config);
    }

    getApiBotConfig(bot = null) {
    
        const botConfig = this.getBotConfig();

        if(!this.botSelected || !botConfig[this.botSelected]?.selected) {
            this.botSelected = Object.keys(botConfig).find(key => botConfig[key].selected);
            if(!this.botSelected) {
                const firstBot = Object.keys(botConfig)[0];
                botConfig[firstBot].selected = true;
                this.botSelected = firstBot;
                this.setBotConfig(botConfig);
            }
        }

        const botSelected = bot ?? this.botSelected;

        const apiConfig = this.getApiConfig();

        try{
            return {
                "vector_database": apiConfig['vector_database'][botConfig[botSelected].vector_database] ?? apiConfig['vector_database']['default'],
                "doc_database": apiConfig['doc_database'][botConfig[botSelected].doc_database] ?? apiConfig['doc_database']['default'],
                "embedding": apiConfig['embedding'][botConfig[botSelected].embedding] ?? apiConfig['embedding']['default'],
                "rerank": apiConfig['rerank'][botConfig[botSelected].rerank] ?? apiConfig['rerank']['default'],
                "llm": apiConfig['llm'][botConfig[botSelected].llm] ?? apiConfig['llm']['default'],
                "bot_settings": apiConfig['bot_settings'][botConfig[botSelected].bot_settings] ?? apiConfig['bot_settings']['default'],
                "scorer": apiConfig['scorer'][botConfig[botSelected].scorer] ?? apiConfig['scorer']['default'],
                "splitter": apiConfig['splitter'][botConfig[botSelected].splitter] ?? apiConfig['splitter']['default'],
            }
        }catch{
            this.setBotConfig(DEFAULT_BOT_CONFIG);
            this.setApiConfig(DEFAULT_CONFIG);
            return null;
        }

    }

    resetBotConfig(bot) {
        const botConfig = this.getBotConfig();
        botConfig[bot].selected;

        botConfig[bot] = DEFAULT_BOT_CONFIG['default'];
        botConfig[bot].selected = true;

        this.setBotConfig(botConfig);
    }

}