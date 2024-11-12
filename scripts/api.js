
class IBotController {

    constructor(host = null) {
        this.host = host;
    }

    setHost(host) {
        this.host = host;
    }

    getHost() {
        return this.host;
    }

    setSwagger(swagger) {
        this.swagger = swagger;
    }

    getSwagger() {
        return this.swagger;
    }

    uploadFiles(files) {
        throw new Error('Method not implemented');
    }

    getFiles() {
        throw new Error('Method not implemented');
    }

    getFile(filename) {
        throw new Error('Method not implemented');
    }

    deleteFile(filename) {
        throw new Error('Method not implemented');
    }

    queryBot(query, files = null) {
        throw new Error('Method not implemented');
    }

    queryBotStream(query, files = null) {
        throw new Error('Method not implemented');
    }

    getVendorInfo(vendor) {
        throw new Error('Method not implemented');
    }

    getAllIndex(settings) {
        throw new Error('Method not implemented');
    }

    checkCompatibility(data) {
        throw new Error('Method not implemented');
    }

    testConfig(endpoint, config) {
        throw new Error('Method not implemented');
    }

    hardReset(data) {
        throw new Error('Method not implemented');
    }
}

const DEFAULT_HEADERS = {'Content-Type': 'application/json', 'Accept': 'application/json', 'Access-Control-Allow-Origin': '*'};

class BotController extends IBotController{

    constructor(host) {
        super(host);
        this.setSwagger(`${host}/swagger-ui`);
        this.api_base = "/api/v1"
        this.apiConf = new ApiConfigStorage();
    }

    request(method, endpoint, data = null, headers = DEFAULT_HEADERS, toJson = true) {
        return fetch(`${this.host}${this.api_base}/${endpoint}`, {
            method: method,
            headers: headers,
            body: data ? (toJson ? JSON.stringify(data) : data) : null,
        })
            .then(async response => {
                if (!response.ok) {
                    throw new FetchError(`[${response.status}] ${response.statusText}`, await response.json(), response.status);
                }
                return response;
            });
    }

    #configFiles(){
        const conf = this.apiConf.getApiBotConfig();
        return {
            "vector_database_settings": conf.vector_database,
            "document_database_settings": conf.doc_database,
            "mode": conf.bot_settings.mode,
            "main_mode": `${conf.bot_settings.main_mode}`
        }
    }

    #configFilesUpload(formData, stream=false){
        const conf = this.apiConf.getApiBotConfig();
        let settings = {
            "vector_database_settings": conf.vector_database,
            "document_database_settings": conf.doc_database,
            "embedding_settings": conf.embedding,
            "mode": conf.bot_settings.mode,
            "main_mode": `${conf.bot_settings.main_mode}`,
            "split_settings": conf.splitter,
            "stream": stream,
            "save_file": true,
        }
        formData.append('settings', JSON.stringify(settings));
        return formData;
    }

    #configBot(query, chatHistory=[], files=null, stream=false){
        const conf = this.apiConf.getApiBotConfig();
        return {
            "vector_database_settings": conf.vector_database,
            "document_database_settings": conf.doc_database,
            "embedding_settings": conf.embedding,
            "llm_settings": conf.llm,
            "rerank_settings": conf.rerank,
            "mode": conf.bot_settings.mode,
            "main_mode": `${conf.bot_settings.main_mode}`,
            "settings": {
                "add_thumbnail": conf.bot_settings.add_thumbnail,
                "mult_top_k": conf.bot_settings.mult_top_k,
                "top_history": conf.bot_settings.top_history,
                "scorer": conf.bot_settings.scorer,
                "stream": stream,
                "stream_chunks": true
            },
            "filenames": files,
            "history": chatHistory,
            "query": query
        }

    }

    getFiles(data = null){
        return this.request('POST', 'file/index', data ?? this.#configFiles()).then(response => response.json());
    }


    getFileURL(filename){
        return `${this.host}${this.api_base}/file/${filename}`;
    }

    queryBot(query, files = null) {
        let data = {query: query};

        return this.request('POST', 'bot' + (files != null ? `?files=${files}` : ''), data)
            .then(response => response.json());
    }

    queryBotStream(query, chatHistory=[], files = null) {
        return this.request('POST', 'bot', JSON.stringify(this.#configBot(query, chatHistory, files, true)), DEFAULT_HEADERS, false)
    }

    uploadFiles(formData) {
        return this.request('POST', 'file', this.#configFilesUpload(formData), {'Access-Control-Allow-Origin': '*'}, false);
    }

    uploadFilesStream(formData) {
        return this.request('POST', 'file', this.#configFilesUpload(formData, true), {'Access-Control-Allow-Origin': '*'}, false);
    }

    removeFile(filename){
        return this.request('DELETE', `file/index/${filename}`, this.#configFiles(), {'Access-Control-Allow-Origin': '*'}, false);
    }

    getVendorInfo(vendor){
        return this.request('GET', `vendor?type=${vendor}`).then(response => response.json());
    }

    getAllIndex(settings){
        return this.request('POST', 'database/index/all', settings).then(response => response.json());
    }

    
    checkCompatibility(data){
        return this.request('POST', 'develop/database/check-compatibility', data).then(response => response.json());
    }

    hardReset(data) {
        throw new Error('Method not implemented');
    }

    async testConfig(endpoint, config){

        try{

            let response = await this.request('POST', endpoint, config);
            
            if(response.status == 204) return {ok: true, data: {}};
            return {ok: response.status < 400, data: await response.json(), status: response.status};
        }catch(e){
            return {ok: false, data: e.data, status: e.status, errMessage: e.message};
        }
        
    }

}

async function* stream(response){
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;

    let accumulatedJson = "";

    while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
            let chunks = decoder.decode(value, { stream: true });

            accumulatedJson += chunks;
            
            accumulatedJson = accumulatedJson.replaceAll("data: {", ",{");

            try {
              const json = JSON.parse(`[{}${accumulatedJson}]`);
              yield json;

              accumulatedJson = "";

            } catch (error) {
            }
        }
    }

    if (accumulatedJson) {
        try {
            const json = JSON.parse(`[{}${accumulatedJson}]`);
            yield json;
        } catch (error) {
        }
    }
}

//gpt-4o-mini
