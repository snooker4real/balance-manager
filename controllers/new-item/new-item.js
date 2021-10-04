const { ipcRenderer } = require("electron");

const newItemForm = document.querySelector("#new-item-form");
const newItemSubmitBtn = newItemForm.querySelector("#new-item-submit");

const newItemLabelInput = newItemForm.querySelector("#item-label");
const newItemValueInput = newItemForm.querySelector("#item-value");

////////////////////////// Check inputs part ///////////////////////////
function onInputCheckValue(){
    newItemSubmitBtn.hidden = !(newItemLabelInput.value !== '' && !isNaN(newItemValueInput.value) && newItemValueInput.value > 0);
}

newItemLabelInput.addEventListener('input', onInputCheckValue)
newItemValueInput.addEventListener('input',onInputCheckValue)

////////////////////////// Check inputs part ///////////////////////////
function onSubmitNewItemForm(e){
    // Stop the normal behavior
    e.preventDefault();

    const newItem = {
        label: newItemLabelInput.value,
        value: newItemValueInput.value
    };

    ipcRenderer
        .invoke('new-item', newItem)
        .then(resp => {
            const msgDiv = document.querySelector("#response-message");
            msgDiv.innerText = resp;
            msgDiv.hidden = false;

            // Re-hide the div after 1.5sec to make it tmp
            setTimeout(() => {
                msgDiv.innerText = '';
                msgDiv.hidden = true;
            }, 1500);

            // Reset the form and hide again the submit btn
            e.target.reset();
            newItemSubmitBtn.hidden = true;
        });
}
newItemForm.addEventListener("submit", onSubmitNewItemForm);