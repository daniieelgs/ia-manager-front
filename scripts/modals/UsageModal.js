class UsageModal extends Modal{
    constructor(usage) {
        super(document.createElement('div'), true);

        this.usage = usage;

        this.modal.classList.add('modal-settings');

        const closeBtn = document.createElement('i');
        closeBtn.classList.add('close-modal');
        this.modal.appendChild(closeBtn);

        this.content = document.createElement('div');
        this.content.classList.add('usage-content');
        this.modal.appendChild(this.content);

        document.body.appendChild(this.modal);

        this.isOpened = false;

        closeBtn.addEventListener('click', this.close.bind(this));

        this.on_open(this.#buildUsageContent.bind(this));

    }

    #buildUsageContent(){

        let timesData = {}
        let tokensData = {}
        let contextData = {}

        for (let key in this.usage) {
            if(!this.usage[key]) continue;
            if(this.usage[key].hasOwnProperty('time')){
                timesData[key] = this.usage[key].time;
            }

            if(this.usage[key].hasOwnProperty('input_tokens')){
                if(!tokensData.hasOwnProperty(key)) tokensData[key] = {};
                tokensData[key]['input_tokens'] = this.usage[key].input_tokens;
            }

            if(this.usage[key].hasOwnProperty('output_tokens')){
                if(!tokensData.hasOwnProperty(key)) tokensData[key] = {};
                tokensData[key]['output_tokens'] = this.usage[key].output_tokens;
            }

            if(this.usage[key].hasOwnProperty('context')){
                contextData[key] = this.usage[key].context;
            }
        }

        if(this.usage.hasOwnProperty('scorer') && !!this.usage.scorer){
            for(let i = 0; i < this.usage.scorer.length; i++){
                if(this.usage.scorer[i].hasOwnProperty('time')){
                    timesData[`scorer_chunk${i+1}`] = this.usage.scorer[i].time;
                }

                if(this.usage.scorer[i].hasOwnProperty('input_tokens')){
                    if(!tokensData.hasOwnProperty(`scorer_chunk${i+1}`)) tokensData[`scorer_chunk${i+1}`] = {};
                    tokensData[`scorer_chunk${i+1}`]['input_tokens'] = this.usage.scorer[i].input_tokens;
                }

                if(this.usage.scorer[i].hasOwnProperty('output_tokens')){
                    if(!tokensData.hasOwnProperty(`scorer_chunk${i+1}`)) tokensData[`scorer_chunk${i+1}`] = {};
                    tokensData[`scorer_chunk${i+1}`]['output_tokens'] = this.usage.scorer[i].output_tokens;
                }

                if(this.usage.scorer[i].hasOwnProperty('context')){
                    contextData[`scorer_chunk${i+1}`] = this.usage.scorer[i].context;
                }
            }
        }

        this.#buildTimesContent(timesData);
        this.#buildTokensContent(tokensData);
        this.#buildContextContent(contextData);

    }

    #buildChart(canvas, chartData, label, type = 'bar', backgroundColor = 'rgba(54, 162, 235, 0.2)', borderColor = 'rgba(54, 162, 235, 1)', bgChart = '#E6E6E6'){

        const plugin = {
            id: 'customCanvasBackgroundColor',
            beforeDraw: (chart, args, options) => {
              const {ctx} = chart;
              ctx.save();
              ctx.globalCompositeOperation = 'destination-over';
              ctx.fillStyle = options.color || '#99ffff';
              ctx.fillRect(0, 0, chart.width, chart.height);
              ctx.restore();
            }
          };

        if(typeof label === 'string'){

            return new Chart(canvas, {
                type: type,
                data: {
                    labels: Object.keys(chartData),
                    datasets: [{
                        label: label,
                        data: Object.values(chartData),
                        backgroundColor: backgroundColor,
                        borderColor: borderColor,
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    responsive: true,
                    plugins: {
                        customCanvasBackgroundColor: {
                            color: bgChart
                        }
                    }
                },
                plugins: [plugin]
            });

        }else if(Array.isArray(label)){
        
            const labels = Object.keys(chartData);
            const keys = Object.keys(chartData[labels[0]]);

            const datasets = keys.map((key, i) => {
                return {
                    label: label[i],
                    data: labels.map(label => chartData[label][key]),
                    backgroundColor: backgroundColor[i],
                    borderColor: borderColor[i],
                    borderWidth: 1
                }
            });

            const chart = {
                type: type,
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        },
                        x: {
                            stacked: false
                        }
                    },
                    plugins: {
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        },
                        customCanvasBackgroundColor: {
                            color: bgChart
                        }
                    },
                    responsive: true
                },
                plugins: [plugin]
            }

            return new Chart(canvas, chart);
        }

    }

    #buildChartSection(canvasId, chartData, title, ...args){
        const section = document.createElement('section');
        section.classList.add('chart-section');
        const titleElement = document.createElement('h2');
        titleElement.innerHTML = title;
        section.appendChild(titleElement);

        const downloadBtn = document.createElement('i');
        downloadBtn.classList.add('download-btn');
        downloadBtn.title = 'Download chart';
        section.appendChild(downloadBtn);

        const canvas = document.createElement('canvas');
        canvas.id = canvasId;
        section.appendChild(canvas);

        this.content.appendChild(section);

        const chart = this.#buildChart(canvas, chartData, ...args);
        
        downloadBtn.addEventListener('click', () => {
            const imageURL = chart.toBase64Image();
            const link = document.createElement('a');
            link.href = imageURL;
            link.download = `${canvasId}.png`;
            link.click();
        });

        return section;
    }

    #buildTimesContent(timesData){
        const container = this.#buildChartSection("times-chart", timesData, 'Tiempos', 'Tiempo de ejecución (s)');

        this.content.appendChild(container);

    }

    #buildTokensContent(tokensData){
        const container = this.#buildChartSection("tokens-chart", tokensData, 'Tokens', ['Input Tokens', 'Output Tokens'], 'bar', ['rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)'] , ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)']);
        this.content.appendChild(container);
    }

    #buildContextContent(contextData){
        const container = document.createElement('div');
        container.classList.add('all-context-content');

        let contextShow = null;

        for(let key in contextData){
            
            const section = document.createElement('section');
            section.classList.add('context-section');

            const titleContainer = document.createElement('div');
            titleContainer.classList.add('context-title');
            const titleElement = document.createElement('h2');
            titleElement.innerHTML = key + ' Context';
            titleContainer.appendChild(titleElement);

            const loadImages = document.createElement('input');
            loadImages.type = 'checkbox';
            loadImages.id = key + '-load-images';
            loadImages.checked = true;
            const labelImages = document.createElement('label');
            labelImages.htmlFor = key + '-load-images';
            labelImages.innerHTML = 'Load Images';
            titleContainer.appendChild(loadImages);
            titleContainer.appendChild(labelImages);

            const copyButton = document.createElement('i');
            copyButton.classList.add('copy-btn');
            copyButton.title = 'Copy context';
            titleContainer.appendChild(copyButton);

            section.appendChild(titleContainer);

            const contextContainer = document.createElement('div');
            contextContainer.classList.add('context-container');

            const _loadImagesCallbacks = [];

            for(let item in contextData[key]){
                const contextItem = document.createElement('p');
                contextItem.classList.add('context-item');
                let textItem = contextData[key][item];
                textItem = JSON.stringify(textItem, null, 2);
                textItem = textItem.replace(/\\n|\n/g, '<br>');
                textItem = textItem.replace(/\s{2,}/g, ' ').trim();
                contextItem.innerHTML = textItem;
                contextContainer.appendChild(contextItem);
                _loadImagesCallbacks.push(() => {
                    if(loadImages.checked){
                        const formattedText = textItem.replace(/\[img:([^\]]+)\]/g, '<img src="$1" alt="[img:url]" />');
                        contextItem.innerHTML = formattedText;
                    }else{
                        contextItem.innerHTML = textItem;
                    }
                });
            }
            section.appendChild(contextContainer);
            container.appendChild(section);

            const loadImagesFunc = () => {
                _loadImagesCallbacks.forEach(callback => callback());
            };

            loadImages.addEventListener('change', loadImagesFunc);

            if(loadImages.checked) loadImagesFunc();

            copyButton.addEventListener('click', () => {
                const text = JSON.stringify(contextData[key], null, 2);
                navigator.clipboard.writeText(text).then(() => {
                    globalNotification.show('Context copied to clipboard', 'success');
                }).catch(() => {
                    globalNotification.show('Error copying context to clipboard', 'error');
                });
            });

            titleElement.addEventListener('click', () => {

                contextContainer.classList.toggle('show');
    
                if(contextContainer.classList.contains('show')){
                    if(contextShow !== null && contextShow !== contextContainer)
                        contextShow.classList.remove('show');
                    
                    contextShow = contextContainer;
                }
            });
        }

        this.content.appendChild(container);

    }
}