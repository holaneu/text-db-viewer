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
      updateMappingControls();  // Add this line
      updateDisplayFieldsSelection();  // Add this line
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
      //domElements.itemViewScreen.screen.classList.add('hidden');
      hide(dom.itemViewScreen.screen());
    }
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Error reading file"));
      
      // Handle mobile Safari specifically
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

// Modify the fieldMap initialization
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
let allFields = [];          // Will store fields in order of discovery
let allFieldsSorted = [];    // Will store alphabetically sorted fields
let selectedFields = [];
let selectedDetailFields = []; // Add after existing variables

// Update variables section
// let rawData = null;
// let activeItems = [];
// let allFields = [];          // Will store fields in order of discovery
// let allFieldsSorted = [];    // Will store alphabetically sorted fields
// let selectedFields = [];
// let selectedDetailFields = [];

// Update extractAllFields function
function extractAllFields() {
  const fieldSet = new Set();
  const orderedFields = [];
  
  rawData.forEach(item => {
    collectFields(item, '', fieldSet, orderedFields);
  });
  
  allFields = [...orderedFields];  // Maintain discovery order
  allFieldsSorted = [...orderedFields].sort();  // Sorted copy for UI elements
}

// Update collectFields function
function collectFields(obj, prefix, set, orderedFields) {
  for (const key in obj) {
    const path = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      collectFields(obj[key], path, set, orderedFields);
    } else if (!set.has(path)) {
      set.add(path);
      orderedFields.push(path);  // Maintain order of discovery
    }
  }
}

// Update renderConfigUI function to use sorted fields for dropdowns
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
      allFieldsSorted.map(f => `<option value="${f}">${f}</option>`).join('');  // Use sorted fields
    
    const mappedField = fieldMap[role];
    select.value = (mappedField === labels.notUsed || !allFieldsSorted.includes(mappedField)) ? '' : mappedField;
    
    row.appendChild(label);
    row.appendChild(select);
    container.appendChild(row);
  });

  // Create field selectors for both list and detail views
  createFieldSelector(dom.mainScreen.displayFieldSelector(), selectedFields);
  createFieldSelector(document.getElementById('displayFieldSelectorDetailView'), selectedDetailFields);
}

// Update updateDisplayFieldsSelection function
function updateDisplayFieldsSelection() {
  // Update list view checkboxes
  const listContainer = dom.mainScreen.displayFieldSelector();
  selectedFields.forEach(field => {
    const checkbox = document.getElementById(`chk_${listContainer.id}_${field}`);
    if (checkbox) {
      checkbox.checked = true;
    }
  });

  // Update detail view checkboxes
  const detailContainer = document.getElementById('displayFieldSelectorDetailView');
  selectedDetailFields.forEach(field => {
    const checkbox = document.getElementById(`chk_${detailContainer.id}_${field}`);
    if (checkbox) {
      checkbox.checked = true;
    }
  });
}

function updateMappingControls() {
  Object.entries(fieldMap).forEach(([role, field]) => {
    const select = document.getElementById(`map_${role}`);
    if (select) {
      // Set empty value if field is notUsed or doesn't exist in allFields
      select.value = (field === labels.notUsed || !allFields.includes(field)) ? '' : field;
    }
  });
}

function createFieldSelector(container, selectedItems) {
  container.innerHTML = '';
  
  // For detail view, maintain exact order from selectedDetailFields
  if (container.id === 'displayFieldSelectorDetailView') {
    // First render configured fields in their original order
    selectedDetailFields.forEach(f => {
      if (allFields.includes(f)) {
        createFieldCheckbox(container, f, true);
      }
    });
    
    // Then add remaining fields
    allFieldsSorted.forEach(f => {
      if (!selectedDetailFields.includes(f)) {
        createFieldCheckbox(container, f, false);
      }
    });
  } else {
    // For other selectors (list view), use sorted fields
    allFieldsSorted.forEach(f => {
      createFieldCheckbox(container, f, selectedItems.includes(f));
    });
  }
}

function createFieldCheckbox(container, field, checked) {
  const div = document.createElement("div");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.value = field;
  checkbox.id = `chk_${container.id}_${field}`;
  checkbox.checked = checked;
  checkbox.dataset.originalOrder = selectedDetailFields.indexOf(field);  // Store original position
  
  const label = document.createElement("label");
  label.htmlFor = checkbox.id;
  label.textContent = field;
  
  div.appendChild(checkbox);
  div.appendChild(label);
  container.appendChild(div);
}

function applyConfiguration() {
  const keys = Object.keys(fieldMap);
  keys.forEach(k => {
    const sel = document.getElementById(`map_${k}`);
    const value = sel.value;
    fieldMap[k] = value && allFields.includes(value) ? value : labels.notUsed;
  });

  // Get selected fields for both views using original order
  const listContainer = dom.mainScreen.displayFieldSelector();
  const detailContainer = document.getElementById('displayFieldSelectorDetailView');
  
  selectedFields = getSelectedFields(listContainer);
  selectedDetailFields = getSelectedFieldsInOriginalOrder(detailContainer);

  // If no fields selected for detail view, use all fields
  if (selectedDetailFields.length === 0) {
    selectedDetailFields = [...allFields];
  }

  // If no fields selected for list view, use first field
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

function getSelectedFields(container) {
  return allFields.filter(f => {
    const chk = document.getElementById(`chk_${container.id}_${f}`);
    return chk?.checked;
  });
}

function getSelectedFieldsInOriginalOrder(container) {
  if (container.id === 'displayFieldSelectorDetailView') {
    // For detail view, follow original order
    return selectedDetailFields.filter(field => {
      const checkbox = document.getElementById(`chk_${container.id}_${field}`);
      return checkbox?.checked;
    });
  }
  
  // For other containers, use regular selection
  return Array.from(container.querySelectorAll('input[type="checkbox"]'))
    .filter(chk => chk.checked)
    .map(chk => chk.value);
}

function renderControls() {
  const filterKeys = ['filter1', 'filter2', 'filter3'];
  const container = document.getElementById("filterControls");
  container.innerHTML = '';
  
  filterKeys.forEach(fk => {
    const mappedField = fieldMap[fk];
    // Skip if field is not used or doesn't exist in allFields
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
  let sortMappedFields = false;
  
  ['sort1', 'sort2'].forEach(k => {
    const mappedField = fieldMap[k];
    if (mappedField && mappedField !== labels.notUsed && allFields.includes(mappedField)) {
      sortMappedFields = true;
      sortSel.innerHTML += `<option value="${mappedField}::desc">${mappedField} (desc.)</option>`;
      sortSel.innerHTML += `<option value="${mappedField}::asc">${mappedField} (asc.)</option>`;          
    }
  });

  if (sortMappedFields) {
    sortContainer.classList.remove('hidden');
  } else {
    sortContainer.classList.add('hidden');
  }
  

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
    filtered.sort((a, b) => {
      const va = normalizeValue(getByPath(a, f));
      const vb = normalizeValue(getByPath(b, f));
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
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
    // Add click handler to view item details
    div.addEventListener('click', () => viewItem(item));
    container.appendChild(div);
  });
}

// Update viewItem function
function viewItem(item) {
  const content = document.getElementById('itemViewContent');
  const title = document.getElementById('itemViewTitle');
  
  content.innerHTML = '';
  title.textContent = ''; // Clear the title, leaving only back button
  
  console.log(selectedDetailFields);
  // Use selectedDetailFields directly, maintaining the exact order from config
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
