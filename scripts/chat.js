

const chatContainer = document.getElementById('chat-container');
let chatViewer = null;

const inputMessage = document.getElementById('chat-input');
const btnSend = document.getElementById('send-btn');
const btnRegen = document.getElementById('regenerate-btn');
const titleLabel = document.getElementById('title-chat');

const btnUsage = document.createElement('span');
btnUsage.classList.add('usage-btn');
btnUsage.textContent = 'Usage';

let chatUsage = null;

let idInterval = null, idIntervalTitle = null;

let chatHistory = [];


const sendMessages = async (messages = null) => {

    const message = messages ?? inputMessage.value.trim();

    if(message === ''){
        return;
    }

    setMessageUser(message);

    chatViewer.scrollTo({
        top: chatViewer.scrollHeight,
        behavior: "smooth"
    });

    let [idIntervalEllipsis, messageElement] = loadingEffect();

    try{
        clearResults();
        inputMessage.value = '';
        let totalResponse = '';
        firstChunk = true;
        let cut = 0;
        let initTimer = new Date().getTime();
        let wTime = 10;
        for await (const json of stream(await botController.queryBotStream(message, chatHistory.slice(0, -2), filter_files == 'own' ? filter_files_own : null))) {
            for(data of json){

                if(data.response){

                    totalResponse += data.response;

                    wTime = (totalResponse.length / (new Date().getTime() - initTimer))/2;

                    if(firstChunk){
                        clearInterval(idIntervalEllipsis);
                        messageElement.textContent = '';
                        firstChunk = false;
                        console.log('Time:', new Date().getTime() - initTimer);
                        initTimer = new Date().getTime();
                        wTime = 10;
                    }
                    
                    cut = writeEfectMessageBot(totalResponse, wTime, messageElement, cut);

                }else if(data.chunk){
                    addResult(data.chunk);
                }else if(data.title){
                    console.log('Title:', data.title);
                    if(idIntervalTitle) clearInterval(idIntervalTitle);
                    titleLabel.textContent = '';
                    let i = 0;
                    idIntervalTitle = setInterval(() => {   
                        titleLabel.textContent += data.title[i];
                        i++;
                        if(i === data.title.length){
                            clearInterval(idIntervalTitle);
                        }
                    }, 10);  
                }else if(data.usage){

                    if(!chatUsage)
                        chatContainer.appendChild(btnUsage);

                    chatUsage = data.usage;

                }else if(data.error){
                    console.error(data.error);
                    clearInterval(idIntervalEllipsis);
                    messageElement.remove();
                    const [msgContent, msgElement] = setMessageBot('No se ha podido procesar tu respuesta. Verifica la configuración.');
                    msgElement.classList.add('error', 'error-info');
                    const modalError = new ErrorModal(data.error.message, true);
                    msgElement.addEventListener('click', () => {    
                        if (modalError.isOpen) return;
                        modalError.open();
                    });
                    break;
                }
            }
        }   
        
        chatHistory[chatHistory.length - 1].message = totalResponse;

    }catch(e){
        console.log(e.data);
        clearInterval(idIntervalEllipsis);
        messageElement.remove();
        console.error(e);
        const [msgContent, msgElement] = setMessageBot('Lo siento, ha ocurrido un error inesperado');
        msgElement.classList.add('error');
    }

};

inputMessage.addEventListener('keyup', e => {
    if(e.key === 'Enter'){
        sendMessages();
    }
});

btnSend.addEventListener('click', () => sendMessages());

function setUpChat(){

    chatViewer = chatContainer.querySelector('.chat-viewer');

    if(chatViewer){
        chatViewer.remove();
    }

    chatViewer = document.createElement('div');
    chatViewer.classList.add('chat-viewer');
    // chatContainer.appendChild(chatViewer);
    //append first child
    chatContainer.insertBefore(chatViewer, chatContainer.firstChild);

}

function setMessage(data){

    let message = document.createElement('div');
    message.id = crypto.randomUUID();
    message.classList.add('message');
    message.classList.add(data.type);

    let messageContent = document.createElement('p');
    messageContent.classList.add('message-content');
    messageContent.innerHTML = markdownToHTML(data.message);

    message.appendChild(messageContent);

    chatViewer.appendChild(message);

    chatHistory.push(data);

    return [messageContent, message];
}

function setMessageBot(msg){
    return setMessage({message: msg, type: 'ai'});
}

function setMessageUser(msg){
    return setMessage({message: msg, type: 'human'});
}

function clearUsage(){
    chatUsage = null;
    btnUsage.remove();
}

function clearChat(){
    chatViewer.innerHTML = '';
    titleLabel.innerHTML = '';
    chatHistory = [];
    clearResults();
    clearUsage();
}

function writeEfectMessageBot(mesage, time = 10, messageContent = null, cut = 0) {

    const promise = new Promise(async (resolve, reject) => {

        cut = await cut;
        
        let convertedHTML = markdownToHTML(mesage);

        let i = cut;

        let interval = setInterval(() => {
            if(i >= convertedHTML.length){
                clearInterval(interval);
                cut = convertedHTML.length;
                resolve(cut);
            }else{


                let str = convertedHTML.substring(0, i);

                if(str.endsWith('<') || str.endsWith('</')){
                    while(!str.endsWith('>')){
                        i++;
                        str = convertedHTML.substring(0, i);
                    }
                }

                messageContent.innerHTML = str;

                i++;

                chatViewer.scrollTo({
                    top: chatViewer.scrollHeight,
                    behavior: "smooth"
                });

                messageContent.querySelectorAll('pre code').forEach((el) => {
                    if(el.classList.contains('hljs')) return;
                    hljs.highlightElement(el);
                    el.parentElement.classList.add('code-block');

                    const container = document.createElement('div');
                    container.classList.add('top');

                    const copy = document.createElement('i');
                    copy.classList.add('copy-btn');
                    copy.title = 'Copiar';
                    container.appendChild(copy);

                    let lang = Array.from(el.classList).find(c => c.startsWith('language-'))?.replace('language-', '') ?? 'bash';
                    if(lang == 'undefined') lang = 'bash';
                    const langEl = document.createElement('span');
                    langEl.classList.add('lang');
                    langEl.textContent = lang;
                    container.appendChild(langEl);

                    el.parentElement.insertBefore(container, el);

                    copy.addEventListener('click', () => {
                        navigator.clipboard.writeText(el.textContent);
                        globalNotification.show('Copiado.', NOTIFICATION_INFO);
                    });
                  });

            }
        }, time);

    });

    return promise;
}


function appendMessageBot(message){

    let [messageContent, messageElement] = getLastMessageBot();

    writeEfectMessageBot(message, 10, messageContent, messageElement);

}


function loadingEffect(){
    const loadingStr = '...';

    let [messageContent, messageElement] = setMessageBot('');

    messageContent.textContent = '...';

    const widthPx = messageElement.offsetWidth;
    const heightPx = messageContent.offsetHeight
    messageContent.style.letterSpacing = '0.5em';
    messageContent.style.width = `${widthPx}px`;
    messageContent.style.height = `${heightPx}px`;
    messageContent.style.textWrap = 'nowrap';

    const totalWait = 5;
    let currentWait = 0;

    return [setInterval(() => {
        
        if(messageContent.textContent.length === loadingStr.length){

            currentWait++;

            if(currentWait === totalWait){
                messageContent.textContent = '';
                currentWait = 0;
            }

        }else{
            messageContent.textContent += loadingStr[messageContent.textContent.length];
        }

    }, 100), messageElement];
}

function getLastMessageBot(){
    const messages = chatViewer.querySelectorAll('.bot');
    const messageElement = messages[messages.length - 1];
    return [messageElement ? messageElement.querySelector('.message-content') : null, messageElement];
}

function getLastMessageUser(){
    const messages = chatViewer.querySelectorAll('.user');
    const messageElement = messages[messages.length - 1];
    return [messageElement ? messageElement.querySelector('.message-content') : null, messageElement];
}

function markdownToHTML(markdownText) {
    // Convierte el Markdown a HTML usando la librería 'marked'
    const htmlContent = marked.marked(markdownText);
    return htmlContent;
  }

btnRegen.addEventListener('click', () => {
    // const [messageContent, messageElement] = getLastMessageUser()
    // const msgUser = messageContent.textContent;
    clearChat();
    // sendMessages(msgUser);
});

btnUsage.addEventListener('click', () => {
    const modalUsage = new UsageModal(chatUsage);
    modalUsage.open();
});