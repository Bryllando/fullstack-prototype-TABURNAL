const STORAGE_KEY = 'ipt_demo_v1';
let currentUser = null;

// Database structure
window.db = {
  accounts: [],
  departments: [],
  employees: [],
  requests: []
};


function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      window.db = JSON.parse(stored);
    } else {

      seedDatabase();
    }
  } catch (error) {
    console.error('Error loading from storage:', error);
    seedDatabase();
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
  } catch (error) {
    console.error('Error saving to storage:', error);
    showToast('Error saving data', 'danger');
  }
}

function seedDatabase() {
  window.db = {
    accounts: [
      {
        id: generateId(),
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'Password123!',
        role: 'Admin',
        verified: true
      }
    ],
    departments: [
      {
        id: generateId(),
        name: 'Engineering',
        description: 'Software development team'
      },
      {
        id: generateId(),
        name: 'HR',
        description: 'Human Resources'
      }
    ],
    employees: [],
    requests: []
  };
  saveToStorage();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}



function setAuthState(isAuth, user = null) {
  currentUser = user;

  if (isAuth && user) {
    document.body.classList.remove('not-authenticated');
    document.body.classList.add('authenticated');

    if (user.role === 'Admin') {
      document.body.classList.add('is-admin');
    } else {
      document.body.classList.remove('is-admin');
    }

    // Update navbar username
    const usernameEl = document.getElementById('navbar-username');
    if (usernameEl) {
      usernameEl.textContent = user.firstName + ' ' + user.lastName;
    }
  } else {
    document.body.classList.remove('authenticated');
    document.body.classList.add('not-authenticated');
    document.body.classList.remove('is-admin');
  }
}

function checkAuth() {
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    const user = window.db.accounts.find(acc => acc.email === authToken);
    if (user && user.verified) {
      setAuthState(true, user);
      return true;
    }
  }
  setAuthState(false);
  return false;
}

function logout() {
  localStorage.removeItem('auth_token');
  setAuthState(false);
  showToast('Logged out successfully', 'success');
  navigateTo('#/');
}



function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  const hash = window.location.hash || '#/';
  const route = hash.substring(2);


  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });


  const isAuthenticated = checkAuth();


  const protectedRoutes = ['profile', 'requests'];
  const adminRoutes = ['employees', 'departments', 'accounts'];


  if (protectedRoutes.includes(route) && !isAuthenticated) {
    showToast('Please login to access this page', 'warning');
    navigateTo('#/login');
    return;
  }

  if (adminRoutes.includes(route)) {
    if (!isAuthenticated) {
      showToast('Please login to access this page', 'warning');
      navigateTo('#/login');
      return;
    }
    if (currentUser.role !== 'Admin') {
      showToast('Admin access required', 'danger');
      navigateTo('#/');
      return;
    }
  }


  let pageId = route ? route + '-page' : 'home-page';
  const pageElement = document.getElementById(pageId);

  if (pageElement) {
    pageElement.classList.add('active');


    switch (route) {
      case 'profile':
        renderProfile();
        break;
      case 'employees':
        renderEmployees();
        break;
      case 'departments':
        renderDepartments();
        break;
      case 'accounts':
        renderAccounts();
        break;
      case 'requests':
        renderRequests();
        break;
    }
  } else {

    document.getElementById('home-page').classList.add('active');
  }
}

function handleRegistration(e) {
  e.preventDefault();

  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName = document.getElementById('reg-lastname').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;


  if (window.db.accounts.find(acc => acc.email === email)) {
    showToast('Email already registered', 'danger');
    return;
  }


  const newAccount = {
    id: generateId(),
    firstName,
    lastName,
    email,
    password,
    role: 'Admin',
    verified: false
  };

  window.db.accounts.push(newAccount);
  saveToStorage();


  localStorage.setItem('unverified_email', email);

  showToast('Registration successful! Please verify your email.', 'success');
  navigateTo('#/verify-email');
}



function handleEmailVerification() {
  const email = localStorage.getItem('unverified_email');

  if (email) {
    document.getElementById('verify-email-display').textContent = email;
  }

  document.getElementById('simulate-verify-btn').addEventListener('click', function () {
    const email = localStorage.getItem('unverified_email');
    const account = window.db.accounts.find(acc => acc.email === email);

    if (account) {
      account.verified = true;
      saveToStorage();
      localStorage.removeItem('unverified_email');
      showToast('Email verified successfully!', 'success');


      navigateTo('#/login');
      setTimeout(() => {
        const successMsg = document.getElementById('login-success-msg');
        if (successMsg) {
          successMsg.style.display = 'block';
        }
      }, 100);
    }
  });
}



function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  const account = window.db.accounts.find(acc =>
    acc.email === email &&
    acc.password === password &&
    acc.verified === true
  );

  if (account) {
    localStorage.setItem('auth_token', email);
    setAuthState(true, account);
    showToast('Login successful!', 'success');
    navigateTo('#/profile');
  } else {
    showToast('Invalid credentials or email not verified', 'danger');
  }
}



function renderProfile() {
  if (!currentUser) return;

  const profileContent = document.getElementById('profile-content');
  profileContent.innerHTML = `
        <p><strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Role:</strong> <span class="badge bg-${currentUser.role === 'Admin' ? 'danger' : 'primary'}">${currentUser.role}</span></p>
        <button class="btn btn-outline-primary mt-3" onclick="alert('Edit profile functionality would go here')">Edit Profile</button>
    `;
}



function renderEmployees() {
  const tbody = document.getElementById('employees-table-body');

  if (window.db.employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No employees yet.</td></tr>';
    return;
  }

  tbody.innerHTML = window.db.employees.map(emp => {
    const account = window.db.accounts.find(acc => acc.email === emp.userEmail);
    const dept = window.db.departments.find(d => d.id === emp.departmentId);
    const userName = account ? `${account.firstName} ${account.lastName}` : emp.userEmail;

    return `
            <tr>
                <td>${emp.employeeId}</td>
                <td>${userName}</td>
                <td>${emp.position}</td>
                <td>${dept ? dept.name : 'N/A'}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary" onclick="editEmployee('${emp.id}')">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee('${emp.id}')">Delete</button>
                </td>
            </tr>
        `;
  }).join('');


  populateDepartmentDropdown();
}

function populateDepartmentDropdown() {
  const select = document.getElementById('employee-department');
  select.innerHTML = '<option value="">Select Department</option>' +
    window.db.departments.map(dept =>
      `<option value="${dept.id}">${dept.name}</option>`
    ).join('');
}

function handleEmployeeForm(e) {
  e.preventDefault();

  const editId = document.getElementById('employee-edit-id').value;
  const employeeId = document.getElementById('employee-id').value.trim();
  const userEmail = document.getElementById('employee-email').value.trim().toLowerCase();
  const position = document.getElementById('employee-position').value.trim();
  const departmentId = document.getElementById('employee-department').value;
  const hireDate = document.getElementById('employee-hire-date').value;


  if (!window.db.accounts.find(acc => acc.email === userEmail)) {
    showToast('User email must match an existing account', 'danger');
    return;
  }

  const employeeData = {
    employeeId,
    userEmail,
    position,
    departmentId,
    hireDate
  };

  if (editId) {

    const index = window.db.employees.findIndex(e => e.id === editId);
    window.db.employees[index] = { ...window.db.employees[index], ...employeeData };
    showToast('Employee updated successfully', 'success');
  } else {

    employeeData.id = generateId();
    window.db.employees.push(employeeData);
    showToast('Employee added successfully', 'success');
  }

  saveToStorage();
  renderEmployees();


  bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal')).hide();
  e.target.reset();
  document.getElementById('employee-edit-id').value = '';
}

function editEmployee(id) {
  const employee = window.db.employees.find(e => e.id === id);
  if (!employee) return;

  document.getElementById('employee-edit-id').value = employee.id;
  document.getElementById('employee-id').value = employee.employeeId;
  document.getElementById('employee-email').value = employee.userEmail;
  document.getElementById('employee-position').value = employee.position;
  document.getElementById('employee-department').value = employee.departmentId;
  document.getElementById('employee-hire-date').value = employee.hireDate;

  new bootstrap.Modal(document.getElementById('addEmployeeModal')).show();
}

function deleteEmployee(id) {
  if (confirm('Are you sure you want to delete this employee?')) {
    window.db.employees = window.db.employees.filter(e => e.id !== id);
    saveToStorage();
    renderEmployees();
    showToast('Employee deleted', 'success');
  }
}



function renderDepartments() {
  const tbody = document.getElementById('departments-table-body');

  if (window.db.departments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No departments yet.</td></tr>';
    return;
  }

  tbody.innerHTML = window.db.departments.map(dept => `
        <tr>
            <td>${dept.name}</td>
            <td>${dept.description}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-outline-primary" onclick="editDepartment('${dept.id}')">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment('${dept.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function handleDepartmentForm(e) {
  e.preventDefault();

  const editId = document.getElementById('department-edit-id').value;
  const name = document.getElementById('department-name').value.trim();
  const description = document.getElementById('department-description').value.trim();

  const deptData = { name, description };

  if (editId) {
    const index = window.db.departments.findIndex(d => d.id === editId);
    window.db.departments[index] = { ...window.db.departments[index], ...deptData };
    showToast('Department updated successfully', 'success');
  } else {
    deptData.id = generateId();
    window.db.departments.push(deptData);
    showToast('Department added successfully', 'success');
  }

  saveToStorage();
  renderDepartments();

  bootstrap.Modal.getInstance(document.getElementById('addDepartmentModal')).hide();
  e.target.reset();
  document.getElementById('department-edit-id').value = '';
}

function editDepartment(id) {
  const dept = window.db.departments.find(d => d.id === id);
  if (!dept) return;

  document.getElementById('department-edit-id').value = dept.id;
  document.getElementById('department-name').value = dept.name;
  document.getElementById('department-description').value = dept.description;

  new bootstrap.Modal(document.getElementById('addDepartmentModal')).show();
}

function deleteDepartment(id) {

  const hasEmployees = window.db.employees.some(e => e.departmentId === id);
  if (hasEmployees) {
    showToast('Cannot delete department with employees', 'danger');
    return;
  }

  if (confirm('Are you sure you want to delete this department?')) {
    window.db.departments = window.db.departments.filter(d => d.id !== id);
    saveToStorage();
    renderDepartments();
    showToast('Department deleted', 'success');
  }
}



function renderAccounts() {
  const tbody = document.getElementById('accounts-table-body');

  tbody.innerHTML = window.db.accounts.map(acc => `
        <tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td><span class="badge bg-${acc.role === 'Admin' ? 'danger' : 'primary'}">${acc.role}</span></td>
            <td>
                ${acc.verified ?
      '<span class="verified-icon">✓</span>' :
      '<span class="not-verified-icon">✗</span>'}
            </td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-outline-primary" onclick="editAccount('${acc.id}')">Edit</button>
                <button class="btn btn-sm btn-outline-warning" onclick="resetPassword('${acc.id}')">Reset Password</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount('${acc.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function handleAccountForm(e) {
  e.preventDefault();

  const editId = document.getElementById('account-edit-id').value;
  const firstName = document.getElementById('account-firstname').value.trim();
  const lastName = document.getElementById('account-lastname').value.trim();
  const email = document.getElementById('account-email').value.trim().toLowerCase();
  const password = document.getElementById('account-password').value;
  const role = document.getElementById('account-role').value;
  const verified = document.getElementById('account-verified').checked;


  const duplicate = window.db.accounts.find(acc => acc.email === email && acc.id !== editId);
  if (duplicate) {
    showToast('Email already exists', 'danger');
    return;
  }

  const accountData = { firstName, lastName, email, role, verified };

  if (editId) {
    const index = window.db.accounts.findIndex(a => a.id === editId);
    const existingAccount = window.db.accounts[index];


    accountData.password = password || existingAccount.password;

    window.db.accounts[index] = { ...existingAccount, ...accountData };

    if (currentUser && currentUser.id === editId) {
      currentUser = window.db.accounts[index];
      setAuthState(true, currentUser);
    }

    showToast('Account updated successfully', 'success');
  } else {
    if (!password) {
      showToast('Password is required for new accounts', 'danger');
      return;
    }
    accountData.id = generateId();
    accountData.password = password;
    window.db.accounts.push(accountData);
    showToast('Account created successfully', 'success');
  }

  saveToStorage();
  renderAccounts();

  bootstrap.Modal.getInstance(document.getElementById('addAccountModal')).hide();
  e.target.reset();
  document.getElementById('account-edit-id').value = '';
}

function editAccount(id) {
  const account = window.db.accounts.find(a => a.id === id);
  if (!account) return;

  document.getElementById('account-edit-id').value = account.id;
  document.getElementById('account-firstname').value = account.firstName;
  document.getElementById('account-lastname').value = account.lastName;
  document.getElementById('account-email').value = account.email;
  document.getElementById('account-password').value = '';
  document.getElementById('account-role').value = account.role;
  document.getElementById('account-verified').checked = account.verified;

  new bootstrap.Modal(document.getElementById('addAccountModal')).show();
}

function resetPassword(id) {
  const newPassword = prompt('Enter new password (minimum 6 characters):');
  if (!newPassword) return;

  if (newPassword.length < 6) {
    showToast('Password must be at least 6 characters', 'danger');
    return;
  }

  const account = window.db.accounts.find(a => a.id === id);
  if (account) {
    account.password = newPassword;
    saveToStorage();
    showToast('Password reset successfully', 'success');
  }
}

function deleteAccount(id) {

  if (currentUser && currentUser.id === id) {
    showToast('Cannot delete your own account', 'danger');
    return;
  }

  if (confirm('Are you sure you want to delete this account?')) {
    const account = window.db.accounts.find(a => a.id === id);


    window.db.employees = window.db.employees.filter(e => e.userEmail !== account.email);


    window.db.accounts = window.db.accounts.filter(a => a.id !== id);

    saveToStorage();
    renderAccounts();
    showToast('Account deleted', 'success');
  }
}


function renderRequests() {
  const container = document.getElementById('requests-content');

  const userRequests = window.db.requests.filter(r => r.employeeEmail === currentUser.email);

  if (userRequests.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <p>You have no requests yet.</p>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addRequestModal">Create One</button>
            </div>
        `;
    return;
  }

  container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Items</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${userRequests.map(req => `
                        <tr>
                            <td>${new Date(req.date).toLocaleDateString()}</td>
                            <td>${req.type}</td>
                            <td>
                                ${req.items.map(item => `${item.name} (${item.qty})`).join(', ')}
                            </td>
                            <td>
                                <span class="badge status-${req.status.toLowerCase()}">${req.status}</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function handleRequestForm(e) {
  e.preventDefault();

  const type = document.getElementById('request-type').value;
  const itemRows = document.querySelectorAll('.request-item-row');

  const items = [];
  itemRows.forEach(row => {
    const name = row.querySelector('.item-name').value.trim();
    const qty = parseInt(row.querySelector('.item-qty').value);
    if (name && qty) {
      items.push({ name, qty });
    }
  });

  if (items.length === 0) {
    showToast('Please add at least one item', 'danger');
    return;
  }

  const request = {
    id: generateId(),
    type,
    items,
    status: 'Pending',
    date: new Date().toISOString(),
    employeeEmail: currentUser.email
  };

  window.db.requests.push(request);
  saveToStorage();
  renderRequests();

  showToast('Request submitted successfully', 'success');

  bootstrap.Modal.getInstance(document.getElementById('addRequestModal')).hide();
  e.target.reset();


  const container = document.getElementById('request-items-container');
  container.innerHTML = `
        <div class="input-group mb-2 request-item-row">
            <input type="text" class="form-control item-name" placeholder="Item name" required>
            <input type="number" class="form-control item-qty" placeholder="Qty" min="1" value="1" style="max-width: 80px;" required>
            <button type="button" class="btn btn-danger remove-item-btn" style="display: none;">×</button>
        </div>
    `;
}

function addRequestItem() {
  const container = document.getElementById('request-items-container');
  const newRow = document.createElement('div');
  newRow.className = 'input-group mb-2 request-item-row';
  newRow.innerHTML = `
        <input type="text" class="form-control item-name" placeholder="Item name" required>
        <input type="number" class="form-control item-qty" placeholder="Qty" min="1" value="1" style="max-width: 80px;" required>
        <button type="button" class="btn btn-danger remove-item-btn" onclick="removeRequestItem(this)">×</button>
    `;
  container.appendChild(newRow);


  updateRemoveButtons();
}

function removeRequestItem(btn) {
  btn.closest('.request-item-row').remove();
  updateRemoveButtons();
}

function updateRemoveButtons() {
  const rows = document.querySelectorAll('.request-item-row');
  rows.forEach((row, index) => {
    const removeBtn = row.querySelector('.remove-item-btn');
    if (rows.length > 1) {
      removeBtn.style.display = 'block';
    } else {
      removeBtn.style.display = 'none';
    }
  });
}



function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  const toastId = 'toast-' + Date.now();

  const bgClass = {
    'success': 'bg-success',
    'danger': 'bg-danger',
    'warning': 'bg-warning',
    'info': 'bg-info'
  }[type] || 'bg-info';

  const toastHTML = `
        <div id="${toastId}" class="toast" role="alert">
            <div class="toast-header ${bgClass} text-white">
                <strong class="me-auto">Notification</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

  toastContainer.insertAdjacentHTML('beforeend', toastHTML);

  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();


  toastElement.addEventListener('hidden.bs.toast', function () {
    toastElement.remove();
  });
}



function resetModals() {

  document.getElementById('addEmployeeModal').addEventListener('hidden.bs.modal', function () {
    document.getElementById('employee-form').reset();
    document.getElementById('employee-edit-id').value = '';
  });


  document.getElementById('addDepartmentModal').addEventListener('hidden.bs.modal', function () {
    document.getElementById('department-form').reset();
    document.getElementById('department-edit-id').value = '';
  });


  document.getElementById('addAccountModal').addEventListener('hidden.bs.modal', function () {
    document.getElementById('account-form').reset();
    document.getElementById('account-edit-id').value = '';
  });


  document.getElementById('addRequestModal').addEventListener('hidden.bs.modal', function () {
    document.getElementById('request-form').reset();
    const container = document.getElementById('request-items-container');
    container.innerHTML = `
            <div class="input-group mb-2 request-item-row">
                <input type="text" class="form-control item-name" placeholder="Item name" required>
                <input type="number" class="form-control item-qty" placeholder="Qty" min="1" value="1" style="max-width: 80px;" required>
                <button type="button" class="btn btn-danger remove-item-btn" style="display: none;">×</button>
            </div>
        `;
  });
}



document.addEventListener('DOMContentLoaded', function () {

  loadFromStorage();


  window.addEventListener('hashchange', handleRouting);


  if (!window.location.hash) {
    window.location.hash = '#/';
  }
  handleRouting();


  document.getElementById('register-form').addEventListener('submit', handleRegistration);
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('employee-form').addEventListener('submit', handleEmployeeForm);
  document.getElementById('department-form').addEventListener('submit', handleDepartmentForm);
  document.getElementById('account-form').addEventListener('submit', handleAccountForm);
  document.getElementById('request-form').addEventListener('submit', handleRequestForm);


  document.getElementById('logout-btn').addEventListener('click', function (e) {
    e.preventDefault();
    logout();
  });


  document.getElementById('add-item-btn').addEventListener('click', addRequestItem);


  handleEmailVerification();


  resetModals();
});


window.navigateTo = navigateTo;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.editDepartment = editDepartment;
window.deleteDepartment = deleteDepartment;
window.editAccount = editAccount;
window.resetPassword = resetPassword;
window.deleteAccount = deleteAccount;
window.removeRequestItem = removeRequestItem;