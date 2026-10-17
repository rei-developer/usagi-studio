export const DATABASE_NAME = "usagi-studio";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("projects");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("다른 탭에서 저장소를 사용 중입니다."));
  });
}

async function access(mode, value) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("projects", mode);
      const store = transaction.objectStore("projects");
      const request =
        mode === "readonly"
          ? store.get("current")
          : store.put(value, "current");
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () =>
        reject(transaction.error || request.error || new Error("저장 취소"));
      transaction.onerror = () => reject(transaction.error || request.error);
    });
  } finally {
    db.close();
  }
}

export const readProject = () => access("readonly");
export const saveProject = (project) => access("readwrite", project);
