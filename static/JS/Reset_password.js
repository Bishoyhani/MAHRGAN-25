// يفتح القفل (fa-lock-open) عند تحقق جميع شروط كلمة المرور
const minLength = 8;
const newPassword = document.getElementById("new-password");
const confirmPassword = document.getElementById("confirm-password");
const groupNew = document.getElementById("group-new-password");
const groupConfirm = document.getElementById("group-confirm-password");
const resetBtn = document.getElementById("reset-btn");

// Rules elements
const ruleLength = document.getElementById("rule-length");
const ruleUppercase = document.getElementById("rule-uppercase");
const ruleLowercase = document.getElementById("rule-lowercase");
const ruleNumber = document.getElementById("rule-number");
const ruleSpecial = document.getElementById("rule-special"); // أضف هذا السطر

// Get the icon inside the group
function getIcon(group) {
  return group.querySelector(".fa");
}

function checkRules(pwd) {
  const hasLength = pwd.length >= minLength;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]/.test(pwd); // تحقق من وجود رمز خاص

  updateRule(ruleLength, hasLength);
  updateRule(ruleUppercase, hasUpper);
  updateRule(ruleLowercase, hasLower);
  updateRule(ruleNumber, hasNumber);
  updateRule(ruleSpecial, hasSpecial); // أضف هذا

  return hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
}
function updateRule(el, ok) {
  if (ok) {
    el.classList.add("reset-modal__rules__item--correct");
    el.querySelector(".fa").classList.remove("fa-circle");
    el.querySelector(".fa").classList.add("fa-check");
  } else {
    el.classList.remove("reset-modal__rules__item--correct");
    el.querySelector(".fa").classList.remove("fa-check");
    el.querySelector(".fa").classList.add("fa-circle");
  }
}
function validate() {
  const pwd = newPassword.value;
  const confirm = confirmPassword.value;
  const rulesOk = checkRules(pwd);

  // مجموعة كلمة المرور الجديدة
  if (pwd && rulesOk) {
    groupNew.classList.add("success");
    groupNew.classList.remove("error");
    const icon = getIcon(groupNew);
    icon.classList.remove("fa-lock");
    icon.classList.add("fa-lock-open");
  } else if (pwd) {
    groupNew.classList.remove("success");
    groupNew.classList.add("error");
    const icon = getIcon(groupNew);
    icon.classList.remove("fa-lock-open");
    icon.classList.add("fa-lock");
  } else {
    groupNew.classList.remove("success", "error");
    const icon = getIcon(groupNew);
    icon.classList.remove("fa-lock-open");
    icon.classList.add("fa-lock");
  }

  // مجموعة التأكيد
  if (confirm && pwd === confirm && rulesOk) {
    groupConfirm.classList.add("success");
    groupConfirm.classList.remove("error");
    // فتح القفل هنا عند النجاح
    const icon = getIcon(groupConfirm);
    icon.classList.remove("fa-lock");
    icon.classList.add("fa-lock-open");
  } else if (confirm) {
    groupConfirm.classList.remove("success");
    groupConfirm.classList.add("error");
    // قفل مغلق عند الخطأ
    const icon = getIcon(groupConfirm);
    icon.classList.remove("fa-lock-open");
    icon.classList.add("fa-lock");
  } else {
    groupConfirm.classList.remove("success", "error");
    // قفل مغلق عند التفريغ
    const icon = getIcon(groupConfirm);
    icon.classList.remove("fa-lock-open");
    icon.classList.add("fa-lock");
  }

  // تفعيل أو تعطيل الزر
  resetBtn.disabled = !(pwd && confirm && pwd === confirm && rulesOk);
}
newPassword.addEventListener("input", validate);
confirmPassword.addEventListener("input", validate);

document
  .querySelector(".reset-modal")
  .addEventListener("submit", function (e) {
    if (!resetBtn.disabled) {
      resetBtn.textContent = "تم إعادة التعيين!";
      resetBtn.disabled = true;
      setTimeout(() => {
        resetBtn.textContent = "إعادة تعيين كلمة المرور";
        newPassword.value = "";
        confirmPassword.value = "";
        validate();
      }, 2500);
    }
  });
document
  .querySelector(".reset-modal__cancel")
  .addEventListener("click", function (e) {
    newPassword.value = "";
    confirmPassword.value = "";
    validate();
  });

const errorMsg2 = document.getElementById("reset-error-msg");
document.addEventListener("input", function () {
  if (
    newPassword.value &&
    confirmPassword.value &&
    newPassword.value !== confirmPassword.value
  ) {
    errorMsg2.style.display = "block";
    errorMsg2.textContent = "كلمتا المرور غير متطابقتين!";
  } else {
    errorMsg2.style.display = "none";
    errorMsg2.textContent = "";
  }
});

document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.toggle);
    const textSpan = button.querySelector(".h_s");

    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    textSpan.textContent = isHidden ? "اخفاء كلمة المرور" : "اظهار كلمة المرور";
  });
});