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
        
        if (data.view_config) {
          // Reset fieldMap to defaults before applying new mappings
          fieldMap = { ...defaultFieldMap };
          
          // Apply mappings if they exist, ensuring invalid fields are set to notUsed
          if (data.view_config.controls_mapping) {
            Object.entries(data.view_config.controls_mapping).forEach(([key, value]) => {
              if (key in fieldMap) {
                fieldMap[key] = value || labels.notUsed;  // Handle empty values
              }
            });
          }
          
          // Store selected fields if they exist
          if (data.view_config.display_fields) {
            selectedFields = [...data.view_config.display_fields];
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
      const details = document.querySelector('#configSection details');
      details.open = true;
      navigation.goToMain();
    } catch (error) {
      console.error("File processing error:", error);
      alert(`Error processing file: ${error.message}`);
    } finally {
      this.hideLoading();
      document.getElementById("itemViewSection").classList.add('hidden');
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
let allFields = [];
let selectedFields = [];

function extractAllFields() {
  const fieldSet = new Set();
  rawData.forEach(item => {
    collectFields(item, '', fieldSet);
  });
  allFields = Array.from(fieldSet).sort();
}

function collectFields(obj, prefix, set) {
  for (const key in obj) {
    const path = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      collectFields(obj[key], path, set);
    } else {
      set.add(path);
    }
  }
}

function renderConfigUI() {
  const mapping = ['search', 'filter1', 'filter2', 'filter3', 'sort1', 'sort2'];
  const container = document.getElementById("mappingControls");
  container.innerHTML = '';
  
  mapping.forEach(role => {
    const row = document.createElement("div");
    row.className = 'form-row';
    
    const label = document.createElement("label");
    label.textContent = role;
    
    const select = document.createElement("select");
    select.id = `map_${role}`;
    select.innerHTML = `<option value="">${labels.notUsed}</option>` + 
      allFields.map(f => `<option value="${f}">${f}</option>`).join('');
    
    // Set the initial value based on fieldMap, checking if field exists in allFields
    const mappedField = fieldMap[role];
    select.value = (mappedField === labels.notUsed || !allFields.includes(mappedField)) ? '' : mappedField;
    
    row.appendChild(label);
    row.appendChild(select);
    container.appendChild(row);
  });

  // Update display field selector layout
  const displayFieldSelector = document.getElementById("displayFieldSelector");
  displayFieldSelector.innerHTML = '';
  allFields.forEach(f => {
    const div = document.createElement("div");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = f;
    checkbox.id = `chk_${f}`;
    const label = document.createElement("label");
    label.htmlFor = `chk_${f}`;
    label.textContent = f;
    div.appendChild(checkbox);
    div.appendChild(label);
    displayFieldSelector.appendChild(div);
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

function updateDisplayFieldsSelection() {
  selectedFields.forEach(field => {
    const checkbox = document.getElementById(`chk_${field}`);
    if (checkbox) {
      checkbox.checked = true;
    }
  });
}

function applyConfiguration() {
  const keys = Object.keys(fieldMap);
  keys.forEach(k => {
    const sel = document.getElementById(`map_${k}`);
    const value = sel.value;
    // Explicitly set notUsed for empty or invalid fields
    fieldMap[k] = value && allFields.includes(value) ? value : labels.notUsed;
  });

  selectedFields = allFields.filter(f => {
    const chk = document.getElementById(`chk_${f}`);
    return chk.checked;
  });

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

// Add navigation controller
const navigation = {
  screens: {
    main: document.getElementById('mainScreen'),
    itemView: document.getElementById('itemViewScreen')
  },

  showScreen(screenId) {
    Object.values(this.screens).forEach(screen => {
      screen.classList.add('hidden');
    });
    this.screens[screenId].classList.remove('hidden');
  },

  goToMain() {
    this.showScreen('main');
  },

  goToItemView() {
    this.showScreen('itemView');
  }
};

// Update viewItem function
function viewItem(item) {
  const content = document.getElementById('itemViewContent');
  const title = document.getElementById('itemViewTitle');
  
  content.innerHTML = '';
  
  const titleField = selectedFields[0];
  title.textContent = getByPath(item, titleField) || 'Item Details';
  
  allFields.forEach(field => {
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
      
      const separator = document.createElement('div');
      separator.className = 'field-separator';
      
      fieldGroup.appendChild(label);
      fieldGroup.appendChild(valueDiv);
      fieldGroup.appendChild(separator);
      content.appendChild(fieldGroup);
    }
  });
  
  navigation.goToItemView();
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
