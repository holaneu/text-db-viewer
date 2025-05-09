Here is the complete **PRD (Project Requirements Document)** for the *Database Viewer* application, which is prepared as a specification for creating a functional and immediately usable application in pure JavaScript:

---

# **Project Requirement Document (PRD)**  
## **Project Name:** Database Viewer  
## **Description:**  
A simple web application for uploading and interactive browsing of structured JSON databases without the need for a backend. The application will run purely in the web browser and allow users to upload a JSON database, configure fields for display, search, filtering and sorting, and then browse the results.

---

## **Technologies Used**
- **Frontend:**  
  - Pure JavaScript (vanilla JS)
  - HTML5, CSS3
  - No framework or library (no jQuery, React, Vue, etc.)
- **Styling:**
  - Modern and responsive design
  - Built-in dark theme
  - Use of **CSS classes for UI components** that facilitate reuse in other projects
- **Platform:**  
  - Client-side web application, running without a server
- **Language:**
  - All code must use English for all text (variable names, function names, file names, comments, etc., as well as all text and labels in the user interface), regardless of the language in which the specification is written.

---

## **User Scenarios and Functionality**

### 1. **Database JSON File Upload**
- Button of type `<input type="file">`, allowing upload of `.json` files
- After upload:
  - Structure type is determined:
    - **Type 1:** File contains `db_info` and `collections` → user selects specific collection
    - **Type 2:** List of objects is directly in the root array
  - Selected collection is stored as active dataset for display

### 2. **Browser Initial Configuration (UI Configurator)**
After loading data, field configuration step follows:

- UI component will be in the form of an expandable panel
- Contains the following configuration elements:
  - **Dropdowns** for mapping fields to control elements:
    - `Search`, `Filter1`, `Filter2`, `Filter3`, `Sort1`, `Sort2`
    - Each dropdown contains:
      - `- not used -` as default value
      - List of all unique fields from data (including nested, in `field1.field2` format)
  - **Multi-select** checkbox for selecting which fields should be displayed on each item card
- **View Configuration Management (view_config):**
  - Ability to save current view configuration
  - Loading previously saved configuration
  - When loading configuration:
    - Non-existent or invalid fields are automatically set to "- not used -"
    - Empty selections are explicitly set to "- not used -"
  - When updating controls:
    - Fields marked as "not used" and non-existent fields display as "- not used -"
    - Configuration validation and cleaning with each data change

### 3. **Control Panel for Search, Filtering, and Sorting**
Located at the top of the application.

- **Search field:** text field with debounce logic (delayed search)
- **Filter dropdowns (1-3):**
  - Label according to selected field
  - Selection field (`<select>`) with `---` option (no filter) and unique values from selected field
- **Sort dropdown:**
  - Displays options as:
    - `field (ascending)`
    - `field (descending)`
  - Combines all fields assigned to Sort1 and Sort2

### 4. **Database Item Display**
- List of cards or rows with data
- Each card displays only fields selected in configuration
- Responsive display (desktop and mobile)

---

## **Filtering and Sorting Logic**
1. **Filtering:**  
   - Applied first
   - Each active filter narrows the set of items by value match (exact match)

2. **Searching:**  
   - Text search across all visible item fields (or all fields if none specified)

3. **Sorting:**  
   - Allows multiple sorting by selection order (`Sort1`, `Sort2`)
   - For each field:
     - If field contains:
       - **Numbers or ISO dates:** Sort as numbers or dates
       - **Boolean strings ("true"/"false"):** Sort as booleans
       - **Arrays:** Use first value or element count
       - **Other strings:** Sort as text
   - User cannot change mode, logic is automatic based on value data type

---

## **Edge Cases and UX Considerations**
- If invalid JSON is loaded → display error message
- If field contains object or compound structure → use dot notation (`a.b.c`)
- No field selected for display → show warning
- No filter/sort/search set → corresponding UI component not displayed

---

## **Assumptions**
- Application runs in browser only
- User brings their own JSON data
- View configuration can be saved and loaded
- No data stored in localStorage or on server (except view configuration)

---

## **Possible Future Extensions**
- Ability to export filtered results as JSON or CSV
- Bookmark support
- Local cache of last loaded file
- Management of multiple view configurations
- Export and import of view configurations

---

Would you like me to prepare a specific code structure for development from this PRD?
