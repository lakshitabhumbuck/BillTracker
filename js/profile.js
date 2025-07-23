document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = 'http://localhost:5000/api';

  // --- Navigation between settings sections ---
  const navLinks = document.querySelectorAll('.settings-nav a');
  const sections = document.querySelectorAll('.settings-section');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      navLinks.forEach(nav => nav.classList.remove('active'));
      link.classList.add('active');
      sections.forEach(section => section.classList.toggle('active', section.id === targetId));
    });
  });

  // --- Load and Populate Data ---
  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load profile');
      const user = await res.json();
      // Profile Form
      document.getElementById('firstName').value = user.first_name || '';
      document.getElementById('lastName').value = user.last_name || '';
      document.getElementById('email').value = user.email || '';
      document.getElementById('phone_number').value = user.phone_number || '';
      document.getElementById('profile-picture-preview').src = user.profile_picture_url || 'assets/user-placeholder.svg';
      // Notifications Form
      document.getElementById('notify_bills').checked = !!user.notify_bills;
      document.getElementById('notify_email').checked = !!user.notify_email;
      document.getElementById('notify_sms').checked = !!user.notify_sms;
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  // --- Form Handlers ---
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      firstName: document.getElementById('firstName').value,
      lastName: document.getElementById('lastName').value,
      phone_number: document.getElementById('phone_number').value,
      profile_picture_url: document.getElementById('profile-picture-preview').src,
    };
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Update failed');
      alert('Profile updated!');
    } catch (err) { alert('Failed to update profile.'); }
  });

  document.getElementById('notifications-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      notify_bills: document.getElementById('notify_bills').checked,
      notify_email: document.getElementById('notify_email').checked,
      notify_sms: document.getElementById('notify_sms').checked,
    };
    try {
      const res = await fetch(`${API_BASE_URL}/profile/notifications`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Update failed');
      alert('Notification preferences updated!');
    } catch (err) { alert('Failed to update preferences.'); }
  });

  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      currentPassword: document.getElementById('currentPassword').value,
      newPassword: document.getElementById('newPassword').value,
    };
    try {
      const res = await fetch(`${API_BASE_URL}/profile/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      alert('Password changed!');
      e.target.reset();
    } catch (err) { alert(err.message); }
  });
  
  document.getElementById('delete-account-btn').addEventListener('click', async () => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete');
      alert('Account deleted.');
      window.location.href = 'index.html';
    } catch (err) { alert('Failed to delete account.'); }
  });
  
  document.getElementById('profile-picture').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) new FileReader().readAsDataURL(file);
  });

  loadProfile();
}); 