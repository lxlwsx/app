const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  notes: {
    create: (content, tags, collection) => ipcRenderer.invoke('notes:create', content, tags, collection),
    update: (id, content, tags, collection) => ipcRenderer.invoke('notes:update', id, content, tags, collection),
    delete: (id) => ipcRenderer.invoke('notes:delete', id),
    getAll: () => ipcRenderer.invoke('notes:getAll'),
    getByCollection: (col) => ipcRenderer.invoke('notes:getByCollection', col),
    search: (query) => ipcRenderer.invoke('notes:search', query),
    searchByTags: (tags) => ipcRenderer.invoke('notes:searchByTags', tags),
    searchByTime: (start, end) => ipcRenderer.invoke('notes:searchByTime', start, end),
    getTimeGroup: (group) => ipcRenderer.invoke('notes:getTimeGroup', group),
    getByDate: (dateStr) => ipcRenderer.invoke('notes:getByDate', dateStr),
    getActiveDates: () => ipcRenderer.invoke('notes:getActiveDates'),
    getAllTags: () => ipcRenderer.invoke('notes:getAllTags'),
  },
  collections: {
    getAll: () => ipcRenderer.invoke('collections:getAll'),
    add: (name) => ipcRenderer.invoke('collections:add', name),
    remove: (name) => ipcRenderer.invoke('collections:remove', name),
    counts: () => ipcRenderer.invoke('collections:counts'),
  },
  window: {
    hide: () => ipcRenderer.invoke('window:hide'),
    minimize: () => ipcRenderer.invoke('window:minimize'),
    close: () => ipcRenderer.invoke('window:close'),
    quit: () => ipcRenderer.invoke('window:quit'),
  },
  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    set: (theme) => ipcRenderer.invoke('theme:set', theme),
  }
});
