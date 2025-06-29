// === Navigation toggle for mobile ===
function toggleMenu() {
  const navLinks = document.getElementById('nav-links');
  navLinks.classList.toggle('show');
}

function showForm(clientType) {
  const formNew = document.getElementById('form-new');
  const formExisting = document.getElementById('form-existing');
  const buttons = document.querySelectorAll('.client-btn');
  const formContainer = document.querySelector('.form-container');

  // Hide both sections first
  formNew.classList.add('hidden');
  formExisting.classList.add('hidden');

  // Remove active state from all buttons
  buttons.forEach(btn => btn.classList.remove('active'));

  // Show the selected section and activate the correct button
  if (clientType === 'new') {
    formNew.classList.remove('hidden');
    document.querySelector('.client-btn[onclick*="new"]').classList.add('active');
  } else if (clientType === 'existing') {
    formExisting.classList.remove('hidden');
    document.querySelector('.client-btn[onclick*="existing"]').classList.add('active');
  }

  // Set margin if either section is shown
  formContainer.style.marginTop = '40px';
}

// === Smooth scroll for anchor links ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// === Close nav menu on link click (mobile) ===
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('nav-links').classList.remove('show');
  });
});

// === Prevent negative input values ===
document.querySelectorAll('input[type="number"]').forEach(input => {
  input.addEventListener('input', function () {
    if (this.value < 0) this.value = 0;
  });
});

// === Shared slider fill logic ===
function updateSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const percentage = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, #dc2626 ${percentage}%, #e5e7eb ${percentage}%)`;
}

// === Individual update functions ===
function updateLoanAmount(value) {
  document.getElementById('loanAmountValue').textContent = value;
  updateSliderFill(document.getElementById('loan_amnt'));
}

function updateLoanTerm(value) {
  document.getElementById('loanTermValue').textContent = value;
  updateSliderFill(document.getElementById('term'));
}

function updateGradeScore(value) {
  document.getElementById('gradeScoreValue').textContent = value;
  updateSliderFill(document.getElementById('grade_score'));
}

function updateEmpLength(value) {
  document.getElementById('empLengthValue').textContent = value;
  updateSliderFill(document.getElementById('emp_length'));
}

function updateDTI(value) {
  document.getElementById('dtiValue').textContent = value;
  updateSliderFill(document.getElementById('dti'));
}

function updateRevolUtil(value) {
  document.getElementById('revolUtilValue').textContent = value;
  updateSliderFill(document.getElementById('revol_util'));
}

// === Toggle group: Home Ownership ===
function setupHomeOwnershipButtons() {
  const buttons = document.querySelectorAll('.ownership-btn');
  const hiddenInput = document.getElementById('homeOwnershipInput');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      hiddenInput.value = button.getAttribute('data-value');
      updateLivePrediction();  // Trigger live update
    });

    if (button.getAttribute('data-value') === hiddenInput.value) {
      button.classList.add('active');
    }
  });
}

// === Toggle group: Application Type ===
function setupApplicationTypeButtons() {
  const buttons = document.querySelectorAll('.application-btn');
  const hiddenInput = document.getElementById('applicationTypeInput');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      hiddenInput.value = button.getAttribute('data-value');
      updateLivePrediction();  // Trigger live update
    });

    if (button.getAttribute('data-value') === hiddenInput.value) {
      button.classList.add('active');
    }
  });
}

// === Gather form data as a dictionary ===
function gatherFormData() {
  const form = document.querySelector('#form-new form');
  const formData = new FormData(form);
  const data = {};

  formData.forEach((value, key) => {
    if (value !== "") {
      data[key] = value;
    }
  });

  return data;
}

// === Live Prediction AJAX call ===
function updateLivePrediction() {
  const data = gatherFormData();

  fetch('/predict_interest_live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        console.warn('Prediction error:', result.error);
        return;
      }

      const box = document.querySelector('.outcome-box');
      if (box) {
        box.innerHTML = `
          <h3>Risk Assessment Results</h3>
          <p><strong>Based on the provided information:</strong></p>
          <div class="risk-indicators">
            <div class="risk-item">
              <div class="risk-percentage">${result.prediction}%</div>
              <div class="risk-label">Predicted Interest Rate</div>
            </div>
            <div class="risk-item">
              <div class="risk-percentage">${result.conf_low}%</div>
              <div class="risk-label">Lower Bound</div>
            </div>
            <div class="risk-item">
              <div class="risk-percentage">${result.conf_high}%</div>
              <div class="risk-label">Upper Bound</div>
            </div>
          </div>
        `;
        box.classList.add('visible');
      }
    })
    .catch(error => console.error('Prediction failed:', error));
}

// === On Page Load: INIT everything ===
window.addEventListener('DOMContentLoaded', () => {
  const predictionBox = document.querySelector('.outcome-box');
  const formNew = document.getElementById('form-new');
  const btnNew = document.querySelector('.client-btn[onclick*="new"]');
  const formContainer = document.querySelector('.form-container');

  if (predictionBox && formNew && btnNew) {
    formNew.classList.remove('hidden');
    btnNew.classList.add('active');
    formContainer.style.marginTop = '40px';
  }

  // Init sliders
  const sliders = document.querySelectorAll('.slider-wrapper input[type="range"]');
  sliders.forEach(slider => {
    updateSliderFill(slider);
    const id = slider.id;

    if (id === 'loan_amnt') updateLoanAmount(slider.value);
    if (id === 'term') updateLoanTerm(slider.value);
    if (id === 'grade_score') updateGradeScore(slider.value);
    if (id === 'emp_length') updateEmpLength(slider.value);
    if (id === 'dti') updateDTI(slider.value);
    if (id === 'revol_util') updateRevolUtil(slider.value);

    slider.addEventListener('input', () => {
      if (id === 'loan_amnt') updateLoanAmount(slider.value);
      if (id === 'term') updateLoanTerm(slider.value);
      if (id === 'grade_score') updateGradeScore(slider.value);
      if (id === 'emp_length') updateEmpLength(slider.value);
      if (id === 'dti') updateDTI(slider.value);
      if (id === 'revol_util') updateRevolUtil(slider.value);

      updateLivePrediction();
    });
  });

  // Trigger prediction on all inputs
  const form = document.querySelector('#form-new form');
  if (form) {
    form.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('input', () => {
        updateLivePrediction();
      });
    });
  }

  // Setup toggles
  setupHomeOwnershipButtons();
  setupApplicationTypeButtons();
});

// Scenarios 
function fillDemo(scenario) {
  const values = {
    scenario2: {
      loan_amnt: 15000,
      term: 36,
      grade_score: 10,
      emp_length: 5,
      income_all: 55000,
      dti_all: 18,
      credit_history_months: 36,
      home_ownership: "RENT",
      purpose: "debt_consolidation",
      addr_state: "CA",
      revol_util: 25,
      open_acc: 5,
      pub_rec: 0,
      revol_bal: 3000,
      total_acc: 20,
      application_type: "INDIVIDUAL",
      acc_now_delinq: 0,
      tot_coll_amt: 0,
      tot_cur_bal: 15000
    },
    scenario3: {
      loan_amnt: 50000,
      term: 60,
      grade_score: 25,
      emp_length: 15,
      income_all: 120000,
      dti_all: 10,
      credit_history_months: 120,
      home_ownership: "OWN",
      purpose: "home_improvement",
      addr_state: "NY",
      revol_util: 12,
      open_acc: 8,
      pub_rec: 1,
      revol_bal: 6000,
      total_acc: 30,
      application_type: "JOINT",
      acc_now_delinq: 1,
      tot_coll_amt: 100,
      tot_cur_bal: 70000
    },
    scenario1: {
      loan_amnt: 8000,
      term: 12,
      grade_score: 5,
      emp_length: 1,
      income_all: 28000,
      dti_all: 35,
      credit_history_months: 10,
      home_ownership: "MORTGAGE",
      purpose: "vacation",
      addr_state: "FL",
      revol_util: 50,
      open_acc: 2,
      pub_rec: 0,
      revol_bal: 1000,
      total_acc: 5,
      application_type: "INDIVIDUAL",
      acc_now_delinq: 0,
      tot_coll_amt: 0,
      tot_cur_bal: 2500
    }
  };

  const data = values[scenario];
  if (!data) return;

  // Fill input fields
  for (const key in data) {
    const el = document.querySelector(`[name="${key}"]`);
    if (el) {
      el.value = data[key];
      el.dispatchEvent(new Event('input')); // Trigger slider or change events
    }
  }

  // Update home ownership buttons
  document.querySelectorAll('.ownership-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === data.home_ownership);
  });
  document.getElementById('homeOwnershipInput').value = data.home_ownership;

  // Update application type buttons
  document.querySelectorAll('.application-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === data.application_type);
  });
  document.getElementById('applicationTypeInput').value = data.application_type;

  // Trigger the live prediction
  updateLivePrediction();
}


