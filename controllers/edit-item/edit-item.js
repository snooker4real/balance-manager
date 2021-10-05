const { ipcRenderer } = require("electron");

const editItemForm = document.querySelector("#edit-item-form");
const editItemSubmitBtn = editItemForm.querySelector("#edit-item-submit");

const editItemLabelInput = editItemForm.querySelector("#item-label");
const editItemValueInput = editItemForm.querySelector("#item-value");

////////////////////////// Check inputs part ///////////////////////////
function onInputCheckValue(){
    editItemSubmitBtn.hidden = !(editItemLabelInput.value !== '' && !isNaN(editItemValueInput.value) && editItemValueInput.value > 0);
}

editItemLabelInput.addEventListener('input', onInputCheckValue)
editItemValueInput.addEventListener('input', onInputCheckValue)

////////////////////////// Init Data part ///////////////////////////
ipcRenderer.on('init-data',(e, data) => {
    editItemLabelInput.value = data.item.label;
    editItemValueInput.value = data.item.value;
});

////////////////////////// Submit Form part ///////////////////////////
function onSubmitEditItemForm(e){
    // Stop the normal behavior
    e.preventDefault();

    const editItem = {
        label: editItemLabelInput.value,
        value: editItemValueInput.value
    };

    ipcRenderer
        .invoke('edit-item', editItem)
        .then(resp => {
            const msgDiv = document.querySelector("#response-message");
            msgDiv.innerText = resp;
            msgDiv.hidden = false;

            // Re-hide the div after 1.5sec to make it tmp
            setTimeout(() => {
                msgDiv.innerText = '';
                msgDiv.hidden = true;
            }, 1500);
        });
}
editItemForm.addEventListener("submit", onSubmitEditItemForm);