'use strict';

const STORAGE_KEY = 'studentResultRecords_v1';
const PASS_MARK = 35;
const MAX_MARK = 100;
const SUBJECTS = [
  { id: 'mark1', name: 'HTML5 & CSS3' },
  { id: 'mark2', name: 'JavaScript' },
  { id: 'mark3', name: 'Database Management' },
  { id: 'mark4', name: 'Computer Networks' },
  { id: 'mark5', name: 'Programming' }
];

const form = document.getElementById('studentForm');
const formMessage = document.getElementById('formMessage');
const resultPanel = document.getElementById('resultPanel');
const recordsBody = document.getElementById('recordsBody');
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');
const deleteDialog = document.getElementById('deleteDialog');
let pendingDeleteId = null;
let toastTimeout = null;
let records = loadRecords();

function loadRecords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isValidStoredRecord) : [];
  } catch (error) {
    console.error('Could not load student records:', error);
    return [];
  }
}

function isValidStoredRecord(record) {
  return record && typeof record.id === 'string' &&
    typeof record.name === 'string' && typeof record.rollNumber === 'string' &&
    typeof record.email === 'string' && typeof record.course === 'string' &&
    Array.isArray(record.marks) && record.marks.length === SUBJECTS.length &&
    record.marks.every(mark => Number.isFinite(mark) && mark >= 0 && mark <= MAX_MARK) &&
    Number.isFinite(record.total) && Number.isFinite(record.percentage) &&
    (record.result === 'PASS' || record.result === 'FAIL');
}

function saveRecords() {
  try {
    // Convert the complete records array to JSON before storing it in Local Storage.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error('Could not save student records:', error);
    showToast('Unable to save. Check whether browser storage is available.');
    return false;
  }
}

function setError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}Error`);
  if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (errorElement) errorElement.textContent = message;
}

function clearErrors() {
  ['studentName', 'rollNumber', 'email', 'course', ...SUBJECTS.map(subject => subject.id)]
    .forEach(id => setError(id, ''));
  formMessage.textContent = '';
  formMessage.className = 'form-message';
}

function validateForm() {
  clearErrors();
  let valid = true;

  const name = document.getElementById('studentName').value.trim();
  const rollNumber = document.getElementById('rollNumber').value.trim();
  const email = document.getElementById('email').value.trim();
  const course = document.getElementById('course').value;

  if (name.length < 2) {
    setError('studentName', 'Enter a name with at least 2 characters.');
    valid = false;
  } else if (!/^[\p{L}\p{M} .'-]+$/u.test(name)) {
    setError('studentName', 'Use letters, spaces, apostrophes, dots or hyphens only.');
    valid = false;
  }

  if (!rollNumber) {
    setError('rollNumber', 'Roll number is required.');
    valid = false;
  } else if (records.some(record => record.rollNumber.toLowerCase() === rollNumber.toLowerCase())) {
    setError('rollNumber', 'This roll number is already registered.');
    valid = false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    setError('email', 'Enter a valid email address.');
    valid = false;
  }

  if (!course) {
    setError('course', 'Select a course.');
    valid = false;
  }

  const marks = [];
  SUBJECTS.forEach(subject => {
    const input = document.getElementById(subject.id);
    const rawValue = input.value.trim();
    const mark = Number(rawValue);
    if (rawValue === '' || !Number.isFinite(mark) || !Number.isInteger(mark) || mark < 0 || mark > MAX_MARK) {
      setError(subject.id, 'Enter a whole number from 0 to 100.');
      valid = false;
      marks.push(null);
    } else {
      marks.push(mark);
    }
  });

  return {
    valid,
    data: { name, rollNumber, email, course, marks }
  };
}

function createStudentRecord(data) {
  const total = data.marks.reduce((sum, mark) => sum + mark, 0);
  const percentage = (total / (SUBJECTS.length * MAX_MARK)) * 100;
  // Passing requires at least 35 marks in every subject, not just an overall percentage.
  const result = data.marks.every(mark => mark >= PASS_MARK) ? 'PASS' : 'FAIL';

  return {
    id: createId(),
    name: data.name,
    rollNumber: data.rollNumber,
    email: data.email,
    course: data.course,
    marks: data.marks,
    total,
    maximumTotal: SUBJECTS.length * MAX_MARK,
    percentage: Number(percentage.toFixed(2)),
    result,
    createdAt: new Date().toISOString()
  };
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `student-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function renderLatestResult(record) {
  resultPanel.classList.remove('hidden');
  document.getElementById('resultName').textContent = record.name;
  document.getElementById('resultRoll').textContent = record.rollNumber;
  document.getElementById('resultTotal').textContent = `${record.total} / ${record.maximumTotal}`;
  document.getElementById('resultPercentage').textContent = `${record.percentage.toFixed(2)}%`;

  const status = document.getElementById('resultStatus');
  status.textContent = record.result;
  status.classList.toggle('fail', record.result === 'FAIL');
  document.getElementById('percentageBar').style.width = `${Math.min(100, record.percentage)}%`;

  const subjectsHTML = SUBJECTS.map((subject, index) => {
    const mark = record.marks[index];
    const passed = mark >= PASS_MARK;
    return `<div class="subject-result">
      <span>${escapeHTML(subject.name)}</span>
      <strong>${mark}<small> / 100</small></strong>
      <span class="subject-status ${passed ? '' : 'fail'}">${passed ? 'Pass' : 'Below pass mark'}</span>
    </div>`;
  }).join('');
  document.getElementById('resultSubjects').innerHTML = subjectsHTML;

  const failedSubjects = SUBJECTS.filter((subject, index) => record.marks[index] < PASS_MARK).map(subject => subject.name);
  document.getElementById('resultExplanation').textContent = record.result === 'PASS'
    ? `Congratulations! The student scored at least ${PASS_MARK} marks in every subject.`
    : `The student did not meet the ${PASS_MARK}-mark minimum in: ${failedSubjects.join(', ')}.`;
}

function renderRecords() {
  const query = searchInput.value.trim().toLowerCase();
  const filteredRecords = records.filter(record =>
    [record.name, record.rollNumber, record.course, record.email]
      .some(value => value.toLowerCase().includes(query))
  );

  document.getElementById('studentCount').textContent = records.length;
  document.getElementById('passCount').textContent = records.filter(record => record.result === 'PASS').length;
  document.getElementById('failCount').textContent = records.filter(record => record.result === 'FAIL').length;
  document.getElementById('recordCountLabel').textContent =
    `${filteredRecords.length} ${filteredRecords.length === 1 ? 'record' : 'records'}`;

  if (filteredRecords.length === 0) {
    recordsBody.innerHTML = `<tr class="empty-row"><td colspan="7">${
      records.length ? 'No records match your search.' : 'No records yet. Register a student to get started.'
    }</td></tr>`;
    return;
  }

  recordsBody.innerHTML = filteredRecords.map(record => {
    const initials = record.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    return `<tr>
      <td><div class="student-cell"><span class="avatar">${escapeHTML(initials)}</span><div><strong>${escapeHTML(record.name)}</strong><small>${escapeHTML(record.email)}</small></div></div></td>
      <td>${escapeHTML(record.rollNumber)}</td>
      <td>${escapeHTML(record.course)}</td>
      <td><strong>${record.total}</strong> / ${record.maximumTotal}</td>
      <td>${record.percentage.toFixed(2)}%</td>
      <td><span class="table-status ${record.result === 'FAIL' ? 'fail' : ''}">${record.result}</span></td>
      <td><button class="delete-button" type="button" data-delete-id="${escapeHTML(record.id)}" aria-label="Delete ${escapeHTML(record.name)}">Delete</button></td>
    </tr>`;
  }).join('');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const validation = validateForm();

  if (!validation.valid) {
    formMessage.textContent = 'Please correct the highlighted fields before saving.';
    formMessage.className = 'form-message error';
    const firstInvalid = form.querySelector('[aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const record = createStudentRecord(validation.data);
  records.unshift(record);
  if (!saveRecords()) {
    records.shift();
    return;
  }

  renderLatestResult(record);
  renderRecords();
  formMessage.textContent = 'Result calculated and student record saved successfully.';
  formMessage.className = 'form-message success';
  resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('Student result saved to Local Storage.');
});

form.addEventListener('reset', () => {
  // Let the browser reset the controls first, then clear custom validation states.
  window.setTimeout(clearErrors, 0);
});

form.querySelectorAll('input, select').forEach(field => {
  field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true') setError(field.id, '');
  });
  field.addEventListener('change', () => {
    if (field.getAttribute('aria-invalid') === 'true') setError(field.id, '');
  });
});

searchInput.addEventListener('input', renderRecords);

recordsBody.addEventListener('click', event => {
  const button = event.target.closest('[data-delete-id]');
  if (!button) return;
  pendingDeleteId = button.dataset.deleteId;
  if (typeof deleteDialog.showModal === 'function') {
    deleteDialog.showModal();
  } else if (window.confirm('Delete this student record?')) {
    deleteRecord(pendingDeleteId);
  }
});

document.getElementById('confirmDeleteButton').addEventListener('click', event => {
  event.preventDefault();
  if (pendingDeleteId) deleteRecord(pendingDeleteId);
  pendingDeleteId = null;
  deleteDialog.close();
});

function deleteRecord(id) {
  const oldRecords = records;
  records = records.filter(record => record.id !== id);
  if (!saveRecords()) {
    records = oldRecords;
    return;
  }
  renderRecords();
  showToast('Student record deleted.');
}

document.getElementById('exportButton').addEventListener('click', () => {
  const json = JSON.stringify(records, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'student-results.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast('JSON export prepared.');
});

// Initial page render reads any previously saved JSON records from Local Storage.
renderRecords();
