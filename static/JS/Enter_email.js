const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const emailInput = document.getElementById("email");
const messageDiv = document.getElementById("email-message");
const resetBtn = document.getElementById("reset-btn");

emailInput.addEventListener("input", function () {
  const email = emailInput.value.trim();

  if (!emailRegex.test(email)) {
    messageDiv.textContent = "صيغة البريد الإلكتروني غير صحيحة";
    messageDiv.className = "message error";
  } else {
    messageDiv.textContent = "البريد الإلكتروني صحيح";
    messageDiv.className = "message success";
  }
});

resetBtn.addEventListener("mouseover", function () {
  if (messageDiv.classList.contains("error") ||  document.getElementById("email").value === ""  ){
    resetBtn.style.position = "absolute";
    resetBtn.style.left = Math.random() * 70 + "%";
    resetBtn.style.top = Math.random() * 70 + "%";
  }
});


// timing out for (البريد الإلكتروني غير مسجل لدينا)
const emailErrorDiv = document.getElementById('email_error');
function hideEmailErrorAfterTimeout() {
  if (emailErrorDiv && emailErrorDiv.textContent.trim() !== "") {
    emailErrorDiv.style.display = "";
    setTimeout(() => {
      emailErrorDiv.style.display = "none";
    }, 5000); // 5 seconds
  }
}

hideEmailErrorAfterTimeout();