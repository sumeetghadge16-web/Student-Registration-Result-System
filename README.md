# Student Registration & Result Management System

A responsive student registration and result management assignment built with HTML5, CSS3 and vanilla JavaScript.

## Files
- `index.html` — semantic page structure, registration form, result panel and saved-record table.
- `style.css` — responsive styling for desktop, tablet and mobile.
- `script.js` — input validation, result calculations, JSON serialization, Local Storage persistence, search, deletion and JSON export.

## How to run
1. Extract the ZIP file.
2. Keep all three files in the same folder.
3. Open `index.html` in a modern browser. If your browser restricts Local Storage for local files, run the folder using VS Code Live Server.
4. Fill in the required student details and all five subject marks, then click **Calculate & Save Result**.

## Rules implemented
- All student fields are required.
- Name must contain at least two characters and use letters, spaces, apostrophes, dots or hyphens.
- Email is checked against a basic email pattern.
- Roll numbers must be unique, ignoring letter case.
- Marks must be whole numbers from 0 through 100.
- Total = sum of all five subjects (maximum 500).
- Percentage = total / 500 × 100.
- Pass = every subject has at least 35 marks; otherwise Fail.
- Student records are converted to JSON and saved in browser Local Storage under `studentResultRecords_v1`.
- Existing records are restored when the page is reopened. Records can be searched, deleted and exported as JSON.

## Testing checklist
- Submit an empty form: validation messages should appear.
- Enter marks outside 0–100 or decimal marks: validation should reject them.
- Add a student with all marks at least 35: result should be PASS.
- Add a student with one mark below 35 but a high overall total: result should be FAIL.
- Register the same roll number twice: the second submission should be rejected.
- Refresh the page: saved records should remain visible.
- Search for a name or roll number, delete a record, and use Export JSON.

## Notes
- The 35-mark passing threshold and the five subject names are assignment assumptions and can be changed in `script.js` and `index.html`.
- Local Storage is browser/device-specific. This is a front-end assignment, not a server-backed multi-user system.
- The page uses Google Fonts when internet access is available; system fallback fonts are defined.
