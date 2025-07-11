// Navigation Module

// navigation controller
const navigation = {
  showScreen(screenId) {
    Object.values(dom.screens).forEach(screen => {
      screen.classList.add('hidden');
    });
    dom.screens[screenId].classList.remove('hidden');
  }
};

function show(element) {
  if (element) {
    element.classList.remove('hidden');
  }
}

function hide(element) {
  if (element) {
    element.classList.add('hidden');
  }
}

// DOM elements
const dom = {
  screens: {
    main: document.getElementById('mainScreen'),
    itemView: document.getElementById('itemViewScreen')
  },
  mainScreen: {
    screen: () => document.getElementById("mainScreen"),
    mappingControls: () => document.getElementById("mappingControls"),
    displayFieldSelector: () => document.getElementById("displayFieldSelector"),
    btnApplyConfiguration: () => document.getElementById("btnApplyConfiguration"),
    results: document.getElementById("results")
  },
  itemViewScreen: {
    screen: () => document.getElementById("itemViewScreen"),
    backButton: () => document.querySelector("#itemViewScreen .back-button")
  }
};

// Event listeners
dom.itemViewScreen.backButton().addEventListener("click", () => {
  navigation.showScreen("main");
});
dom.mainScreen.btnApplyConfiguration().addEventListener("click", () => {
  applyConfiguration();
});

class FileManager {
  constructor() {
    this.fileInput = document.getElementById("fileInput");
    this.loadingIndicator = document.getElementById("loadingIndicator");
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
    this.fileInput.addEventListener("click", () => {
      // Reset value to ensure change event fires even if same file is selected
      this.fileInput.value = '';
    });
  }

  showLoading() {
    this.loadingIndicator.classList.remove('hidden');
  }

  hideLoading() {
    this.loadingIndicator.classList.add('hidden');
  }

  async handleFileSelect(event) {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      this.showLoading();
      const text = await this.readFileAsText(file);
      const data = this.parseJSON(text);
      
      if (!data) {
        throw new Error("Invalid JSON data");
      }

      if (data.collections && typeof data.collections === "object") {
        const keys = Object.keys(data.collections);
        const choice = keys.length === 1 ? keys[0] : prompt("Enter collection name:\n" + keys.join(", "));
        rawData = data.collections[choice] || [];
        
        if (data.configs) {
          // Reset fieldMap to defaults before applying new mappings
          fieldMap = { ...defaultFieldMap };
          
          // Apply mappings if they exist, ensuring invalid fields are set to notUsed
          if (data.configs.controls_mapping) {
            Object.entries(data.configs.controls_mapping).forEach(([key, value]) => {
              if (key in fieldMap) {
                fieldMap[key] = value || labels.notUsed;  // Handle empty values
              }
            });
          }
          
          // Store selected fields if they exist
          if (data.configs.views) {
            if (data.configs.views.list_view) {
              selectedFields = [...data.configs.views.list_view];
            }
            if (data.configs.views.detail_view) {
              selectedDetailFields = [...data.configs.views.detail_view];
              console.log('Initial detail fields order:', selectedDetailFields);
            }
          }
        }
      } else if (Array.isArray(data)) {
        rawData = data;
      } else {
        throw new Error("Invalid file format - expected JSON array or collections object");
      }

      extractAllFields();
      renderConfigUI();
      updateMappingControls();
      document.getElementById("configSection").classList.remove('hidden');
      document.getElementById("resultsSection").classList.add('hidden');
      document.getElementById("controlsSection").classList.add('hidden');      
      const configSectionCollapsable = document.querySelector('#configSection details');
      configSectionCollapsable.open = true;
      navigation.showScreen("main");
    } catch (error) {
      console.error("File processing error:", error);
      alert(`Error processing file: ${error.message}`);
    } finally {
      this.hideLoading();
      hide(dom.itemViewScreen.screen());
    }
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Error reading file"));
      
      reader.onprogress = (event) => {
        if (event.loaded && event.total) {
          console.log(`Loading: ${Math.round((event.loaded / event.total) * 100)}%`);
        }
      };
      
      reader.readAsText(file);
    });
  }

  parseJSON(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  }
}

// Initialize file manager
const fileManager = new FileManager();

const labels = {
  "notUsed" : '- not used -',
  "all" : "- all -",
};

const defaultFieldMap = {
  search: labels.notUsed,
  filter1: labels.notUsed,
  filter2: labels.notUsed,
  filter3: labels.notUsed,
  sort1: labels.notUsed,
  sort2: labels.notUsed
};

let fieldMap = { ...defaultFieldMap };

let rawData = null;
let activeItems = [];
let allFields = [];
let allFieldsSorted = [];
let selectedFields = [];
let selectedDetailFields = [];

function extractAllFields() {
  const fieldSet = new Set();
  const orderedFields = [];
  
  rawData.forEach(item => {
    collectFields(item, '', fieldSet, orderedFields);
  });
  
  allFields = [...orderedFields];
  allFieldsSorted = [...orderedFields].sort();
}

function collectFields(obj, prefix, set, orderedFields) {
  for (const key in obj) {
    const path = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      collectFields(obj[key], path, set, orderedFields);
    } else if (!set.has(path)) {
      set.add(path);
      orderedFields.push(path);
    }
  }
}

function renderConfigUI() {
  const mapping = ['search', 'filter1', 'filter2', 'filter3', 'sort1', 'sort2'];
  const container = dom.mainScreen.mappingControls();
  container.innerHTML = '';
  
  mapping.forEach(role => {
    const row = document.createElement("div");
    row.className = 'form-row';
    
    const label = document.createElement("label");
    label.textContent = role;
    
    const select = document.createElement("select");
    select.id = `map_${role}`;
    select.innerHTML = `<option value="">${labels.notUsed}</option>` + 
      allFieldsSorted.map(f => `<option value="${f}">${f}</option>`).join('');
    
    const mappedField = fieldMap[role];
    select.value = (mappedField === labels.notUsed || !allFieldsSorted.includes(mappedField)) ? '' : mappedField;
    
    row.appendChild(label);
    row.appendChild(select);
    container.appendChild(row);
  });

  createSortableFieldSelector(dom.mainScreen.displayFieldSelector(), selectedFields);
  createSortableFieldSelector(document.getElementById('displayFieldSelectorDetailView'), selectedDetailFields);
}

function createSortableFieldSelector(container, selectedItems) {
  container.innerHTML = '';
  container.classList.add('sortable-list');

  const ordered = [...selectedItems.filter(f => allFields.includes(f)), ...allFieldsSorted.filter(f => !selectedItems.includes(f))];

  ordered.forEach(field => {
    const div = document.createElement("div");
    div.className = "sortable-item";
    div.draggable = true;
    div.dataset.field = field;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = field;
    checkbox.id = `chk_${container.id}_${field}`;
    checkbox.checked = selectedItems.includes(field);

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = field;

    div.appendChild(checkbox);
    div.appendChild(label);
    container.appendChild(div);
  });

  enableDragAndDrop(container);
}

function enableDragAndDrop(container) {
  let dragged;

  container.querySelectorAll('.sortable-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      dragged = item;
      setTimeout(() => item.classList.add('dragging'), 0); // Use timeout to avoid visual glitch
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      dragged.classList.remove('dragging');
      dragged = null;
    });
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(container, e.clientY);
    if (dragged && afterElement !== dragged) {
        if (afterElement) {
            container.insertBefore(dragged, afterElement);
        } else {
            container.appendChild(dragged);
        }
    }
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.sortable-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function getCheckedFieldsInOrder(container) {
  return Array.from(container.querySelectorAll('.sortable-item'))
    .filter(div => div.querySelector('input[type="checkbox"]').checked)
    .map(div => div.dataset.field);
}

function applyConfiguration() {
  const keys = Object.keys(fieldMap);
  keys.forEach(k => {
    const sel = document.getElementById(`map_${k}`);
    const value = sel.value;
    fieldMap[k] = value && allFields.includes(value) ? value : labels.notUsed;
  });

  const listContainer = dom.mainScreen.displayFieldSelector();
  const detailContainer = document.getElementById('displayFieldSelectorDetailView');

  selectedFields = getCheckedFieldsInOrder(listContainer);
  selectedDetailFields = getCheckedFieldsInOrder(detailContainer);

  if (selectedDetailFields.length === 0) {
    selectedDetailFields = [...allFields];
  }

  if (selectedFields.length === 0) {
    selectedFields = allFields.length ? [allFields[0]] : [];
  }

  renderControls();
  document.getElementById("controlsSection").classList.remove('hidden');
  document.getElementById("resultsSection").classList.remove('hidden');
  filterAndDisplay();
  const details = document.querySelector('#configSection details');
  details.open = false;
}

function renderControls() {
  const filterKeys = ['filter1', 'filter2', 'filter3'];
  const container = document.getElementById("filterControls");
  container.innerHTML = '';
  
  filterKeys.forEach(fk => {
    const mappedField = fieldMap[fk];
    if (mappedField === labels.notUsed || !allFields.includes(mappedField)) {
      return;
    }
    const values = getUniqueValues(mappedField);
    const div = document.createElement("div");
    div.className = 'form-row';
    
    const label = document.createElement("label");
    label.textContent = mappedField;
    
    const select = document.createElement("select");
    select.id = `ctrl_${fk}`;
    select.innerHTML = `<option value="">${labels.all}</option>` + 
      values.map(v => `<option value="${v}">${v}</option>`).join('');
    
    div.appendChild(label);
    div.appendChild(select);
    container.appendChild(div);
  });

  const sortSel = document.getElementById("sortControl");
  const sortContainer = document.getElementById("sortContainer");
  sortSel.innerHTML = '';
  let hasUserSortOptions = false;
  
  ['sort1', 'sort2'].forEach(k => {
    const mappedField = fieldMap[k];
    if (mappedField && mappedField !== labels.notUsed && allFields.includes(mappedField)) {
      hasUserSortOptions = true;
      sortSel.innerHTML += `<option value="${mappedField}::desc">${mappedField} (desc.)</option>`;
      sortSel.innerHTML += `<option value="${mappedField}::asc">${mappedField} (asc.)</option>`;          
    }
  });

  if (hasUserSortOptions) {
    sortSel.innerHTML += '<option disabled>──────────</option>';
  }

  sortSel.innerHTML += `
    <option value="__original::asc">original order (asc.)</option>
    <option value="__original::desc">original order (desc.)</option>
    <option value="__random::none">random</option>
  `;

  sortContainer.classList.remove('hidden');

  document.getElementById("searchInput").addEventListener("input", debounce(filterAndDisplay, 300));
  filterKeys.forEach(fk => {
    const ctrl = document.getElementById(`ctrl_${fk}`);
    if (ctrl) ctrl.addEventListener("change", filterAndDisplay);
  });
  sortSel.addEventListener("change", filterAndDisplay);
}

function getUniqueValues(fieldPath) {
  const set = new Set();
  rawData.forEach(item => {
    const val = getByPath(item, fieldPath);
    if (val !== undefined) set.add(String(val));
  });
  return Array.from(set).sort();
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

function filterAndDisplay() {
  let filtered = [...rawData];

  ['filter1', 'filter2', 'filter3'].forEach(fk => {
    const field = fieldMap[fk];
    if (field !== labels.notUsed && allFields.includes(field)) {
      const sel = document.getElementById(`ctrl_${fk}`);
      const val = sel?.value;
      if (val) {
        filtered = filtered.filter(item => String(getByPath(item, field)) === val);
      }
    }
  });

  const q = document.getElementById("searchInput").value.toLowerCase();
  if (q) {
    filtered = filtered.filter(item =>
      selectedFields.some(f =>
        String(getByPath(item, f)).toLowerCase().includes(q)
      )
    );
  }

  const sortSel = document.getElementById("sortControl");
  const sortVal = sortSel.value;
  if (sortVal) {
    const [f, dir] = sortVal.split("::");
    
    if (f === '__original') {
      filtered.sort((a, b) => {
        const idxA = rawData.indexOf(a);
        const idxB = rawData.indexOf(b);
        return dir === 'asc' ? idxA - idxB : idxB - idxA;
      });
    } 
    else if (f === '__random') {
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
      }
    }
    else {
      filtered.sort((a, b) => {
        const va = normalizeValue(getByPath(a, f));
        const vb = normalizeValue(getByPath(b, f));
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

  renderResults(filtered);
}

function normalizeValue(val) {
  if (val === null || val === undefined) return '';
  if (!isNaN(val)) return Number(val);
  const d = Date.parse(val);
  if (!isNaN(d)) return d;
  return String(val).toLowerCase();
}

function renderResults(items) {
  const container = document.getElementById("results");
  container.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = 'item-card';
    selectedFields.forEach(f => {
      const val = getByPath(item, f);
      const p = document.createElement("p");
      p.textContent = `${f}: ${val}`;
      div.appendChild(p);
    });
    div.addEventListener('click', () => viewItem(item));
    container.appendChild(div);
  });
}

function viewItem(item) {
  const content = document.getElementById('itemViewContent');
  const title = document.getElementById('itemViewTitle');
  
  content.innerHTML = '';
  title.textContent = '';
  
  console.log(selectedDetailFields);
  selectedDetailFields.forEach(field => {
    const value = getByPath(item, field);
    if (value !== undefined) {
      const fieldGroup = document.createElement('div');
      fieldGroup.className = 'field-group';
      
      const label = document.createElement('div');
      label.className = 'field-label';
      label.textContent = field;
      
      const valueDiv = document.createElement('div');
      valueDiv.className = 'field-value';
      valueDiv.textContent = value;      
      
      fieldGroup.appendChild(label);
      fieldGroup.appendChild(valueDiv);
      content.appendChild(fieldGroup);
    }
  });
  
  navigation.showScreen('itemView');
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function updateMappingControls() {
  // This function can be expanded later if needed.
}

function updateDisplayFieldsSelection() {
  // This function can be expanded later if needed.
}