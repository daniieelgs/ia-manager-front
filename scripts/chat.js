

const chatContainer = document.getElementById('chat-container');
let chatViewer = null;

const inputMessage = document.getElementById('chat-input');
const btnSend = document.getElementById('send-btn');
const btnRegen = document.getElementById('regenerate-btn');
const titleLabel = document.getElementById('title-chat');

let idInterval = null, idIntervalTitle = null;

let chatHistory = [];


const sendMessages = async (messages = null) => {

    const message = messages ?? inputMessage.value.trim();

    if(message === ''){
        return;
    }

    setMessageUser(message);

    let [idIntervalEllipsis, messageElement] = loadingEffect();

    try{
        clearResults();
        inputMessage.value = '';
        let totalResponse = '';
        firstChunk = true;
        let cut = 0;
        let initTimer = new Date().getTime();
        for await (const json of stream(await botController.queryBotStream(message, chatHistory.slice(0, -2), filter_files == 'own' ? filter_files_own : null))) {
            for(data of json){

                if(data.response){

                    if(firstChunk){
                        clearInterval(idIntervalEllipsis);
                        messageElement.textContent = '';
                        firstChunk = false;
                        console.log('Time:', new Date().getTime() - initTimer);
                    }

                    totalResponse += data.response;

                    cut = writeEfectMessageBot(totalResponse, 10, messageElement, cut);

                    chatViewer.scrollTop = chatViewer.scrollHeight;

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

function clearChat(){
    chatViewer.innerHTML = '';
    titleLabel.innerHTML = '';
    chatHistory = [];
    clearResults();
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