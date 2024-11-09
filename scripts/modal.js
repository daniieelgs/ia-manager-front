class Modal {
    constructor(modal, canClose = true) {

        this.modal = modal;

        this.can_close = canClose;
        this.isOpen = false;

        this.open_callbacks = [];
        this.close_callbacks = [];

    }

    open() {
        if(!this.modal.classList.contains('show')) this.modal.classList.add('show');
        this.isOpen = true;
        this.open_callbacks.forEach(callback => callback(this));
        document.body.style.overflow = 'hidden';
        return this;
    }

    close() {
        if(this.modal.classList.contains('show')) this.modal.classList.remove('show');
        this.isOpen = false;
        this.close_callbacks.forEach(callback => callback(this));
        document.body.style.overflow = 'auto';
        return this;
    }

    on_open(callback) {
        this.open_callbacks.push(callback);
        return this;
    }

    on_close(callback) {
        this.close_callbacks.push(callback);
        return this;
    }

    remove_on_open(callback) {
        this.open_callbacks = this.open_callbacks.filter(c => c != callback);
        return this;
    }

    remove_on_close(callback) {
        this.close_callbacks = this.close_callbacks.filter(c => c != callback);
        return this;
    }

    isOpened() {
        return this.isOpen;
    }

    canClose() {
        return this.can_close;
    }

    setClose(canClose) {
        this.can_close = canClose;
        return this;
    }

    setModal(modal) {
        this.modal = modal;
        return this;
    }

    getModal() {
        return this.modal;
    }

    getResult() {
        return this.result;
    }


}

NOTIFICATION_ERROR = 'error';
NOTIFICATION_SUCCESS = 'success';
NOTIFICATION_INFO = 'info';
NOTIFICATION_WARNING = 'warning';

class NotificationModal extends Modal {
    constructor(canClose = true, timeout = 3000, remove = false) {
        super(document.createElement('div'), canClose);
        this.modal.classList.add('notification-modal-container');

        const notificationContainer = document.createElement('div');
        notificationContainer.classList.add('notification-container');

        this.msg = document.createElement('h1');
        this.msg.classList.add('notification-modal-title');
        notificationContainer.appendChild(this.msg);

        this.modal.appendChild(notificationContainer);

        document.body.appendChild(this.modal);

        this.defaultTimeout = timeout;
        this.timoutId = null;
        this.defaultRemove = remove;

        if (canClose) {
            this.modal.addEventListener('click', this.hide.bind(this));
        }

    }

    show(msg, type, timeout = this.defaultTimeout, remove = false) {
        this.setMsg(msg);
        this.modal.classList.remove('exit');
        if(!this.modal.classList.contains('enter')) this.modal.classList.add('enter');

        this.setMsgType(type);

        this.timoutId = setTimeout(() => {
            this.hide();
            if (remove) setTimeout(() => this.remove(), 500);
        }, timeout);

        console.log('show', this.timoutId, remove);

        return this.open.bind(this);
    }

    hide() {
        this.modal.classList.add('exit');
        this.modal.classList.remove('enter');
        this.timoutId = null;
        return this.close.bind(this);
    }

    setMsg(msg) {
        this.msg.innerHTML = msg;
        return this;
    }

    setMsgType(type) {
        this.modal.classList.remove(NOTIFICATION_ERROR);
        this.modal.classList.remove(NOTIFICATION_SUCCESS);
        this.modal.classList.remove(NOTIFICATION_INFO);
        this.modal.classList.remove(NOTIFICATION_WARNING);

        this.modal.classList.add(type);

        this.type = type;

        return this;
    }

    resetTimeout(timeout = this.defaultTimeout, remove = false) {

        console.log('resetTimeout', this.timoutId, this.isOpened());

        if (this.timoutId && this.isOpened()){
            clearTimeout(this.timoutId);
            this.timoutId = setTimeout(() => {
                this.hide();
                if (remove) setTimeout(() => this.remove(), 500);
            }, timeout);

        }else this.show(this.getMsg(), this.getMsgType(), timeout, remove);

        return this;

    }

    remove() {
        if (document.body.contains(this.modal))
            document.body.removeChild(this.modal);
    }

    getMsg() {
        return this.msg.innerHTML;
    }

    getMsgType() {
        return this.type;
    }
}

class AbstractModalQuestion extends Modal {
    constructor(modal, canClose) {
        super(modal, canClose);
        this.buttonsContainer = document.createElement('div');

        this.buttons_list = [];

        this.result = null;
    }

    add_button(text, name, color = null) {       
        if(this.buttons_list.length == 0) this.buttonsContainer.classList.add('modal-question-buttons');
        const button = document.createElement('button');
        button.innerHTML = text;
        button.classList.add('modal-question-button');
        button.dataset.name = name;
        if (color) button.style.backgroundColor = color;
        this.buttonsContainer.appendChild(button);
        this.buttons_list.push(button);
        return this;
    }

    action_listener(){
        return new Promise((resolve, reject) => {
            console.log('buttons_list');
            console.log(this.buttons_list);
            this.buttons_list.forEach(button => {
                button.addEventListener('click', () => {
                    this.result = button.dataset.name;
                    resolve(button.dataset.name);
                    this.close();
                });
            });
            this.on_close(reject);
        });
    }

    get_result() {
        return this.result;
    }
}

class ModalQuestion extends AbstractModalQuestion{
    constructor(msg = "", canClose = true) {
        super(document.createElement('div'), canClose);
        this.modal = document.createElement('div');
        this.modal.classList.add('modal-question');
        const container = document.createElement('div');
        container.classList.add('modal-question-container');

        this.msg = document.createElement('h1');
        this.msg.classList.add('question-title');
        this.msg.innerHTML = msg;
        container.appendChild(this.msg);

        this.isOpened = false;

        container.appendChild(this.buttonsContainer);

        this.modal.appendChild(container);

        document.body.appendChild(this.modal);

    }

    set_question(msg) {
        this.msg.innerHTML = msg;
    }

    open() {
        super.open();

        return this.action_listener();
    }

}

YES_BUTTON = 'yes';
NO_BUTTON = 'no';

class YesNoModalQuestion extends ModalQuestion {
    constructor(msg = "") {
        super(msg);
        this.add_button('Sí', YES_BUTTON, '#3f51b5');
        this.add_button('No', NO_BUTTON, '#f44336');
    }
}

class NewApiModal extends AbstractModalQuestion {
    constructor(hosts = []) {
        super(document.createElement('div'), true);

        const msg = 'Add new API server';

        this.modal.classList.add('modal-question', 'modal-new-api');

        const container = document.createElement('div');
        container.classList.add('modal-question-container');

        this.msg = document.createElement('h1');
        this.msg.classList.add('question-title');
        this.msg.innerHTML = msg;
        container.appendChild(this.msg);

        const inputsContainer = document.createElement('div');
        inputsContainer.classList.add('modal-api-inputs');
        this.inputApiName = document.createElement('input');
        this.inputApiName.placeholder = 'API name';

        this.inputApiHost = document.createElement('input');
        this.inputApiHost.placeholder = 'API host';

        inputsContainer.appendChild(this.inputApiName);
        inputsContainer.appendChild(this.inputApiHost);

        container.appendChild(inputsContainer);

        container.appendChild(this.buttonsContainer);

        this.modal.appendChild(container);

        document.body.appendChild(this.modal);

        this.add_button('Save', 'save', '#007BFF');
        this.add_button('Cancel', 'cancel', '#DC3545');

        this.isOpened = false;

        const emptyValue = () => {
            if(this.inputApiName.value.trim() !== '' && this.inputApiHost.value.trim() !== '') {
                this.buttons_list[0].removeAttribute('disabled');
            }else this.buttons_list[0].setAttribute('disabled', 'disabled');
        }
        
        this.inputApiName.addEventListener('keyup', emptyValue);
        this.inputApiHost.addEventListener('keyup', emptyValue);

        this.inputApiName.addEventListener('keyup', () => {
            const name = this.inputApiName.value.trim();
            if(hosts.some(host => host.name === name)) {
                this.inputApiName.classList.add('error');
                this.buttons_list[0].setAttribute('disabled', 'disabled');
            }
        });

        this.inputApiName.focus();
        
        this.buttons_list[0].setAttribute('disabled', 'disabled');

    }

    open() {
        super.open();
        return this.action_listener();
    }

    get_name() {
        return this.inputApiName.value;
    }

    get_host() {
        return this.inputApiHost.value;
    }
}


class SettingsModal extends Modal {
    
    constructor(botController, apiConfig) {
        super(document.createElement('div'), true);

        this.botController = botController;
        this.apiConfig = apiConfig;

        this.modal.classList.add('modal-settings');

        const closeBtn = document.createElement('i');
        closeBtn.classList.add('close-modal');
        this.modal.appendChild(closeBtn);

        const menu = document.createElement('div');
        menu.classList.add('settings-menu');
        this.modal.appendChild(menu);

        this.content = document.createElement('div');
        this.content.classList.add('settings-content');
        this.modal.appendChild(this.content);

        for (let type of TYPES) {
            const section = document.createElement('div');
            section.classList.add('settings-menu-item');
            
            section.dataset.type = type.vendor;
            section.innerHTML = `<span>${type.name}</span>`;
            menu.appendChild(section);

            section.addEventListener('click', this.#open_section.bind(this, section, type));

            if(type === TYPES[0]) {
                section.classList.add('selected');
                this.#open_section(section, type);
            }
        }

        const btnContainer = document.createElement('div');
        btnContainer.classList.add('btn-container');
        this.testBtn = document.createElement('button');
        this.testBtn.innerHTML = 'Test';
        this.testBtn.classList.add('btn', 'btn-test');
        btnContainer.appendChild(this.testBtn);

        this.saveBtn = document.createElement('button');
        this.saveBtn.innerHTML = 'Save';
        this.saveBtn.classList.add('btn', 'btn-save');
        btnContainer.appendChild(this.saveBtn);

        this.modal.appendChild(btnContainer);

        this.desSerializeInputConf = () => {

            if(!this.confInputs) return {};

            if(this.confInputs.data) return this.confInputs.data;

            let data = {
                vendor: this.confInputs.vendorSelect.value,
                settings: {}
            };

            for(let setting of this.confInputs.settings ?? []){
                if(!setting.input.value) continue;
                data.settings[setting.field] = setting.field === 'Boolean' ? setting.input.checked : setting.input.value;
            }

            for(let setting of this.confInputs.additional_settings ?? []){
                data[setting.field] = setting.type === 'boolean' ? setting.input.checked : setting.input.value;
            }
            return data;
        }

        this.testBtn.addEventListener('click', () => {

            let resultContainer = document.getElementById('test-result');
            if(resultContainer) resultContainer.remove();

            resultContainer = document.createElement('div');
            resultContainer.classList.add('test-result');
            resultContainer.id = 'test-result';
            
            resultContainer.classList.add('loading');

            this.content.appendChild(resultContainer);

            let data = this.desSerializeInputConf.bind(this)();

            try{
                this.botController.testConfig(this.confInputs?.test ?? '/check-settings', data).then(response => {
                    resultContainer.classList.remove('loading');
                    if(response.ok) {
                        const h1 = document.createElement('h1');
                        h1.innerHTML = 'Valid configuration';
                        h1.classList.add('success');
                        resultContainer.appendChild(h1);
                        if(response.data.length > 0){
                            const h3 = document.createElement('h3');
                            h3.innerHTML = 'Response';
                            resultContainer.appendChild(h3);
                            const pre = document.createElement('span');
                            pre.classList.add('response');
                            pre.innerHTML = JSON.stringify(response.data, null, 2);
                            resultContainer.appendChild(pre);
                        }
                    }else {
                        const h1 = document.createElement('h1');
                        h1.innerHTML = 'Invalid configuration';
                        h1.classList.add('error');
                        resultContainer.appendChild(h1);

                        if(response.status == 422){
                            let data = response.data.message.replace(/'/g, '"');
                            console.log(data);
                            data = JSON.parse(data);
                            for(let field in data){
                                const p = document.createElement('p');
                                p.innerHTML = `<span class="field">${field}</span>: ${data[field]}`;
                                p.classList.add('field-error');
                                resultContainer.appendChild(p);
                            }
                        }

                        else if(response.status == 406){
                            console.log(response.data);
                            const h3 = document.createElement('h3');
                            h3.classList.add('message-error');

                            h3.innerHTML = response.data.message.message? response.data.message.message : response.data.message;
                            resultContainer.appendChild(h3);
                        }

                        else if(response.status >= 500){
                            h1.innerHTML = 'Internal server error';
                        }else{
                            console.log(response);
                            h1.innerHTML = response.errMessage;
                        }

                    }
                })
                .catch(e => {
                    console.error(e);
                });
            }catch(e){
                new NotificationModal().show('Error testing configuration: ' + e.message, NOTIFICATION_ERROR, 3000, true);
            }
            

        });

        this.saveBtn.addEventListener('click', () => {

            const notification = new NotificationModal();

            try{
                let data = this.desSerializeInputConf.bind(this)();
                let apiConfig = this.apiConfig.getApiConfig();
    
                apiConfig[this.confInputs.conf] = data;
    
                this.apiConfig.setApiConfig(apiConfig);

                notification.show('Configuration saved', NOTIFICATION_SUCCESS, 3000, true);
            }catch(e){
                notification.show('Error saving configuration', NOTIFICATION_ERROR, 3000, true);
            }

        });

        document.body.appendChild(this.modal);

        this.isOpened = false;

        closeBtn.addEventListener('click', this.close.bind(this));

    }

    #open_section(section, type) {
        document.querySelectorAll('.settings-menu-item').forEach(item => item.classList.remove('selected'));
        section.classList.add('selected');
        this.botController.getVendorInfo(type.vendor).then(vendorInfo => {
            this.#build_section.bind(this)(type, vendorInfo);
        });
    }

    #build_section(type, vendorInfo) {
        this.content.innerHTML = '';

        if(type.name == 'Preview'){
            this.#build_preview_section.bind(this)(type);
            return;
        }

        const vendorConfig = document.createElement('div');
        vendorConfig.classList.add('vendor');

        let apiConfig = this.apiConfig.getApiConfig()

        let typeConfig = apiConfig[type.conf];

        const settingsForm = document.createElement('div');
        settingsForm.classList.add('form-settings');

        const additionalSettings = document.createElement('div');
        additionalSettings.classList.add('form-settings', 'additional-settings');

        this.confInputs = {"test": type.test, "conf": type.conf};

        if(vendorInfo.length > 0) {
            const vendor = document.createElement('select');
            vendor.classList.add('vendor-select');
            let options = vendorInfo.map(info => {
                let option = document.createElement('option');
                option.value = info.vendor;
                option.innerHTML = info.vendor;
                option.selected = !!typeConfig && typeConfig.vendor === info.vendor;
                return option;
            });

            vendor.append(...options);

            let label = document.createElement('label');
            label.innerHTML = 'Vendor:';

            vendorConfig.appendChild(label);
            vendorConfig.appendChild(vendor);

            this.confInputs.vendorSelect = vendor;

            const updateSettings = () => {

                settingsForm.innerHTML = '';

                let settingsInput = [];

                for(let settings of Array.from(vendorInfo.find(v => v.vendor == vendor.value).settings)){
                    let input = document.createElement('input');

                    if(settings.type == "String") input.type = "text";
                    else if(settings.type == "Integer") input.type = "number";
                    else if(settings.type == "Boolean") input.type = "checkbox";
                    else if(settings.type == "Float") input.type = "number";
                    else if(settings.type == "List") input.type = "text";
                    else if(settings.type == "Dict") input.type = "text";
                    else input.type = "text";

                    input.value = typeConfig.settings[settings.field] || (settings.default == "None" ? "" : settings.default);
                    input.placeholder = settings.description;
                    input.id = settings.field;

                    let label = document.createElement('label');
                    label.innerHTML = settings.field;
                    label.htmlFor = settings.field;

                    let container = document.createElement('div');
                    container.classList.add('form-group');
                    container.appendChild(label);
                    container.appendChild(input);
                    if(settings.type == "Boolean") {
                        input.checked = typeConfig.settings[settings] || (settings.default == "None" ? "" : settings.default);
                        container.style.flexDirection = "row";
                        label.style.gap = "2px";
                    }

                    settingsForm.appendChild(container);

                    settingsInput.push({
                        field: settings.field,
                        type: settings.type,
                        input: input
                    });
                }

                this.confInputs.settings = settingsInput;

                settingsForm.appendChild(additionalSettings);

            }

            updateSettings();

            vendor.addEventListener('change', updateSettings);

        }

        if(type.additonal_settings){

            this.confInputs.additional_settings = [];

            for(let settings of type.additonal_settings){
                let input;

                if(settings.type === 'long_text'){
                    input = document.createElement('textarea');
                    input.value = typeConfig[settings.name] || '';
                }else if(settings.type === 'select') {
                    input = document.createElement('select');
                    let options = settings.options.map(option => {
                        let optionElement = document.createElement('option');
                        optionElement.value = option.value;
                        optionElement.innerHTML = option.name;
                        optionElement.selected = typeConfig[settings.name] === option.value;
                        if(option.disabled) optionElement.setAttribute('disabled', 'disabled');
                        return optionElement;
                    });
                    input.append(...options);
                }else if(settings.type === 'number') {
                    input = document.createElement('input');
                    input.type = 'number';
                    input.value = typeConfig[settings.name] || settings.value;
                }else if(settings.type === 'text') {
                    input = document.createElement('input');
                    input.type = 'text';
                    input.value = typeConfig[settings.name] || '';
                }else if(settings.type === 'boolean') {
                    input = document.createElement('input');
                    input.type = 'checkbox';
                    input.checked = typeConfig[settings.name] || false;
                }

                input.placeholder = settings.description;
                input.id = settings.name;

                let label = document.createElement('label');
                label.innerHTML = settings.description;
                label.htmlFor = settings.name;

                let container = document.createElement('div');
                container.classList.add('form-group');
                if(settings.type === 'boolean') {
                    container.style.flexDirection = "row";
                }
                container.appendChild(label);
                container.appendChild(input);

                additionalSettings.appendChild(container);

                this.confInputs.additional_settings.push({
                    field: settings.name,
                    type: settings.type,
                    input: input
                });
            
            }

            if(vendorInfo.length == 0) settingsForm.appendChild(additionalSettings);

        }
        

        vendorConfig.appendChild(settingsForm);

        this.content.appendChild(vendorConfig);

        this.testBtn.style.display = !!type.test ? 'block' : 'none';
        this.saveBtn.style.display = 'block';

    }

    #build_preview_section(previewType) {
        const preview = document.createElement('div');
        preview.classList.add('preview');
        this.content.appendChild(preview);

        this.saveBtn.style.display = 'none';
        this.testBtn.style.display = 'block';

        let config = this.apiConfig.getApiConfig();

        const resetConfBtn = document.createElement('button');
        resetConfBtn.innerHTML = 'Reset configuration';
        resetConfBtn.classList.add('btn-reset');

        const build = () => {

            this.confInputs = {
                "data": {

                    "vector_database_settings": config.vector_database,
                    "document_database_settings": config.doc_database,
                    "main_mode": `${config.bot.main_mode}`,
                    "mode": config.bot.mode,
                    "embedding_settings": config.embedding,
                    "rerank_settings": config.rerank,
                    "llm_settings": config.llm,
                    "scorer_settings": config.scorer,
                    "settings": {
                        "add_thumbnail": config.bot.add_thumbnail,
                        "mult_top_k": config.bot.mult_top_k,
                        "scorer": config.bot.scorer,
                        "top_history": config.bot.top_history
                    }

                },
                "test": previewType.test
        };

            for(let type of TYPES){
            
                if(type == previewType) continue;

                const section = document.createElement('div');
                section.classList.add('preview-section');
                const h2 = document.createElement('h2');
                h2.innerHTML = type.name;
                section.appendChild(h2);
            
                let data = {...config[type.conf]};

                if(!data) {
                    const p = document.createElement('p');
                    p.innerHTML = 'No configuration';
                    section.appendChild(p);
                }else{
                    let vendor = data.vendor;
                    let settings = data.settings ?? {};
                    delete data.vendor;
                    delete data.settings;
                    let additional_settings = data ?? {};

                    let vendorP = document.createElement('p');
                    vendorP.innerHTML = `<span class="field">Vendor</span>: ${vendor}`;
                    if(vendor) section.appendChild(vendorP);

                    if(Object.keys(settings).length > 0 || Object.keys(additional_settings).length > 0){
                        
                        let settingsP = document.createElement('p');
                        settingsP.innerHTML = '<span class="field">Settings</span>:';
                        section.appendChild(settingsP);

                        const settingsList = document.createElement('ul');
                        settingsList.classList.add('settings-list');
                        for(let setting in settings){
                            let li = document.createElement('li');
                            li.innerHTML = `<span class="field">${setting}</span>: ${settings[setting]}`;
                            settingsList.appendChild(li);
                        }

                        for(let setting in additional_settings){
                            let li = document.createElement('li');
                            li.innerHTML = `<span class="field">${setting}</span>: ${additional_settings[setting]}`;
                            settingsList.appendChild(li);
                        }

                        section.appendChild(settingsList);

                    }

                }


                preview.appendChild(section);

            }

            preview.appendChild(resetConfBtn);
        }

        
        resetConfBtn.addEventListener('click', () => {
            this.apiConfig.setApiConfig(null);
            config = this.apiConfig.getApiConfig();
            preview.innerHTML = '';
            build();
            new NotificationModal().show('Configuration reset', NOTIFICATION_INFO, 3000, true);
        });

        build();

    }

    open() {
        super.open();
        return this;
    }

    add_api_server(name, host, selected = false) {
        const apiServer = document.createElement('li');
        apiServer.classList.add('api-server');
        apiServer.innerHTML = name;

        if(selected) apiServer.classList.add('selected');

        apiServer.addEventListener('click', () => {
            this.apiServers.querySelectorAll('.api-server').forEach(server => server.classList.remove('selected'));
            apiServer.classList.add('selected');
        });

        this.apiServers.querySelector('.api-servers-list').appendChild(apiServer);

        return this;
    }

    get_selected_server() {
        return this.apiServers.querySelector('.selected').innerHTML;
    }

}