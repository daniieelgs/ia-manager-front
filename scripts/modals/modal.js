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

    show(msg, type, timeout = this.defaultTimeout, remove = this.defaultRemove) {
        this.setMsg(msg);
        this.modal.classList.remove('exit');
        if(!this.modal.classList.contains('enter')) this.modal.classList.add('enter');

        this.setMsgType(type);

        if (this.timoutId) clearTimeout(this.timoutId);

        this.timoutId = setTimeout(() => {
            this.hide();
            if (remove) setTimeout(() => this.remove(), 500);
        }, timeout);

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

const globalNotification = new NotificationModal(true, 3000, false);

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


class ErrorModal extends ModalQuestion{

    constructor(msg = "") {
        super(msg, true);
        this.modal.classList.add('error-modal');
        this.add_button('Close', 'close', '#676767');
    }

}