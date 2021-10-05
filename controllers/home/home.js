const {ipcRenderer} = require("electron");

let cbEditedItem;

function generateRowLine(tbodyId, data) {
    const tboby = document.querySelector("#" + tbodyId);
    data.forEach((item) => {
        const tr = document.createElement("tr");

        const thId = document.createElement("th");
        thId.scope = "row";

        thId.innerHTML = item.id;
        const tdLabel = document.createElement("td");

        tdLabel.innerHTML = item.label;
        const tdValue = document.createElement("td");

        tdValue.innerHTML = item.value;

        const tdButtons = document.createElement("td");
        const editBtn = document.createElement("button");
        editBtn.innerText = "Modifier";
        editBtn.classList.add("btn", "btn-outline-warning", "mx-2");
        editBtn.addEventListener('click', () => {

            ipcRenderer.send('open-edit-item-window', {
                id: item.id,
                type: tbodyId.split('-')[0]
            });

            // Delete the last cb know on the "edited-item" listener
            if (cbEditedItem) {
                ipcRenderer.removeListener('edited-item', cbEditedItem);
                cbEditedItem = null;
            }

            ipcRenderer.on('edited-item',(e,data)=>{
                tdLabel.innerText = data.item.label;
                tdValue.innerText = data.item.value;

                updateBalanceSheet(data.expenses, data.profits);
            });

        });


        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Supprimer";
        deleteBtn.classList.add("btn", "btn-outline-danger", "mx-2");
        deleteBtn.addEventListener('click', () => {
            ipcRenderer.invoke('show-confirm-delete-item',{
                id: item.id,
                type: tbodyId.split('-')[0]
            })
                .then(resp => {
                    if (resp.choice){
                        tr.remove();
                        updateBalanceSheet(resp.expenses, resp.profits);
                    }
                })
        });

        tdButtons.append(editBtn, deleteBtn);
        tr.append(thId, tdLabel, tdValue, tdButtons);
        tboby.append(tr);
    });
}

function updateBalanceSheet(expenses, profits) {
    let sumExpenses = 0;
    expenses.forEach((expense) => {
        sumExpenses += parseFloat(expense.value) || 0; //NaN
    });

    //   const sumExpenses = expenses.reduce((acc, expense) => {
    //     return sum + parseFloat(expense.value) || 0;
    //   }, 0);

    let sumProfits = 0;
    profits.forEach((profit) => {
        sumProfits += parseFloat(profit.value) || 0; //NaN
    });

    const balance = sumProfits - sumExpenses;

    const balanceDiv = document.querySelector("#balance-sheet");
    balanceDiv.innerText = `${balance} €`;
    balanceDiv.classList.remove("bg-success", "bg-danger", "bg-warning");

    if (balance > 0) {
        balanceDiv.classList.add("bg-success");
    } else if (balance < 0) {
        balanceDiv.classList.add("bg-danger");
    } else if (balance === 0) {
        balanceDiv.classList.add("bg-warning");
    }
}

////////////////////// Init data ///////////////////////////////////
ipcRenderer.on("init-data", (e, data) => {
    //console.log(data);
    generateRowLine("profits-table", data.profits);
    generateRowLine("expenses-table", data.expenses);
    updateBalanceSheet(data.expenses, data.profits);
});

////////////////////// Event Listener ///////////////////////////////////
//add-expense, add-profit
function onClickAddNewItem(e) {
    // "add-expense => ["add", "expense"]
    //console.log(e.target.id.split('-')[1]);
    ipcRenderer.send('open-new-item-window', {
        type: e.target.id.split('-')[1]
    });
}

document.querySelector("#add-expense").addEventListener('click', onClickAddNewItem)
document.querySelector("#add-profit").addEventListener('click', onClickAddNewItem)

////////////////////// Received //////////////////////////////
ipcRenderer.on('new-item-added', (e, data) => {
    generateRowLine(`${data.type}s-table`, data.item);
    updateBalanceSheet(data.expenses, data.profits);
})