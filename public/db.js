let db;

const request = indexedDB.open("BudgetDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains('BudgetDB')) {
      db.createObjectStore("BudgetDB", { autoIncrement: true});
  }
};  

request.onerror = function (event) {
  console.log(`Error: ${event.target.onerror}`);
};

request.onsuccess = function (event) {
  console.log("successful event:", event);
  db = event.target.result;
    let pastVersion = event.pastVersion;
    let newVersion = event.newVersion || db.version;
    if (!pastVersion) {
        console.log(`DB currently running on version ${db.version} - no updates at this time`);
    } else {
    console.log(`DB updated from version ${pastVersion} to ${newVersion}`);
    }
  if (navigator.onLine) {
    checkDatabase();
  }
};

function saveRecord(record) {
    console.log('saving the record now...');
    console.log(record);
    const transaction = db.transaction(['BudgetDB'], 'readwrite');
    const offLineStore = transaction.objectStore('BudgetDB');
    offLineStore.add(record);
}

function checkDatabase() {
  console.log('checking the db now...');
  let transaction = db.transaction(['BudgetDB'], 'readwrite');
  const store = transaction.objectStore('BudgetDB');
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            transaction = db.transaction(['BudgetDB'], 'readwrite');
            const updatedStore = transaction.objectStore('BudgetDB');
            updatedStore.clear();
            console.log('clearing store');
          }
        });
    }
  };
}

window.addEventListener('online', checkDatabase);