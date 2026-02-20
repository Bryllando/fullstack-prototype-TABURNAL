const STORAGE_KEY = 'ipt_demo_v1';
let currentUser = null;

window.db = {
  accounts: [],    // mga account sa users
  departments: [], // mga departamento
  employees: [],   // mga empleyado
  requests: []     // mga request
};



// Kuhaa ang datos gikan sa localStorage
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Kung naay natignan, gamiton kini
      window.db = JSON.parse(stored);
    } else {
      // Kung wala pa, buhaton ang default nga datos
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

// Buhaton ang unang data kung bag-o pa ang app
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
    departments: [],
    employees: [],
    requests: []
  };
  saveToStorage();
}

// random id generator para sa mga record
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}




// I-update ang UI base kung naka-login ba o dili
function setAuthState(isAuth, user = null) {
  currentUser = user;

  if (isAuth && user) {

    document.body.classList.remove('not-authenticated');
    document.body.classList.add('authenticated');

    // Kung admin, ipakita pud ang admin-only nga mga butang
    if (user.role === 'Admin') {
      document.body.classList.add('is-admin');
    } else {
      document.body.classList.remove('is-admin');
    }

    // I-update ang ngalan sa navbar
    const usernameEl = document.getElementById('navbar-username');
    if (usernameEl) {
      usernameEl.textContent = user.firstName + ' ' + user.lastName;
    }
  } else {
    // Wala naka-login - ipakita ang logged-out nga estado
    document.body.classList.remove('authenticated');
    document.body.classList.add('not-authenticated');
    document.body.classList.remove('is-admin');
  }
}

// Susihon kung naka-login ba ang user gamit ang token sa localStorage
function checkAuth() {
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    // Pangitaon ang account base sa token
    const user = window.db.accounts.find(acc => acc.email === authToken);
    if (user && user.verified) {
      setAuthState(true, user);
      return true;
    }
  }
  // Wala naka-login
  setAuthState(false);
  return false;
}

// I-logout ang user - tanggalon ang token ug ibalik sa home
function logout() {
  localStorage.removeItem('auth_token');
  setAuthState(false);
  showToast('Logged out successfully', 'success');
  navigateTo('#/');
}




// Balhinon ang page pinaagi sa pag-usab sa URL hash
function navigateTo(hash) {
  window.location.hash = hash;
}


function handleRouting() {
  const hash = window.location.hash || '#/';
  const route = hash.substring(2);

  // Tukbon ang tanan nga page una
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });


  const isAuthenticated = checkAuth();

  // Mga page nga kinahanglan naka-login
  const protectedRoutes = ['profile', 'requests'];
  // Mga page para lang sa admin
  const adminRoutes = ['employees', 'departments', 'accounts'];

  // Kung wala naka-login ug moadto sa protected nga page
  if (protectedRoutes.includes(route) && !isAuthenticated) {
    showToast('Please login to access this page', 'warning');
    navigateTo('#/login');
    return;
  }

  // Kung moadto sa admin nga page
  if (adminRoutes.includes(route)) {
    if (!isAuthenticated) {
      showToast('Please login to access this page', 'warning');
      navigateTo('#/login');
      return;
    }
    // Dili admin? Balik sa home
    if (currentUser.role !== 'Admin') {
      showToast('Admin access required', 'danger');
      navigateTo('#/');
      return;
    }
  }

  // Pangitaon ang page element ug ipakita kini
  let pageId = route ? route + '-page' : 'home-page';
  const pageElement = document.getElementById(pageId);

  if (pageElement) {
    pageElement.classList.add('active');

    // Tawgon ang render function para sa matag page
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
    // Kung wala ang page, ipakita ang home
    document.getElementById('home-page').classList.add('active');
  }
}


// registration

function handleRegistration(e) {
  e.preventDefault(); // Dili i-refresh ang page

  // Kuhaon ang mga gitype sa form
  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName = document.getElementById('reg-lastname').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;

  // Susihon kung naay account na gamit kining email
  if (window.db.accounts.find(acc => acc.email === email)) {
    showToast('Email already registered', 'danger');
    return;
  }

  // Buhaton ang bag-o nga account - User role lang dayon, dili Admin
  const newAccount = {
    id: generateId(),
    firstName,
    lastName,
    email,
    password,
    role: 'User',
    verified: false
  };

  // Idugang sa database ug tipigan
  window.db.accounts.push(newAccount);
  saveToStorage();

  // Tipigan ang email para sa verification page
  localStorage.setItem('unverified_email', email);

  showToast('Registration successful! Please verify your email.', 'success');
  navigateTo('#/verify-email');
}


// email verification

function handleEmailVerification() {
  const email = localStorage.getItem('unverified_email');

  // Ipakita ang email sa verify page
  if (email) {
    document.getElementById('verify-email-display').textContent = email;
  }

  // Kung gi-click ang simulate button, i-verify dayon ang account
  document.getElementById('simulate-verify-btn').addEventListener('click', function () {
    const email = localStorage.getItem('unverified_email');
    const account = window.db.accounts.find(acc => acc.email === email);

    if (account) {
      // I-set ang verified nga true - pwede na mag-login karon
      account.verified = true;
      saveToStorage();
      localStorage.removeItem('unverified_email');
      showToast('Email verified successfully!', 'success');

      // Adto sa login page ug ipakita ang success message
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


// login

function handleLogin(e) {
  e.preventDefault(); // Dili i-refresh ang page

  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  // Pangitaon ang account - dapat tama ang email, password, ug verified
  const account = window.db.accounts.find(acc =>
    acc.email === email &&
    acc.password === password &&
    acc.verified === true // Dili pwede mag-login kung wala pa verified
  );

  if (account) {
    // Naka-login na! Tipigan ang token ug i-update ang UI
    localStorage.setItem('auth_token', email);
    setAuthState(true, account);
    showToast('Login successful!', 'success');
    navigateTo('#/profile');
  } else {
    // Sayop ang credentials o wala pa verified
    showToast('Invalid credentials or email not verified', 'danger');
  }
}


// pang profile page

// Ipakita ang impormasyon sa naka-login nga user
function renderProfile() {
  if (!currentUser) return;

  const profileContent = document.getElementById('profile-content');
  // I-inject ang HTML nga adunay datos sa user
  profileContent.innerHTML = `
        <p><strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Role:</strong> <span class="badge bg-${currentUser.role === 'Admin' ? 'danger' : 'primary'}">${currentUser.role}</span></p>
        <button class="btn btn-outline-primary mt-3" onclick="openEditProfileModal()">Edit Profile</button>
    `;
}


// edit profile 

// Ablihan ang modal ug pun-on ang datos sa user
function openEditProfileModal() {
  if (!currentUser) return;

  // I-fill ang form gamit ang datos sa currentUser
  document.getElementById('edit-profile-firstname').value = currentUser.firstName;
  document.getElementById('edit-profile-lastname').value = currentUser.lastName;
  document.getElementById('edit-profile-email').value = currentUser.email;
  document.getElementById('edit-profile-password').value = ''; // Blangko ang password field

  // Ipakita ang modal
  const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
  modal.show();
}

// I-save ang mga pagbabago sa profile
function handleEditProfileForm(e) {
  e.preventDefault();

  const firstName = document.getElementById('edit-profile-firstname').value.trim();
  const lastName = document.getElementById('edit-profile-lastname').value.trim();
  const email = document.getElementById('edit-profile-email').value.trim().toLowerCase();
  const password = document.getElementById('edit-profile-password').value;

  // Kung nag-usab ang email, susihon kung gigamit na ba kini sa lain
  if (email !== currentUser.email) {
    const existingAccount = window.db.accounts.find(acc => acc.email === email && acc.id !== currentUser.id);
    if (existingAccount) {
      showToast('Email already in use by another account', 'danger');
      return;
    }
  }

  // Pangitaon ang account sa database
  const accountIndex = window.db.accounts.findIndex(acc => acc.id === currentUser.id);
  if (accountIndex === -1) {
    showToast('Account not found', 'danger');
    return;
  }

  // I-update ang datos sa database
  window.db.accounts[accountIndex].firstName = firstName;
  window.db.accounts[accountIndex].lastName = lastName;
  window.db.accounts[accountIndex].email = email;

  // I-update ang password kung naay bag-o
  if (password) {
    window.db.accounts[accountIndex].password = password;
  }

  // Kung nag-usab ang email, i-update pud ang auth token
  if (email !== currentUser.email) {
    localStorage.setItem('auth_token', email);
  }

  // I-update ang currentUser object sa memory
  currentUser.firstName = firstName;
  currentUser.lastName = lastName;
  currentUser.email = email;
  if (password) {
    currentUser.password = password;
  }


  saveToStorage();
  setAuthState(true, currentUser);
  renderProfile();

  showToast('Profile updated successfully', 'success');


  const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
  modal.hide();

  e.target.reset();
}


// employees

// Ipakita ang lista sa mga empleyado
function renderEmployees() {
  const tbody = document.getElementById('employees-table-body');

  // Kung wala pay empleyado
  if (window.db.employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No employees yet.</td></tr>';
    return;
  }

  // Buhaton ang mga row para sa matag empleyado
  tbody.innerHTML = window.db.employees.map(emp => {
    // Pangitaon ang account ug departamento nga nalinkahan sa empleyado
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

  // I-update pud ang dropdown sa department sa modal
  populateDepartmentDropdown();
}

// Pun-on ang department dropdown sa Add Employee modal
function populateDepartmentDropdown() {
  const select = document.getElementById('employee-department');
  select.innerHTML = '<option value="">Select Department</option>' +
    window.db.departments.map(dept =>
      `<option value="${dept.id}">${dept.name}</option>`
    ).join('');
}

// I-save ang bag-o o gi-edit nga empleyado
function handleEmployeeForm(e) {
  e.preventDefault();

  const editId = document.getElementById('employee-edit-id').value;
  const employeeId = document.getElementById('employee-id').value.trim();
  const userEmail = document.getElementById('employee-email').value.trim().toLowerCase();
  const position = document.getElementById('employee-position').value.trim();
  const departmentId = document.getElementById('employee-department').value;
  const hireDate = document.getElementById('employee-hire-date').value;

  // Susihon kung naay account nga adunay kining email
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
    // Nag-edit - i-update ang existing nga empleyado
    const index = window.db.employees.findIndex(e => e.id === editId);
    window.db.employees[index] = { ...window.db.employees[index], ...employeeData };
    showToast('Employee updated successfully', 'success');
  } else {
    // Bag-o nga empleyado - idugang sa database
    employeeData.id = generateId();
    window.db.employees.push(employeeData);
    showToast('Employee added successfully', 'success');
  }

  saveToStorage();
  renderEmployees();

  // Sirhan ang modal ug i-reset ang form
  bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal')).hide();
  e.target.reset();
  document.getElementById('employee-edit-id').value = '';
}

// Pun-on ang modal ug i-edit ang empleyado
function editEmployee(id) {
  const employee = window.db.employees.find(e => e.id === id);
  if (!employee) return;

  // I-fill ang form gamit ang datos sa empleyado
  document.getElementById('employee-edit-id').value = employee.id;
  document.getElementById('employee-id').value = employee.employeeId;
  document.getElementById('employee-email').value = employee.userEmail;
  document.getElementById('employee-position').value = employee.position;
  document.getElementById('employee-department').value = employee.departmentId;
  document.getElementById('employee-hire-date').value = employee.hireDate;

  new bootstrap.Modal(document.getElementById('addEmployeeModal')).show();
}

// Tanggalon ang empleyado pagkahuman sa confirmation
function deleteEmployee(id) {
  if (confirm('Are you sure you want to delete this employee?')) {
    window.db.employees = window.db.employees.filter(e => e.id !== id);
    saveToStorage();
    renderEmployees();
    showToast('Employee deleted', 'success');
  }
}


// department

// Ipakita ang lista sa mga departamento
function renderDepartments() {
  const tbody = document.getElementById('departments-table-body');

  // Kung wala pay departamento
  if (window.db.departments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No departments yet.</td></tr>';
    return;
  }

  // Buhaton ang mga row para sa matag departamento
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

// I-save ang bag-o o gi-edit nga departamento
function handleDepartmentForm(e) {
  e.preventDefault();

  const editId = document.getElementById('department-edit-id').value;
  const name = document.getElementById('department-name').value.trim();
  const description = document.getElementById('department-description').value.trim();

  const deptData = { name, description };

  if (editId) {
    // Nag-edit - i-update ang existing
    const index = window.db.departments.findIndex(d => d.id === editId);
    window.db.departments[index] = { ...window.db.departments[index], ...deptData };
    showToast('Department updated successfully', 'success');
  } else {
    // Bag-o - idugang sa database
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

// Pun-on ang modal ug i-edit ang departamento
function editDepartment(id) {
  const dept = window.db.departments.find(d => d.id === id);
  if (!dept) return;

  document.getElementById('department-edit-id').value = dept.id;
  document.getElementById('department-name').value = dept.name;
  document.getElementById('department-description').value = dept.description;

  new bootstrap.Modal(document.getElementById('addDepartmentModal')).show();
}

// Tanggalon ang departamento - dili pwede kung naay empleyado
function deleteDepartment(id) {
  // Dili pwede i-delete kung naay empleyado sa departamento
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

// diri sapita kay pang admin accounts lang

// Ipakita ang tanan nga account
function renderAccounts() {
  const tbody = document.getElementById('accounts-table-body');

  // Buhaton ang row para sa matag account
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

// I-save ang bag-o o gi-edit nga account
function handleAccountForm(e) {
  e.preventDefault();

  const editId = document.getElementById('account-edit-id').value;
  const firstName = document.getElementById('account-firstname').value.trim();
  const lastName = document.getElementById('account-lastname').value.trim();
  const email = document.getElementById('account-email').value.trim().toLowerCase();
  const password = document.getElementById('account-password').value;
  const role = document.getElementById('account-role').value;
  const verified = document.getElementById('account-verified').checked;

  // Susihon kung naay account na gamit kining email (gawas sa gi-edit)
  const duplicate = window.db.accounts.find(acc => acc.email === email && acc.id !== editId);
  if (duplicate) {
    showToast('Email already exists', 'danger');
    return;
  }

  const accountData = { firstName, lastName, email, role, verified };

  if (editId) {
    // Nag-edit - i-update ang existing nga account
    const index = window.db.accounts.findIndex(a => a.id === editId);
    const existingAccount = window.db.accounts[index];

    // Kung blangko ang password, i-keep ang daan
    accountData.password = password || existingAccount.password;

    window.db.accounts[index] = { ...existingAccount, ...accountData };

    // Kung gi-edit ang kaugalingon nga account, i-update pud ang currentUser
    if (currentUser && currentUser.id === editId) {
      currentUser = window.db.accounts[index];
      setAuthState(true, currentUser);
    }

    showToast('Account updated successfully', 'success');
  } else {
    // Bag-o - kinahanglan adunay password
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

// Pun-on ang modal ug i-edit ang account
function editAccount(id) {
  const account = window.db.accounts.find(a => a.id === id);
  if (!account) return;

  document.getElementById('account-edit-id').value = account.id;
  document.getElementById('account-firstname').value = account.firstName;
  document.getElementById('account-lastname').value = account.lastName;
  document.getElementById('account-email').value = account.email;
  document.getElementById('account-password').value = ''; // Blangko para sa seguridad
  document.getElementById('account-role').value = account.role;
  document.getElementById('account-verified').checked = account.verified;

  new bootstrap.Modal(document.getElementById('addAccountModal')).show();
}

// I-reset ang password sa usa ka account
function resetPassword(id) {
  const newPassword = prompt('Enter new password (minimum 6 characters):');
  if (!newPassword) return;

  // Kinahanglan minimum 6 ka character ang password
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

// Tanggalon ang account - dili pwede i-delete ang kaugalingon
function deleteAccount(id) {
  // Dili pwede i-delete ang kaugalingong account
  if (currentUser && currentUser.id === id) {
    showToast('Cannot delete your own account', 'danger');
    return;
  }

  if (confirm('Are you sure you want to delete this account?')) {
    const account = window.db.accounts.find(a => a.id === id);

    // I-delete pud ang mga empleyado nga nalinkahan niini
    window.db.employees = window.db.employees.filter(e => e.userEmail !== account.email);

    // Tanggalon ang account
    window.db.accounts = window.db.accounts.filter(a => a.id !== id);

    saveToStorage();
    renderAccounts();
    showToast('Account deleted', 'success');
  }
}


// ang pagrequest sa user

// Ipakita ang mga request sa naka-login nga user
function renderRequests() {
  const container = document.getElementById('requests-content');

  // Ipakita lang ang mga request sa kaugalingon
  const userRequests = window.db.requests.filter(r => r.employeeEmail === currentUser.email);

  // Kung wala pay request
  if (userRequests.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <p>You have no requests yet.</p>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addRequestModal">Create One</button>
            </div>
        `;
    return;
  }

  // Ipakita ang mga request sa table
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

// I-submit ang bag-o nga request
function handleRequestForm(e) {
  e.preventDefault();

  const type = document.getElementById('request-type').value;
  const itemRows = document.querySelectorAll('.request-item-row');

  // Kuhaon ang tanan nga items gikan sa form
  const items = [];
  itemRows.forEach(row => {
    const name = row.querySelector('.item-name').value.trim();
    const qty = parseInt(row.querySelector('.item-qty').value);
    if (name && qty) {
      items.push({ name, qty });
    }
  });

  // Kinahanglan adunay labing menos usa ka item
  if (items.length === 0) {
    showToast('Please add at least one item', 'danger');
    return;
  }

  // Buhaton ang bag-o nga request object
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

  // I-reset ang item rows sa modal
  const container = document.getElementById('request-items-container');
  container.innerHTML = `
        <div class="input-group mb-2 request-item-row">
            <input type="text" class="form-control item-name" placeholder="Item name" required>
            <input type="number" class="form-control item-qty" placeholder="Qty" min="1" value="1" style="max-width: 80px;" required>
            <button type="button" class="btn btn-danger remove-item-btn" style="display: none;">×</button>
        </div>
    `;
}

// Idugang ang bag-o nga item row sa request form
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

  // I-update ang mga remove button
  updateRemoveButtons();
}

// Tanggalon ang usa ka item row
function removeRequestItem(btn) {
  btn.closest('.request-item-row').remove();
  updateRemoveButtons();
}

// I-update kung makita o dili ang mga remove button
function updateRemoveButtons() {
  const rows = document.querySelectorAll('.request-item-row');
  rows.forEach((row, index) => {
    const removeBtn = row.querySelector('.remove-item-btn');
    // Ipakita ang remove button kung adunay labaw sa usa ka row
    if (rows.length > 1) {
      removeBtn.style.display = 'block';
    } else {
      // Itago kung isa ra ang row - dili pwede zero items
      removeBtn.style.display = 'none';
    }
  });
}


// diri dapit kay toast - mga notification message nga makita sa ibabaw sa page 

// Ipakita ang notification message sa ibabaw
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  const toastId = 'toast-' + Date.now();

  // Pilion ang color base sa type
  const bgClass = {
    'success': 'bg-success',
    'danger': 'bg-danger',
    'warning': 'bg-warning',
    'info': 'bg-info'
  }[type] || 'bg-info';

  // Buhaton ang toast HTML
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

  // Tanggalon ang HTML pagkahuman mawala ang toast
  toastElement.addEventListener('hidden.bs.toast', function () {
    toastElement.remove();
  });
}



// diri dapit kay modal - limyohan ang modal forms pagkahuman gamiton



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

  // I-reset ang edit profile modal
  document.getElementById('editProfileModal').addEventListener('hidden.bs.modal', function () {
    document.getElementById('edit-profile-form').reset();
  });
}



// diri dapit kay gi initialization - PAG-SUGOD SA APP



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
  document.getElementById('edit-profile-form').addEventListener('submit', handleEditProfileForm);

  // Logout button
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
window.openEditProfileModal = openEditProfileModal;