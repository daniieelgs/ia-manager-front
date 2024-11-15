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

            if(this.confInputs.bot_config){
                const apiConf = this.apiConfig.getApiConfig();
                let data = {

                    vector_database_settings: apiConf.vector_database[this.confInputs.bot_config.vector_database],
                    document_database_settings: apiConf.doc_database[this.confInputs.bot_config.doc_database],
                    main_mode: `${apiConf.bot_settings[this.confInputs.bot_config.bot_settings].main_mode}`,
                    mode: apiConf.bot_settings[this.confInputs.bot_config.bot_settings].mode,
                    embedding_settings: apiConf.embedding[this.confInputs.bot_config.embedding],
                    rerank_settings: apiConf.rerank[this.confInputs.bot_config.rerank],
                    llm_settings: apiConf.llm[this.confInputs.bot_config.llm],
                    scorer_settings: apiConf.scorer[this.confInputs.bot_config.scorer],
                    settings: {
                        add_thumbnail: apiConf.bot_settings[this.confInputs.bot_config.bot_settings].add_thumbnail,
                        mult_top_k: apiConf.bot_settings[this.confInputs.bot_config.bot_settings].mult_top_k,
                        scorer: apiConf.bot_settings[this.confInputs.bot_config.bot_settings].scorer,
                        top_history: apiConf.bot_settings[this.confInputs.bot_config.bot_settings].top_history
                    }

                };

                return data;
            }

            let data = {
                vendor: this.confInputs.vendorSelect?.value,
                settings: {}
            };

            for(let setting of this.confInputs.settings ?? []){
                if(!setting.input.value) continue;

                if(setting.type === 'Boolean') data.settings[setting.field] = setting.input.checked;
                else if(setting.type === 'Integer') data.settings[setting.field] = parseInt(setting.input.value);
                else if(setting.type === 'Float') data.settings[setting.field] = parseFloat(setting.input.value);
                else if(setting.type === 'Dict') {
                    try{
                        data.settings[setting.field] = JSON.parse(setting.input.value.replace(/'/g, '"'));
                    }catch(e){
                        globalNotification.show('Invalid JSON', NOTIFICATION_ERROR);
                    }
                }
                else data.settings[setting.field] = setting.input.value;

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
                            console.log(response.data);
                            let data = response.data.message.replace(/'/g, '"');
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
                globalNotification.show('Error testing configuration: ' + e.message, NOTIFICATION_ERROR);
            }
            

        });

        this.saveBtn.addEventListener('click', () => {

            try{

                if(this.confInputs.bot_config){

                    let botConfig = this.apiConfig.getBotConfig();

                    const selected = botConfig[this.confInputs.bot].selected;

                    botConfig[this.confInputs.bot] = this.confInputs.bot_config;
                    botConfig[this.confInputs.bot].selected = selected;

                    this.apiConfig.setBotConfig(botConfig);

                }else{
                    let data = this.desSerializeInputConf.bind(this)();
                    let apiConfig = this.apiConfig.getApiConfig();
        
                    apiConfig[this.confInputs.conf][this.confInputs.profile] = data;
        
                    this.apiConfig.setApiConfig(apiConfig);
                }

                globalNotification.show('Configuration saved', NOTIFICATION_SUCCESS);
            }catch(e){
                console.error(e);
                globalNotification.show('Error saving configuration', NOTIFICATION_ERROR);
            }

        });

        document.body.appendChild(this.modal);

        this.isOpened = false;

        closeBtn.addEventListener('click', this.close.bind(this));
        
        this.on_open(() => this.currentSection && this.currentType ? this.#open_section(this.currentSection, this.currentType) : null);

    }

    #open_section(section, type) {
        document.querySelectorAll('.settings-menu-item').forEach(item => item.classList.remove('selected'));
        section.classList.add('selected');
        this.currentSection = section;
        this.currentType = type;
        startLoader(this.content, "25%");
        this.botController.getVendorInfo(type.vendor)
            .then(vendorInfo => {
                this.content.innerHTML = '';
                this.#build_section.bind(this)(type, vendorInfo);
            })
            .catch(e => {
                console.log(e);
                this.content.innerHTML = '';
                const error = document.createElement('div');
                error.classList.add('error');
                const h1 = document.createElement('h1');
                h1.innerHTML = 'Error loading configuration';
                error.appendChild(h1);
                this.content.appendChild(error);
            })
            .finally(() => {
                stopLoader(this.content);
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

        let apiConfig = this.apiConfig.getApiConfig();

        const profileContainer = document.createElement('div');
        profileContainer.classList.add('profile-container');

        const profileSelectorContainer = document.createElement('div');
        profileSelectorContainer.classList.add('profile-select-container');

        let profileSelector = document.createElement('select');
        profileSelector.classList.add('profile-select');

        let botConfig = this.apiConfig.getBotConfigSelected()[type.conf];

        let options = Object.keys(apiConfig[type.conf]).map(key => {
            let option = document.createElement('option');
            option.value = key;
            option.innerHTML = key;
            option.selected = key === botConfig;
            return option;
        });

        profileSelector.append(...options);

        let label = document.createElement('label');
        label.innerHTML = 'Profile:';
        profileContainer.appendChild(label);

        const inputNewProfile = document.createElement('input');
        inputNewProfile.classList.add('new-profile');
        inputNewProfile.placeholder = 'New profile';
        inputNewProfile.style.display = 'none';
        profileSelectorContainer.appendChild(inputNewProfile);

        profileSelectorContainer.appendChild(profileSelector);
        const newBtn = document.createElement('i');
        newBtn.classList.add('add-btn');
        profileSelectorContainer.appendChild(newBtn);
        const deleteBtn = document.createElement('i');
        deleteBtn.classList.add('remove-btn');
        profileSelectorContainer.appendChild(deleteBtn);

        const confirmBtn = document.createElement('i');
        confirmBtn.classList.add('confirm-btn');
        profileSelectorContainer.appendChild(confirmBtn);
        const cancelBtn = document.createElement('i');
        cancelBtn.classList.add('cancel-btn');
        profileSelectorContainer.appendChild(cancelBtn);

        confirmBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        

        profileContainer.appendChild(profileSelectorContainer);
        

        vendorConfig.appendChild(profileContainer);
        
        const settingsForm = document.createElement('div');
        settingsForm.classList.add('form-settings');

        const build = () => {

            settingsForm.innerHTML = '';
            settingsForm.remove();
            if(vendorConfig.querySelector('.vendor-select')) vendorConfig.querySelector('.vendor-select').remove();
            if(vendorConfig.querySelector('label.vendor-label')) vendorConfig.querySelector('label.vendor-label').remove();

            apiConfig = this.apiConfig.getApiConfig();

            deleteBtn.style.display = profileSelector.value === 'default' ? 'none' : 'block';

            let typeConfig = apiConfig[type.conf][profileSelector.value];

            const additionalSettings = document.createElement('div');
            additionalSettings.classList.add('form-settings', 'additional-settings');

            this.confInputs = {"test": type.test, "conf": type.conf, "profile": profileSelector.value};

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
                label.classList.add('vendor-label');
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
                        else if(settings.type == "Dict") {
                            input.type = "text";
                            input.addEventListener('blur', () => {

                                try{    
                                    let data = JSON.parse(input.value.replace(/'/g, '"'));
                                    input.value = JSON.stringify(data, null, 2);
                                }
                                catch(e){
                                    globalNotification.show('Invalid JSON', NOTIFICATION_ERROR);
                                }
                            });
                        }
                        else input.type = "text";
                        
                        let container = document.createElement('div');
                        container.classList.add('form-group');


                        let label = document.createElement('label');
                        label.innerHTML = settings.field;
                        label.htmlFor = settings.field;

                        input.id = settings.field;

                        if(settings.type == "Boolean") {
                            input.checked = (typeConfig.vendor == vendor.value ? typeConfig.settings[settings.field] : false) || (settings.default == "None" ? false : settings.default == "True");
                            console.log(input.checked)
                            container.style.flexDirection = "row";
                            label.style.gap = "2px";
                        }else {
                            input.value = (typeConfig.vendor == vendor.value ? typeConfig.settings[settings.field] : null) || (settings.default == "None" ? "" : settings.default);
                            input.placeholder = settings.description;
                        }


                        container.appendChild(label);
                        container.appendChild(input);
                        

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
        }

        build();

        this.content.appendChild(vendorConfig);

        this.testBtn.style.display = !!type.test ? 'block' : 'none';
        this.saveBtn.style.display = 'block';

        profileSelector.addEventListener('change', () => {
            build();
        });

        newBtn.addEventListener('click', () => {

            this.saveBtn.disabled = true;

            profileSelector.style.display = 'none';
            inputNewProfile.style.display = 'block';

            newBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            confirmBtn.style.display = 'block';
            cancelBtn.style.display = 'block';
        });

        confirmBtn.addEventListener('click', () => {


            if(inputNewProfile.value.trim() === '') {
                globalNotification.show('Profile name is required', NOTIFICATION_ERROR);
                return;
            }

            if(Object.keys(apiConfig[type.conf]).includes(inputNewProfile.value.trim())) {
                globalNotification.show('Profile already exists', NOTIFICATION_ERROR);
                return;
            }

            try{

                let newProfile = inputNewProfile.value.trim();

                let apiConfig = this.apiConfig.getApiConfig();
                apiConfig[type.conf][newProfile] = apiConfig[type.conf][profileSelector.value];

                this.apiConfig.setApiConfig(apiConfig);

                let options = Object.keys(apiConfig[type.conf]).map(key => {
                    let option = document.createElement('option');
                    option.value = key;
                    option.innerHTML = key;
                    option.selected = key === newProfile;
                    return option;
                });

                profileSelector.innerHTML = '';
                profileSelector.append(...options);

            }catch(e){
                globalNotification.show('Error creating new profile', NOTIFICATION_ERROR);
                console.error(e);
            }

            this.saveBtn.disabled = false;

            inputNewProfile.style.display = 'none';
            profileSelector.style.display = 'block';

            confirmBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            newBtn.style.display = 'block';
            deleteBtn.style.display = 'block';

            build();
        });

        cancelBtn.addEventListener('click', () => {

            this.saveBtn.disabled = false;

            inputNewProfile.style.display = 'none';
            profileSelector.style.display = 'block';

            confirmBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            newBtn.style.display = 'block';
            deleteBtn.style.display = 'block';

            build();
        });

        deleteBtn.addEventListener('click', () => {
        
            if(profileSelector.value == 'default') return;

            let apiConfig = this.apiConfig.getApiConfig();

            delete apiConfig[type.conf][profileSelector.value];

            this.apiConfig.setApiConfig(apiConfig);

            let botConfig = this.apiConfig.getBotConfigSelected()[type.conf];

            let options = Object.keys(apiConfig[type.conf]).map(key => {
                let option = document.createElement('option');
                option.value = key;
                option.innerHTML = key;
                option.selected = key === botConfig;
                return option;
            });

            profileSelector.innerHTML = '';
            profileSelector.append(...options);

            build();

        });

    }

    #build_preview_section(previewType) {
        const preview = document.createElement('div');
        preview.classList.add('preview');
        this.content.appendChild(preview);

        this.saveBtn.style.display = 'block';
        this.testBtn.style.display = 'block';

        let botConfig = this.apiConfig.getBotConfig();

        const profileContainer = document.createElement('div');
        profileContainer.classList.add('profile-container');

        const profileSelectorContainer = document.createElement('div');
        profileSelectorContainer.classList.add('profile-select-container');

        let profileSelector = document.createElement('select');
        profileSelector.classList.add('profile-select');
        let options = Object.keys(botConfig).map(key => {
            let option = document.createElement('option');
            option.value = key;
            option.innerHTML = key;
            option.selected = botConfig[key].selected;
            return option;
        });

        profileSelector.append(...options);

        let labelProfile = document.createElement('label');
        labelProfile.innerHTML = 'Bot:';
        profileContainer.appendChild(labelProfile);

        const inputNewProfile = document.createElement('input');
        inputNewProfile.classList.add('new-profile');
        inputNewProfile.placeholder = 'New bot';
        inputNewProfile.style.display = 'none';
        profileSelectorContainer.appendChild(inputNewProfile);

        profileSelectorContainer.appendChild(profileSelector);
        const newBtn = document.createElement('i');
        newBtn.classList.add('add-btn');
        profileSelectorContainer.appendChild(newBtn);
        const deleteBtn = document.createElement('i');
        deleteBtn.classList.add('remove-btn');
        profileSelectorContainer.appendChild(deleteBtn);

        const confirmBtn = document.createElement('i');
        confirmBtn.classList.add('confirm-btn');
        profileSelectorContainer.appendChild(confirmBtn);
        const cancelBtn = document.createElement('i');
        cancelBtn.classList.add('cancel-btn');
        profileSelectorContainer.appendChild(cancelBtn);

        confirmBtn.style.display = 'none';
        cancelBtn.style.display = 'none';

        profileContainer.appendChild(profileSelectorContainer);


        preview.appendChild(profileContainer);

        const resetConfBtn = document.createElement('button');
        resetConfBtn.innerHTML = 'Reset configuration';
        resetConfBtn.classList.add('btn-reset');

        const build = () => {

            deleteBtn.style.display = profileSelector.value === 'default' ? 'none' : 'block';

            preview.innerHTML = '';
            preview.appendChild(profileContainer);

            // let config = this.apiConfig.getApiBotConfig(profileSelector.value);

            let apiConf = this.apiConfig.getApiConfig();
            botConfig = this.apiConfig.getBotConfig();

            this.confInputs = {
                // "data": {

                //     "vector_database_settings": config.vector_database,
                //     "document_database_settings": config.doc_database,
                //     "main_mode": `${config.bot_settings.main_mode}`,
                //     "mode": config.bot_settings.mode,
                //     "embedding_settings": config.embedding,
                //     "rerank_settings": config.rerank,
                //     "llm_settings": config.llm,
                //     "scorer_settings": config.scorer,
                //     "settings": {
                //         "add_thumbnail": config.bot_settings.add_thumbnail,
                //         "mult_top_k": config.bot_settings.mult_top_k,
                //         "scorer": config.bot_settings.scorer,
                //         "top_history": config.bot_settings.top_history
                //     }

                // },
                "bot_config": {},
                "bot": profileSelector.value,
                "test": previewType.test
            };

            for(let type of TYPES){
            
                if(type == previewType) continue;

                const section = document.createElement('div');
                section.classList.add('preview-section');
                const h2 = document.createElement('h2');
                h2.innerHTML = type.name;
            
                let profiles = Object.keys(apiConf[type.conf]);

                let profileSelectorType = document.createElement('select');
                profileSelectorType.classList.add('profile-select');
                let options = profiles.map(key => {
                    let option = document.createElement('option');
                    option.value = key;
                    option.innerHTML = key;
                    option.selected = key === botConfig[profileSelector.value][type.conf];
                    return option;
                });

                profileSelectorType.append(...options);

                
                const buildSection = () => {
                    
                    section.innerHTML = '';
                    section.appendChild(h2);
                    section.appendChild(profileSelectorType);

                    let data = {...apiConf[type.conf][profileSelectorType.value]};

                    this.confInputs.bot_config[type.conf] = profileSelectorType.value;
                    let _confInputs = this.confInputs.bot_config;

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

                }

                buildSection();

                profileSelectorType.addEventListener('change', buildSection);


                preview.appendChild(section);

            }

            preview.appendChild(resetConfBtn);
        }

        profileSelector.addEventListener('change', () => {
            const botConfig = this.apiConfig.getBotConfig();
            Object.keys(botConfig).forEach(key => botConfig[key].selected = false);
            botConfig[profileSelector.value].selected = true;
            this.apiConfig.setBotConfig(botConfig);
            build();
        });
        
        resetConfBtn.addEventListener('click', () => {
            this.apiConfig.resetBotConfig(profileSelector.value);
            build();
            globalNotification.show('Configuration reset', NOTIFICATION_INFO);
        });



        newBtn.addEventListener('click', () => {

            this.saveBtn.disabled = true;

            profileSelector.style.display = 'none';
            inputNewProfile.style.display = 'block';

            newBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            confirmBtn.style.display = 'block';
            cancelBtn.style.display = 'block';
        });

        confirmBtn.addEventListener('click', () => {


            if(inputNewProfile.value.trim() === '') {
                globalNotification.show('Bot name is required', NOTIFICATION_ERROR);
                return;
            }

            if(Object.keys(botConfig).includes(inputNewProfile.value.trim())) {
                globalNotification.show('Bot already exists', NOTIFICATION_ERROR);
                return;
            }

            try{

                let newProfile = inputNewProfile.value.trim();

                let botConfig = this.apiConfig.getBotConfig();
                botConfig[newProfile] = {...botConfig[profileSelector.value]};

                Object.keys(botConfig).forEach(key => botConfig[key].selected = false);

                botConfig[newProfile].selected = true;

                this.apiConfig.setBotConfig(botConfig);

                let options = Object.keys(botConfig).map(key => {
                    let option = document.createElement('option');
                    option.value = key;
                    option.innerHTML = key;
                    option.selected = key === newProfile;
                    return option;
                });

                profileSelector.innerHTML = '';
                profileSelector.append(...options);

            }catch(e){
                globalNotification.show('Error creating new bot', NOTIFICATION_ERROR);
                console.error(e);
            }

            this.saveBtn.disabled = false;

            inputNewProfile.style.display = 'none';
            profileSelector.style.display = 'block';

            confirmBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            newBtn.style.display = 'block';
            deleteBtn.style.display = 'block';

            build();
        });

        cancelBtn.addEventListener('click', () => {

            this.saveBtn.disabled = false;

            inputNewProfile.style.display = 'none';
            profileSelector.style.display = 'block';

            confirmBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            newBtn.style.display = 'block';
            deleteBtn.style.display = 'block';

            build();
        });

        deleteBtn.addEventListener('click', () => {
        
            if(profileSelector.value == 'default') return;

            let botConfig = this.apiConfig.getBotConfig();

            delete botConfig[profileSelector.value];

            let options = Object.keys(botConfig).map(key => {
                let option = document.createElement('option');
                option.value = key;
                option.innerHTML = key;
                return option;
            });

            botConfig[options[0].value].selected = true;

            this.apiConfig.setBotConfig(botConfig);

            profileSelector.innerHTML = '';
            profileSelector.append(...options);

            build();

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