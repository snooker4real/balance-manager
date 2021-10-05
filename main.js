const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");

let homeWindow;
let newItemWindow;
let editItemWindow;

const expenses = [
  {
    id: 1,
    label: "Achat huile moteur",
    value: 450,
  },
  {
    id: 2,
    label: "Achat joint vidange",
    value: 250,
  },
  {
    id: 3,
    label: "Achat filtre à huile",
    value: 100,
  },
];
const profits = [
  {
    id: 1,
    label: "Vidange voiture",
    value: 150,
  },
];

function createWindow(viewName, dataToSend, width = 1400, height = 1200) {
  // Create the browser window
  const win = new BrowserWindow({
    width,
    height,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the home.html of the app with some content (data sended to the fress view .then)
  win
    .loadFile(path.join(__dirname, "views", viewName, viewName + ".html"))
    .then(() => {
      if (dataToSend) {
        win.send("init-data", dataToSend);
      }
    });

  // Only for debug Phase
  // Show all the time the dev tools
  //win.webContents.openDevTools();
  return win;
}

app.whenReady().then(() => {
  const data = { expenses, profits };
  homeWindow = createWindow("home", data);
});

// Stuff for Mac
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const data = { expenses, profits };
    homeWindow = createWindow("home", data);
  }
});

///////////////////////// New Item window listeners /////////////////////////////

const openNewItemWindowCb = (e, data) => {
  if (newItemWindow) {
    newItemWindow.focus();
    return;
  }

  newItemWindow = createWindow("new-item", null, 1000, 500);

  ipcMain.handle("new-item", (e, newItem) => {
    // 5 steps:

    // newItem.id = selectedArray.length + 1;
    // [{id: 1}, {id: 2}, {id: 3}]
    // [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
    // [{id: 1}, {id: 3}, {id: 4}]
    // [{id: 1}, {id: 3}, {id: 4}, {id: 4}]

    let id = 1;

    // - Select the correct array to update
    // ternaire syntaxe => condition ? exprSiVrai : exprSiFaux
    const selectedArray = data.type === "profit" ? profits : expenses;

    // - Create an id for the new item
    if (selectedArray.length > 0) {
      // Select the last element of the array
      // Then select the id and add it 1
      id = selectedArray[selectedArray.length - 1].id + 1;
    }
    newItem.id = id;

    // - Push the new item into the selected array
    selectedArray.push(newItem);

    // - Send the array to the home view
    homeWindow.send("new-item-added", {
      item: [newItem],
      type: data.type,
      expenses,
      profits,
    });

    // - Send a response
    return "Item ajouté avec succès ✔️";
  });

  newItemWindow.on("closed", () => {
    newItemWindow = null;
    ipcMain.removeHandler("new-item");
  });
};

ipcMain.on("open-new-item-window", openNewItemWindowCb);

ipcMain.on("open-edit-item-window", (e, data) => {
  if (editItemWindow) {
    editItemWindow.close();
  }

  const selectedTab = data.type === "expenses" ? expenses : profits;

  for (let [index, item] of selectedTab.entries()) {
    if (item.id === data.id) {
      // Permet de supprimer un certain nombre d'élément
      // à partir d'un index donné
      editItemWindow = createWindow("edit-item", { item }, 1000, 500);
      // Slice permet d'extraire une partie d'un tableau
      ipcMain.handle("edit-item", (e, data) => {
        // Update
        selectedTab[index].label = data.label;
        selectedTab[index].value = data.value;

        homeWindow.send("edited-item", {
          item: selectedTab[index],
          expenses,
          profits,
        });

        return "Item modifié avec succès ✔️✔️";
      });
      break;
    }
  }
  editItemWindow.on("close", () => {
    editItemWindow = null;
    // ipcMain.removeHandler('new-item');
  });
});

///////////////////////// Delete window listeners /////////////////////////////
ipcMain.handle("show-confirm-delete-item", (e, data) => {
  const choice = dialog.showMessageBoxSync({
    type: "warning",
    buttons: ["Non", "Oui"],
    title: "Confirmation de suppression",
    message: "Êtes-vous sûr de vouloir supprimer l'élément ?",
  });
  if (choice) {
    const selectedTab = data.type === "expenses" ? expenses : profits;

    for (let [index, item] of selectedTab.entries()) {
      if (item.id === data.id) {
        // Permet de supprimer un certain nombre d'élément
        // à partir d'un index donné
        selectedTab.splice(index, 1);
        // Slice permet d'extraire une partie d'un tableau
        break;
      }
    }
    // Sinon, mais moins sexy
    // for (let i = 0; i<selectedTab.length; i++){
    //
    // }
  }
  return { choice, expenses, profits };
});

///////////////////// MENU CONFIG /////////////////////
const menuConfig = [
  {
    label: "Action",
    submenu: [
      {
        label: "Nouvelle dépense",
        accelerator: "CmdOrCtrl+N",
        click() {
          openNewItemWindowCb(null, { type: "expense" });
        },
      },
      {
        label: "Nouvelle recette",
        accelerator: "CmdOrCtrl+J",
        click() {
          openNewItemWindowCb(null, { type: "profit" });
        },
      },
      {
        label: "Activer/Désactiver le mode édition",
        accelerator: "CmdOrCtrl+E",
        click() {
          homeWindow.send("toggle-edition-mode");
        },
      },
    ],
  },
  {
    label: "Fenêtre",
    submenu: [
      { role: "reload" },
      { role: "toggledevtools" },
      { type: "separator" },
      { role: "togglefullscreen" },
      { role: "minimize" },
      { type: "separator" },
      { role: "close" },
    ],
  },
];

const menu = Menu.buildFromTemplate(menuConfig); // Transforme le menu en objet
Menu.setApplicationMenu(menu); // Apply the menu to the app
