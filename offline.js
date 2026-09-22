(() => {
  "use strict";

  const ACCOUNT_KEY = "controle-rural.offline.accounts.v1";
  const SNAPSHOT_PREFIX = "controle-rural.offline.snapshot.v1";
  const QUEUE_PREFIX = "controle-rural.offline.queue.v1";
  const MAX_ACCOUNT_AGE = 7 * 24 * 60 * 60 * 1000;

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Não foi possível salvar os dados offline neste aparelho.", error);
      return false;
    }
  }

  function storageKey(prefix, account) {
    if (!account?.userId || !account?.farmId) return "";
    return `${prefix}.${account.userId}.${account.farmId}`;
  }

  function createOperationId() {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  function saveAccount(account) {
    if (!account?.userId || !account?.farmId) return false;
    const accounts = readJson(ACCOUNT_KEY, {});
    accounts[account.userId] = {
      userId: account.userId,
      farmId: account.farmId,
      role: account.role,
      fullName: account.fullName,
      farmName: account.farmName,
      email: account.email || "",
      legacyFarmId: account.legacyFarmId || account.farmId,
      verifiedAt: new Date().toISOString(),
    };
    return writeJson(ACCOUNT_KEY, accounts);
  }

  function getAccount(userId) {
    const account = readJson(ACCOUNT_KEY, {})[userId];
    if (!account?.verifiedAt) return null;
    const verifiedAt = new Date(account.verifiedAt).getTime();
    if (!Number.isFinite(verifiedAt) || Date.now() - verifiedAt > MAX_ACCOUNT_AGE) return null;
    return { ...account, offlineAccess: true };
  }

  function getLatestAccount() {
    const accounts = Object.values(readJson(ACCOUNT_KEY, {}))
      .filter((account) => account?.userId && account?.verifiedAt)
      .sort((left, right) => String(right.verifiedAt).localeCompare(String(left.verifiedAt)));
    return accounts.length ? getAccount(accounts[0].userId) : null;
  }

  function saveSnapshot(account, state, notifications = [], teamMembers = []) {
    const key = storageKey(SNAPSHOT_PREFIX, account);
    if (!key || !state) return false;
    const snapshot = {
      account: {
        userId: account.userId,
        farmId: account.farmId,
        role: account.role,
      },
      savedAt: new Date().toISOString(),
      state,
      notifications,
      teamMembers,
    };
    return writeJson(key, snapshot);
  }

  function getSnapshot(account) {
    const key = storageKey(SNAPSHOT_PREFIX, account);
    if (!key) return null;
    const snapshot = readJson(key, null);
    if (
      !snapshot?.state ||
      snapshot.account?.userId !== account.userId ||
      snapshot.account?.farmId !== account.farmId
    ) {
      return null;
    }
    return snapshot;
  }

  function getQueue(account) {
    const key = storageKey(QUEUE_PREFIX, account);
    if (!key) return [];
    const queue = readJson(key, []);
    return Array.isArray(queue) ? queue : [];
  }

  function setQueue(account, queue) {
    const key = storageKey(QUEUE_PREFIX, account);
    return key ? writeJson(key, queue) : false;
  }

  function enqueue(account, operation) {
    const queue = getQueue(account);
    const nextOperation = {
      id: operation.id || createOperationId(),
      entity: operation.entity,
      action: operation.action,
      recordId: operation.recordId || "",
      values: operation.values || {},
      createdAt: operation.createdAt || new Date().toISOString(),
    };
    const isCrud = ["create", "update", "delete"].includes(nextOperation.action);

    if (["completion"].includes(nextOperation.action)) {
      const previous = queue.find(
        (item) =>
          item.entity === nextOperation.entity &&
          item.recordId === nextOperation.recordId &&
          item.action === nextOperation.action,
      );
      if (previous) {
        previous.values = nextOperation.values;
        setQueue(account, queue);
        return previous;
      }
    }

    if (isCrud) {
      const related = queue.filter(
        (item) => item.entity === nextOperation.entity && item.recordId === nextOperation.recordId,
      );
      const pendingCreate = related.find((item) => item.action === "create");

      if (nextOperation.action === "update" && pendingCreate) {
        pendingCreate.values = { ...pendingCreate.values, ...nextOperation.values };
        setQueue(account, queue);
        return pendingCreate;
      }

      if (nextOperation.action === "update") {
        const pendingUpdate = related.find((item) => item.action === "update");
        if (pendingUpdate) {
          pendingUpdate.values = { ...pendingUpdate.values, ...nextOperation.values };
          setQueue(account, queue);
          return pendingUpdate;
        }
      }

      if (nextOperation.action === "delete") {
        const withoutRelated = queue.filter(
          (item) => !(item.entity === nextOperation.entity && item.recordId === nextOperation.recordId),
        );
        if (pendingCreate) {
          setQueue(account, withoutRelated);
          return null;
        }
        withoutRelated.push(nextOperation);
        setQueue(account, withoutRelated);
        return nextOperation;
      }
    }

    queue.push(nextOperation);
    setQueue(account, queue);
    return nextOperation;
  }

  function removeOperation(account, operationId) {
    return setQueue(
      account,
      getQueue(account).filter((item) => item.id !== operationId),
    );
  }

  function clearAccount(account) {
    const accounts = readJson(ACCOUNT_KEY, {});
    if (account?.userId) delete accounts[account.userId];
    writeJson(ACCOUNT_KEY, accounts);
    [SNAPSHOT_PREFIX, QUEUE_PREFIX].forEach((prefix) => {
      const key = storageKey(prefix, account);
      if (key) localStorage.removeItem(key);
    });
  }

  function signOutAccount(account) {
    const accounts = readJson(ACCOUNT_KEY, {});
    if (account?.userId) delete accounts[account.userId];
    writeJson(ACCOUNT_KEY, accounts);

    const pendingCount = getQueue(account).length;
    if (!pendingCount) {
      [SNAPSHOT_PREFIX, QUEUE_PREFIX].forEach((prefix) => {
        const key = storageKey(prefix, account);
        if (key) localStorage.removeItem(key);
      });
    }

    return { pendingCount, preserved: pendingCount > 0 };
  }

  window.ruralOffline = {
    createOperationId,
    saveAccount,
    getAccount,
    getLatestAccount,
    saveSnapshot,
    getSnapshot,
    getQueue,
    setQueue,
    enqueue,
    removeOperation,
    clearAccount,
    signOutAccount,
  };
})();
