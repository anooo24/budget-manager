// Data
let accounts = JSON.parse(localStorage.getItem("accounts")) || [];
let budget = JSON.parse(localStorage.getItem("budget")) || {salary:0, saved:0, spend:0};
let history = JSON.parse(localStorage.getItem("history")) || [];
let transfers = JSON.parse(localStorage.getItem("transfers")) || [];

let editIndex = -1; // For editing accounts

// Tabs
function showTab(id){
  document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  event.target.classList.add("active");
}

// Accounts
function addOrUpdateAccount(){
  const name = accName.value.trim();
  const number = accNumber.value.trim();
  const bank = bankType.value;

  if(!name || !number){ alert("Please fill all fields"); return; }

  if(editIndex >=0){
    accounts[editIndex] = {name, number, bank};
    editIndex = -1;
  }else{
    accounts.push({name, number, bank});
  }

  localStorage.setItem("accounts",JSON.stringify(accounts));
  accName.value=accNumber.value="";
  loadAccounts();
  updateDashboard();
}

function editAccount(i){
  accName.value = accounts[i].name;
  accNumber.value = accounts[i].number;
  bankType.value = accounts[i].bank;
  editIndex = i;
}

function deleteAccount(i){
  if(confirm("Are you sure you want to delete this account?")){
    accounts.splice(i,1);
    localStorage.setItem("accounts",JSON.stringify(accounts));
    loadAccounts();
    updateDashboard();
  }
}

function loadAccounts(){
  accountList.innerHTML="";
  transferAccount.innerHTML="";
  accounts.forEach((a,i)=>{
    accountList.innerHTML+=`
      <tr>
        <td>${a.name}</td>
        <td>${a.number}</td>
        <td>${a.bank}</td>
        <td>
          <button class="action-btn edit" onclick="editAccount(${i})">Edit</button>
          <button class="action-btn delete" onclick="deleteAccount(${i})">Delete</button>
        </td>
      </tr>`;
    transferAccount.innerHTML+=`<option value="${i}">${a.name} - ${a.bank}</option>`;
  });
}

// Budget
function saveBudget(){
  budget.salary=+salary.value;
  budget.saved=+saveAmount.value;
  budget.spend=+spendAmount.value;

  // Save history
  history.push({
    month: new Date().toLocaleString('default',{month:'long',year:'numeric'}),
    salary:budget.salary,
    saved:budget.saved,
    spend:budget.spend,
    left: budget.salary-budget.saved-budget.spend
  });
  localStorage.setItem("history",JSON.stringify(history));
  localStorage.setItem("budget",JSON.stringify(budget));

  // Transfer to account
  let idx = +transferAccount.value;
  if(accounts[idx]) accounts[idx].balance = (accounts[idx].balance||0)+budget.saved;

  localStorage.setItem("accounts",JSON.stringify(accounts));
  transfers.push({
    date:new Date().toLocaleString(),
    from:"Budget",
    to:accounts[idx]?accounts[idx].name:"",
    amount:budget.saved
  });
  localStorage.setItem("transfers",JSON.stringify(transfers));

  updateDashboard();
  loadAccounts();
  loadHistory();
  loadTransfers();
}

// Reset History
function resetHistory(){
  if(confirm("Are you sure you want to reset all history and transfer logs?")){
    history = [];
    transfers = [];
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("transfers", JSON.stringify(transfers));
    loadHistory();
    loadTransfers();
    updateDashboard();
    alert("History and transfer logs have been reset.");
  }
}

// Dashboard updates
function updateDashboard(){
  // Recalculate budget from latest history
  if(history.length > 0){
    const last = history[history.length-1];
    budget.salary = last.salary;
    budget.saved = last.saved;
    budget.spend = last.spend;
  } else {
    budget.salary = 0;
    budget.saved = 0;
    budget.spend = 0;
  }

  dSalary.innerText = budget.salary;
  dSaved.innerText = budget.saved;
  dSpend.innerText = budget.spend;
  dLeft.innerText = budget.salary - budget.saved - budget.spend;

  drawChart();
}

// History
function loadHistory(){
  historyList.innerHTML="";
  history.forEach(h=>{
    historyList.innerHTML+=`<tr><td>${h.month}</td><td>${h.salary}</td><td>${h.saved}</td><td>${h.spend}</td><td>${h.left}</td></tr>`;
  });
}

// Transfers
function loadTransfers(){
  transferLog.innerHTML="";
  transfers.forEach(t=>{
    transferLog.innerHTML+=`<tr><td>${t.date}</td><td>${t.from}</td><td>${t.to}</td><td>${t.amount}</td></tr>`;
  });
}

// Chart
let chart;
function drawChart(){
  if(chart) chart.destroy();
  chart = new Chart(budgetChart,{
    type:'doughnut',
    data:{
      labels:['Saved','Spending','Left'],
      datasets:[{
        data:[budget.saved,budget.spend,budget.salary-budget.saved-budget.spend],
        backgroundColor:['#2ecc71','#e74c3c','#3498db']
      }]
    }
  });
}

// PDF Export
function generatePDF(){
  const {jsPDF} = window.jspdf;
  const pdf = new jsPDF();
  pdf.text("Monthly Budget Report",20,20);
  history.forEach((h,i)=>{
    pdf.text(`${h.month}: Salary ${h.salary}, Saved ${h.saved}, Spent ${h.spend}, Left ${h.left}`,20,30+10*i);
  });
  pdf.save("Budget_Report.pdf");
}

// Excel Export
function generateExcel(){
  let ws = XLSX.utils.json_to_sheet(history);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"History");
  XLSX.writeFile(wb,"Budget_History.xlsx");
}

// Init
loadAccounts();
updateDashboard();
loadHistory();
loadTransfers();
