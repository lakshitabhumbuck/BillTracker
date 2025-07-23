// --- Globals ---
const API_BASE_URL = 'http://localhost:5000/api';

// --- Main Logic ---
document.addEventListener('DOMContentLoaded', function () {

  // --- Dashboard/Home Page Specific Logic ---
  const getStartedBtn = document.getElementById('get-started-btn');
  const dashboardSection = document.querySelector('.dashboard');
  if (getStartedBtn && dashboardSection) {
    // Smooth scroll to dashboard on Get Started button click
    getStartedBtn.addEventListener('click', () => dashboardSection.scrollIntoView({ behavior: 'smooth' }));
  }
  
  const alerts = document.querySelectorAll('.dashboard-alerts .alert');
  alerts.forEach(alert => {
    alert.addEventListener('click', () => alert.style.display = 'none');
  });

  // --- Manage Cards Page Specific Logic ---
  if (document.querySelector('.credit-cards-module')) {
    loadAndRenderCards();
  }

  async function loadAndRenderCards() {
    const cardsContainer = document.querySelector('.cards-list');
    if (!cardsContainer) return;

    const response = await fetch(`${API_BASE_URL}/cards`);
    const cards = await response.json();

    cardsContainer.innerHTML = '';
    if (cards.length === 0) {
      cardsContainer.innerHTML = '<p>No cards found. Please add a new card.</p>';
      return;
    }

    cards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = `card-item ${card.card_company.toLowerCase()}`;
      cardEl.innerHTML = `
        <div class="card-item-header">
          <h3>${card.card_company} Card</h3>
          <span class="card-number">${card.card_number}</span>
        </div>
        <div class="card-item-body">
          <p><strong>Holder:</strong> ${card.card_holder}</p>
          <p><strong>Expires:</strong> ${card.expiry_month}/${card.expiry_year}</p>
        </div>
        <div class="card-item-footer">
          <button class="delete-card-btn" data-id="${card.id}">Delete</button>
        </div>
      `;
      cardEl.querySelector('.delete-card-btn').addEventListener('click', () => deleteCard(card.id));
      cardsContainer.appendChild(cardEl);
    });
  }

  async function deleteCard(id) {
    if (confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/cards/${id}`, { method: 'DELETE' });
        if(response.ok) {
            loadAndRenderCards();
        } else {
            alert('Failed to delete card.');
        }
      } catch (error) {
        console.error('Error deleting card:', error);
        alert('An error occurred. Please try again.');
      }
    }
  }

  // --- Add Card Page Specific Logic ---
  if (document.querySelector('.add-card-container')) {
    const cardCompanyInput = document.getElementById('card-company-input');
    const cardNumberInput = document.getElementById('card-number-input');
    const cardHolderInput = document.getElementById('card-holder-input');
    const expiryMonthInput = document.getElementById('expiry-month-input');
    const expiryYearInput = document.getElementById('expiry-year-input');
    const cvvInput = document.getElementById('card-cvv-input');
    
    const cardNumberPreview = document.getElementById('card-number-preview');
    const cardHolderPreview = document.getElementById('card-holder-preview');
    const cardExpiryPreview = document.getElementById('card-expiry-preview');
    const cardCvvPreview = document.getElementById('card-cvv-preview');
    const cardPreview = document.getElementById('card-preview');
    const cardLogo = document.getElementById('card-logo');

    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      const year = currentYear + i;
      const option = document.createElement('option');
      option.value = year.toString().slice(-2);
      option.textContent = year;
      expiryYearInput.appendChild(option);
    }
    
    cardCompanyInput.addEventListener('change', () => {
        const company = cardCompanyInput.value.toLowerCase();
        if (company === 'visa' || company === 'mastercard' || company === 'rupay') {
            cardLogo.src = `assets/${company}-logo.svg`; // Assuming you have these logos
            cardLogo.style.display = 'block';
        } else {
            cardLogo.style.display = 'none';
        }
    });

    cardNumberInput.addEventListener('input', () => {
      let value = cardNumberInput.value.replace(/\D/g, '').substring(0, 16);
      value = value.replace(/(.{4})/g, '$1 ').trim();
      cardNumberInput.value = value;
      cardNumberPreview.textContent = value || '#### #### #### ####';
    });

    cardHolderInput.addEventListener('input', () => {
      cardHolderPreview.textContent = cardHolderInput.value.toUpperCase() || 'YOUR NAME';
    });

    expiryMonthInput.addEventListener('input', updateExpiry);
    expiryYearInput.addEventListener('input', updateExpiry);

    function updateExpiry() {
      const month = expiryMonthInput.value || 'MM';
      const year = expiryYearInput.value || 'YY';
      cardExpiryPreview.textContent = `${month}/${year}`;
    }

    cvvInput.addEventListener('focus', () => cardPreview.classList.add('flipped'));
    cvvInput.addEventListener('blur', () => cardPreview.classList.remove('flipped'));
    cvvInput.addEventListener('input', () => {
      cardCvvPreview.textContent = cvvInput.value;
    });

    document.getElementById('add-card-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const cardData = {
        card_company: cardCompanyInput.value,
        card_number: cardNumberInput.value,
        card_holder: cardHolderInput.value,
        expiry_month: expiryMonthInput.value,
        expiry_year: expiryYearInput.value,
        cvv: cvvInput.value
      };

      try {
        const response = await fetch(`${API_BASE_URL}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cardData)
        });
        if(response.ok) {
            alert('Card added successfully!');
            window.location.href = 'manage-cards.html';
        } else {
            alert('Failed to add card. Please check your details.');
        }
      } catch (error) {
          console.error('Error adding card:', error);
          alert('An error occurred while adding the card.');
      }
    });
  }

  // --- Smart Insights Page Specific Logic ---
  if (document.querySelector('.insights-module')) {
    // Set default to January 2025
    document.getElementById('insights-year').value = '2025';
    document.getElementById('insights-month').value = '1';
    
    // Load initial charts
    fetchAndRenderInsights();
    
    // Add event listener for update button
    document.getElementById('update-insights-btn').addEventListener('click', fetchAndRenderInsights);
  }
  
  async function fetchAndRenderInsights() {
      const year = document.getElementById('insights-year').value;
      const month = document.getElementById('insights-month').value;
      
      try {
        // Fetch category data with month/year filter
        const categoryResponse = await fetch(`${API_BASE_URL}/insights/spending-by-category?year=${year}&month=${month}`);
        const categoryData = await categoryResponse.json();

        // Fetch vendor data with month/year filter
        const vendorResponse = await fetch(`${API_BASE_URL}/insights/spending-by-vendor?year=${year}&month=${month}`);
        const vendorData = await vendorResponse.json();

        // Render all charts
        const categoryLabels = categoryData.map(d => d.category);
        const categoryValues = categoryData.map(d => d.total);
        
        const vendorLabels = vendorData.map(d => d.vendor);
        const vendorValues = vendorData.map(d => d.total);

        // Render pie charts
        renderPieChart('category-pie-chart', categoryLabels, categoryValues, `Spending by Category - ${getMonthName(month)} ${year}`);
        renderPieChart('vendor-pie-chart', vendorLabels, vendorValues, `Spending by Vendor - ${getMonthName(month)} ${year}`);

        // Render bar charts
        renderBarChart('category-bar-chart', categoryLabels, categoryValues, `Spending by Category - ${getMonthName(month)} ${year}`);
        renderBarChart('vendor-bar-chart', vendorLabels, vendorValues, `Spending by Vendor - ${getMonthName(month)} ${year}`);

      } catch (error) {
          console.error('Error fetching insights:', error);
          // Show error message in all chart containers
          ['category-pie-chart', 'vendor-pie-chart', 'category-bar-chart', 'vendor-bar-chart'].forEach(id => {
            const container = document.getElementById(id);
            if (container) {
              container.innerHTML = '<p>Could not load chart data.</p>';
            }
          });
      }
  }

  function getMonthName(month) {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(month)];
  }

  function renderPieChart(containerId, labels, data, title) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const canvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(canvas);

    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: title
                }
            }
        }
    });
  }

  function renderBarChart(containerId, labels, data, title) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const canvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(canvas);

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: title
                }
            }
        }
    });
  }

  // --- View Statements Page Specific Logic ---
  if (document.querySelector('.statements-module')) {
    const yearSelect = document.getElementById('statement-year');
    const monthSelect = document.getElementById('statement-month');
    const getBtn = document.getElementById('get-statement-btn');

    // Populate year and month dropdowns
    const currentYear = new Date().getFullYear();
    for(let i=-2; i<3; i++) { // Show some future years too
        const year = currentYear + i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    months.forEach((month, i) => {
        const option = document.createElement('option');
        option.value = i + 1;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
    
    // Set default to April 2025 to show sample data
    yearSelect.value = '2025';
    monthSelect.value = '4';

    getBtn.addEventListener('click', fetchAndRenderStatements);
    
    // Load initial data on page load
    fetchAndRenderStatements();

    async function fetchAndRenderStatements() {
      const year = yearSelect.value;
      const month = monthSelect.value;
      const tbody = document.getElementById('statement-tbody');
      
      try {
        const response = await fetch(`${API_BASE_URL}/transactions?year=${year}&month=${month}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const transactions = await response.json();
        
        tbody.innerHTML = ''; // Clear previous results
        if(transactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No transactions found for this period.</td></tr>`;
            return;
        }

        transactions.forEach(tx => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(tx.date).toLocaleDateString()}</td>
                <td>${tx.vendor}</td>
                <td><span class="category-badge">${tx.category}</span></td>
                <td class="${tx.type.toLowerCase()}">${tx.type === 'Credit' ? '+' : '-'} ₹${tx.amount}</td>
                <td>${tx.type}</td>
            `;
            tbody.appendChild(row);
        });

      } catch (error) {
        console.error('Error fetching statements:', error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Failed to load transactions.</td></tr>`;
      }
    }
  }

  // --- Bills Page Specific Logic ---
  if (document.querySelector('.bills-module')) {
    let billsData = [];
    let editingBillId = null;

    const billModal = document.getElementById('bill-modal');
    const addBillBtn = document.getElementById('add-bill-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const billForm = document.getElementById('bill-form');

    function renderBills(billsToRender, filter = 'all') {
      const billsGrid = document.getElementById('bills-grid');
      if (!billsGrid) return;
      billsGrid.innerHTML = '';

      const filteredBills = billsToRender.filter(bill => {
        if (filter === 'all') return true;
        if (filter === 'paid') return bill.status.toLowerCase() === 'paid';
        if (filter === 'unpaid') return bill.status.toLowerCase() === 'unpaid';
        if (filter === 'upcoming') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return bill.status.toLowerCase() === 'unpaid' && new Date(bill.due_date) >= today;
        }
        return false;
      });

      if (filteredBills.length === 0) {
        billsGrid.innerHTML = '<p class="no-bills-message">No bills match the selected filter.</p>';
        return;
      }

      filteredBills.forEach(bill => {
        const billCard = document.createElement('div');
        let statusText = bill.status;
        let statusClass = bill.status.toLowerCase();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(bill.due_date);

        if (statusClass === 'unpaid' && dueDate >= today) {
            statusText = 'Upcoming';
            statusClass = 'upcoming';
        }

        billCard.className = `bill-card ${statusClass}`;
        billCard.dataset.billId = bill.id;
        const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(bill.amount);

        billCard.innerHTML = `
          <div class="bill-card-header">
            <span class="bill-card-category">${bill.category}</span>
            <span class="status ${statusClass}">${statusText}</span>
          </div>
          <div class="bill-card-body">
            <h3>${bill.name}</h3>
            <p class="amount">${formattedAmount}</p>
          </div>
          <div class="bill-card-footer">
            <span class="due-date">Due: ${new Date(bill.due_date).toLocaleDateString()}</span>
            <div class="bill-actions">
              <button class="edit-btn" onclick="openEditModal(${bill.id})"><i class="fas fa-pencil-alt"></i></button>
              <button class="delete-btn" onclick="deleteBill(${bill.id})"><i class="fas fa-trash-alt"></i></button>
            </div>
          </div>
        `;
        billsGrid.appendChild(billCard);
      });
    }

    function renderCalendar(bills) {
      const calendarGrid = document.getElementById('calendar-grid');
      const monthYearEl = document.getElementById('month-year');
      if (!calendarGrid || !monthYearEl) return;
    
      const today = new Date();
      let currentDate = new Date(monthYearEl.dataset.year || today.getFullYear(), monthYearEl.dataset.month || today.getMonth());
    
      monthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
      monthYearEl.dataset.year = currentDate.getFullYear();
      monthYearEl.dataset.month = currentDate.getMonth();
    
      calendarGrid.innerHTML = '';
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.forEach(day => {
        const dayNameEl = document.createElement('div');
        dayNameEl.className = 'day-name';
        dayNameEl.textContent = day;
        calendarGrid.appendChild(dayNameEl);
      });
    
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
    
      for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day is-other-month';
        calendarGrid.appendChild(emptyCell);
      }
    
      for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.innerHTML = `<div class="calendar-day-header">${day}</div>`;
        const dayDate = new Date(year, month, day);
    
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
          dayCell.classList.add('is-today');
        }
    
        const billsForDay = bills.filter(bill => {
          const dueDate = new Date(bill.due_date);
          return dueDate.getDate() === day && dueDate.getMonth() === month && dueDate.getFullYear() === year;
        });
    
        billsForDay.forEach(bill => {
          const billItem = document.createElement('div');
          billItem.className = 'bill-item';
          if(bill.status.toLowerCase() === 'paid') billItem.classList.add('paid');
          billItem.textContent = bill.name;
          dayCell.appendChild(billItem);
        });
    
        calendarGrid.appendChild(dayCell);
      }
    }

    function setupEventListeners() {
      // Filter buttons
      const filterButtons = document.querySelectorAll('.filter-btn');
      filterButtons.forEach(button => {
        button.addEventListener('click', () => {
          filterButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          const activeFilter = button.dataset.filter;
          renderBills(billsData, activeFilter);
        });
      });

      // View toggle buttons
      const viewButtons = document.querySelectorAll('.view-btn');
      const billsListContainer = document.getElementById('bills-list-container');
      const calendarContainer = document.getElementById('bills-calendar-container');

      viewButtons.forEach(button => {
        button.addEventListener('click', () => {
          viewButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');

          const isListView = button.dataset.view === 'list';
          billsListContainer.style.display = isListView ? 'block' : 'none';
          calendarContainer.style.display = isListView ? 'none' : 'block';
          
          if (!isListView) {
            renderCalendar(billsData);
          }
        });
      });
      
      // Calendar controls
      const prevMonthBtn = document.getElementById('prev-month-btn');
      const nextMonthBtn = document.getElementById('next-month-btn');
      const monthYearEl = document.getElementById('month-year');

      if(prevMonthBtn && nextMonthBtn && monthYearEl) {
        prevMonthBtn.addEventListener('click', () => {
          let year = parseInt(monthYearEl.dataset.year);
          let month = parseInt(monthYearEl.dataset.month);
          month--;
          if (month < 0) {
            month = 11;
            year--;
          }
          monthYearEl.dataset.year = year;
          monthYearEl.dataset.month = month;
          renderCalendar(billsData);
        });

        nextMonthBtn.addEventListener('click', () => {
          let year = parseInt(monthYearEl.dataset.year);
          let month = parseInt(monthYearEl.dataset.month);
          month++;
          if (month > 11) {
            month = 0;
            year++;
          }
          monthYearEl.dataset.year = year;
          monthYearEl.dataset.month = month;
          renderCalendar(billsData);
        });
      }
      
      // Modal listeners
      if (addBillBtn) {
        addBillBtn.addEventListener('click', () => {
          editingBillId = null;
          document.getElementById('modal-title').textContent = 'Add New Bill';
          billForm.reset();
          billModal.style.display = 'flex';
        });
      }
      if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => billModal.style.display = 'none');
      }
      if(billForm) {
        billForm.addEventListener('submit', handleFormSubmit);
      }
    }

    async function handleFormSubmit(e) {
      e.preventDefault();
      const formData = new FormData(billForm);
      const bill = Object.fromEntries(formData.entries());
      const url = editingBillId ? `${API_BASE_URL}/bills/${editingBillId}` : `${API_BASE_URL}/bills`;
      const method = editingBillId ? 'PUT' : 'POST';

      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bill),
        });
        if (!response.ok) throw new Error('Form submission failed');
        billModal.style.display = 'none';
        await fetchAndRenderData();
      } catch(error) {
        console.error('Failed to save bill:', error);
        alert('Failed to save bill. Please try again.');
      }
    }
    
    async function fetchAndRenderData() {
      try {
        const response = await fetch(`${API_BASE_URL}/bills`);
        if (!response.ok) throw new Error('Failed to fetch bills');
        billsData = await response.json();
        
        const billsDataEl = document.getElementById('bills-data');
        if(billsDataEl) billsDataEl.textContent = JSON.stringify(billsData);

        const activeFilterButton = document.querySelector('.filter-btn.active');
        const activeFilter = activeFilterButton ? activeFilterButton.dataset.filter : 'all';
        
        renderBills(billsData, activeFilter);
        // Initial render for the calendar, even if it's hidden, to set the correct month/year
        renderCalendar(billsData);
        // Explicitly hide calendar on initial load
        const calendarContainer = document.getElementById('bills-calendar-container');
        if(calendarContainer) calendarContainer.style.display = 'none';
      } catch (error) {
        console.error('Error fetching and rendering bills:', error);
        const billsGrid = document.getElementById('bills-grid');
        if (billsGrid) billsGrid.innerHTML = '<p>Could not load bills data.</p>';
      }
    }

    // --- Global Functions for inline onclick ---
    window.openEditModal = (id) => {
      const bill = billsData.find(b => b.id === id);
      if (bill) {
        editingBillId = id;
        document.getElementById('modal-title').textContent = 'Edit Bill';
        billForm.querySelector('[name="category"]').value = bill.category;
        billForm.querySelector('[name="name"]').value = bill.name;
        billForm.querySelector('[name="amount"]').value = bill.amount;
        billForm.querySelector('[name="dueDate"]').value = new Date(bill.due_date).toISOString().split('T')[0];
        billForm.querySelector('[name="status"]').value = bill.status;
        billModal.style.display = 'flex';
      }
    };

    window.deleteBill = async (id) => {
      if (confirm('Are you sure you want to delete this bill?')) {
        try {
          const response = await fetch(`${API_BASE_URL}/bills/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete bill');
          await fetchAndRenderData();
        } catch(error) {
          console.error('Failed to delete bill:', error);
          alert('Could not delete the bill. Please try again.');
        }
      }
    };

    // --- Initial Load ---
    setupEventListeners();
    fetchAndRenderData();
  }

  // --- Help & Support Page Specific Logic ---
  if (document.querySelector('.help-support-module')) {
    setupFAQAccordion();
    setupContactForm();
    setupChatbot();
    setupViewDocs();
  }

  function setupFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other FAQ items
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
        });
        
        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
        }
      });
    });
  }

  function setupContactForm() {
    const contactFormBtn = document.getElementById('contact-form-btn');
    const contactSection = document.getElementById('contact-section');
    const contactForm = document.getElementById('contact-form');
    
    // Show/hide contact form
    contactFormBtn.addEventListener('click', () => {
      contactSection.style.display = contactSection.style.display === 'none' ? 'block' : 'none';
      if (contactSection.style.display === 'block') {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    // Handle form submission
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        subject: document.getElementById('contact-subject').value,
        message: document.getElementById('contact-message').value
      };
      
      try {
        const response = await fetch(`${API_BASE_URL}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert(result.message);
          contactForm.reset();
          contactSection.style.display = 'none';
        } else {
          alert('Failed to send message. Please try again.');
        }
      } catch (error) {
        console.error('Error sending contact form:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }

  function setupChatbot() {
    const openChatBtn = document.getElementById('open-chat-btn');
    const chatbotModal = document.getElementById('chatbot-modal');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const chatMessages = document.getElementById('chatbot-messages');
    
    // Open chatbot
    openChatBtn.addEventListener('click', () => {
      chatbotModal.style.display = 'flex';
      chatInput.focus();
    });
    
    // Close chatbot
    closeChatBtn.addEventListener('click', () => {
      chatbotModal.style.display = 'none';
    });
    
    // Close on outside click
    chatbotModal.addEventListener('click', (e) => {
      if (e.target === chatbotModal) {
        chatbotModal.style.display = 'none';
      }
    });
    
    // Send message on button click
    sendChatBtn.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Handle quick replies
    chatMessages.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-reply')) {
        const query = e.target.dataset.query;
        chatInput.value = query;
        sendMessage();
      }
    });
    
    async function sendMessage() {
      const message = chatInput.value.trim();
      if (!message) return;
      
      // Add user message to chat
      addMessageToChat(message, 'user');
      chatInput.value = '';
      
      try {
        // Send message to backend
        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
        
        const botResponse = await response.json();
        
        // Add bot response to chat
        addMessageToChat(botResponse.content, 'bot', botResponse.quickReplies);
        
      } catch (error) {
        console.error('Error sending message:', error);
        addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
      }
    }
    
    function addMessageToChat(content, sender, quickReplies = null) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${sender}-message`;
      
      let quickRepliesHTML = '';
      if (quickReplies && quickReplies.length > 0) {
        quickRepliesHTML = '<div class="quick-replies">';
        quickReplies.forEach(reply => {
          quickRepliesHTML += `<button class="quick-reply" data-query="${reply.query}">${reply.text}</button>`;
        });
        quickRepliesHTML += '</div>';
      }
      
      messageDiv.innerHTML = `
        <div class="message-content">
          <p>${content}</p>
          ${quickRepliesHTML}
        </div>
      `;
      
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function setupViewDocs() {
    const viewDocsBtn = document.getElementById('view-docs-btn');
    
    if (viewDocsBtn) {
      viewDocsBtn.addEventListener('click', () => {
        window.location.href = 'documentation.html';
      });
    }
  }

  // Add global functions for inline onclick handlers
  window.openEditModal = async (id) => {
    // ... existing code ...
  }

  // --- Auth: Signup Form ---
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const firstName = signupForm.firstName.value.trim();
      const lastName = signupForm.lastName.value.trim();
      const email = signupForm.email.value.trim();
      const password = signupForm.password.value;
      
      try {
        const response = await fetch(`${API_BASE_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, email, password })
        });
        const data = await response.json();
        if (response.ok) {
          alert('Signup successful! You can now log in.');
          window.location.href = 'login.html';
        } else {
          alert(data.error || 'Signup failed.');
        }
      } catch (err) {
        alert('An error occurred. Please try again.');
      }
    });
  }

  // --- Auth: Login Form ---
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;
      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Important for cookies
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
          alert('Login successful! Redirecting to dashboard...');
          window.location.href = 'dashboard.html';
        } else {
          alert(data.error || 'Login failed.');
        }
      } catch (err) {
        alert('An error occurred. Please try again.');
      }
    });
  }

  // --- Logout Functionality ---
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = 'login.html';
    });
  }
});

// --- Insights Page Logic ---
if (document.querySelector('.insights-page')) {
    const monthSelect = document.getElementById('insights-month-select');
    const yearSelect = document.getElementById('insights-year-select');

    // State for charts
    let pieChart = null;
    let barChart = null;

    function populateDateFilters() {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentYear = new Date().getFullYear();

        // Populate months
        months.forEach((month, i) => {
            const option = document.createElement('option');
            option.value = i + 1;
            option.textContent = month;
            monthSelect.appendChild(option);
        });
        
        // Populate years
        for (let i = -1; i < 4; i++) { // Range from last year to a few years in the future
            const year = currentYear + i;
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }

        // Set default to April 2025 to match sample data
        monthSelect.value = '4';
        yearSelect.value = '2025';

        monthSelect.addEventListener('change', fetchAllInsightsData);
        yearSelect.addEventListener('change', fetchAllInsightsData);
    }

    async function fetchAllInsightsData() {
        const year = yearSelect.value;
        const month = monthSelect.value;

        try {
          // Fetch all data in parallel
          const [summary, categories, streaks, suggestions, rewards] = await Promise.all([
              fetch(`${API_BASE_URL}/insights/summary?year=${year}&month=${month}`).then(res => res.json()),
              fetch(`${API_BASE_URL}/insights/categories?period=1m`).then(res => res.json()), // Default to 1m
              fetch(`${API_BASE_URL}/insights/streaks`).then(res => res.json()),
              fetch(`${API_BASE_URL}/insights/suggestions`).then(res => res.json()),
              fetch(`${API_BASE_URL}/insights/rewards?year=${year}&month=${month}`).then(res => res.json())
          ]);

          renderSummary(summary);
          renderCategoryChart(categories);
          renderStreaks(streaks);
          renderSuggestions(suggestions);
          renderRewards(rewards);
        } catch(error) {
          console.error('Failed to fetch insights data:', error);
          // Display a generic error message on the page
          document.querySelector('.insights-page').innerHTML = '<p class="error-message">Could not load insights. Please try again later.</p>';
        }
    }

    function renderSummary(data) {
        document.getElementById('total-spending-amount').textContent = `₹${data.totalSpending.toFixed(2)}`;
        document.getElementById('budget-usage-text').textContent = `${data.budgetUsage.toFixed(1)}%`;
        const budgetProgress = document.getElementById('budget-progress-bar');
        if(budgetProgress) budgetProgress.style.width = `${data.budgetUsage}%`;
        const budgetAmount = document.getElementById('budget-amount-text');
        if(budgetAmount) budgetAmount.textContent = `Budget: ₹${data.budget.toLocaleString()}`;

        const pieCtx = document.getElementById('spending-pie-chart')?.getContext('2d');
        if(!pieCtx) return;

        const labels = data.pieChartData.map(d => d.category);
        const values = data.pieChartData.map(d => d.total);

        if (pieChart) pieChart.destroy();
        pieChart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{ data: values, backgroundColor: ['#6d28d9', '#10b981', '#ef4444', '#f97316', '#3b82f6'] }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right' } } }
        });
    }
    
    async function renderCategoryChart(initialData) {
        const barCtx = document.getElementById('category-bar-chart')?.getContext('2d');
        if(!barCtx) return;

        function drawBarChart(chartData) {
            const labels = chartData.map(d => d.category);
            const values = chartData.map(d => d.total);
            if (barChart) barChart.destroy();
            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{ label: 'Spending by Category', data: values, backgroundColor: '#6d28d9' }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { display: false } }
                }
            });
        }

        drawBarChart(initialData);

        document.querySelectorAll('.toggle-buttons .toggle-btn').forEach(button => {
            button.addEventListener('click', async () => {
                document.querySelectorAll('.toggle-buttons .toggle-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const period = button.dataset.period;
                const newData = await fetch(`${API_BASE_URL}/insights/categories?period=${period}`).then(res => res.json());
                drawBarChart(newData);
            });
        });
    }

    function renderStreaks(data) {
        const streakCount = document.getElementById('streak-count');
        if(streakCount) streakCount.textContent = data.streak;
        const heatmap = document.getElementById('heatmap-container');
        if(!heatmap) return;
        heatmap.innerHTML = '';
        data.heatmap.forEach(day => {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.dataset.level = day.count > 3 ? 4 : day.count;
            heatmap.appendChild(cell);
        });
    }

    function renderSuggestions(data) {
        const list = document.getElementById('suggestions-list');
        if(!list) return;
        list.innerHTML = '';
        data.forEach(sug => {
            const item = document.createElement('div');
            item.className = `suggestion-item ${sug.type}`;
            let iconClass = 'fa-info-circle';
            if (sug.type === 'warning') {
              iconClass = 'fa-exclamation-triangle';
            } else if (sug.type === 'alert') {
              iconClass = 'fa-bell';
            }
            item.innerHTML = `<i class="fas ${iconClass}"></i><p>${sug.message}</p>`;
            list.appendChild(item);
        });
    }

    function renderRewards(data) {
        const userPoints = document.getElementById('user-points');
        if(userPoints) userPoints.textContent = data.points;
        const grid = document.getElementById('coupons-grid');
        if(!grid) return;
        grid.innerHTML = '';
        if(!data.unlockedCoupons || data.unlockedCoupons.length === 0) {
            grid.innerHTML = '<p class="no-rewards-msg">No coupons unlocked yet. Keep up the good spending habits!</p>';
            return;
        }
        data.unlockedCoupons.forEach(coupon => {
            const card = document.createElement('div');
            card.className = 'coupon-card';
            card.innerHTML = `
                <div class="coupon-header">
                  <img src="${coupon.logo}" alt="${coupon.title}" class="coupon-logo">
                  <h4>${coupon.title}</h4>
                </div>
                <p>${coupon.desc}</p>
                <span class="coupon-code">${coupon.code}</span>
            `;
            grid.appendChild(card);
        });
    }

    // Initial Load
    populateDateFilters();
    fetchAllInsightsData();
}
