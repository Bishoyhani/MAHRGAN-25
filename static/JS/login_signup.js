//login and signup functionality
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
  container.classList.add('active');
})

loginBtn.addEventListener('click', () => {
  container.classList.remove('active');
})


// Email validation
const passwordInput = document.getElementById("password");
const errorDiv = document.getElementById("password-error");
const successDiv = document.getElementById("password-success");
const successMsg = "كلمة المرور قوية وصحيحة";
const failMsg =
  "كلمة المرور يجب أن تكون 8 أحرف على الأقل، وتحتوي على حرف كبير، وحرف صغير، ورقم، ورمز خاص";
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{},.<>?/|])[A-Za-z\d!@#$%^&*()_\-+=\[\]{},.<>?/|]{8,}$/;
let errorTimeout, successTimeout;
passwordInput.addEventListener("input", function () {
  clearTimeout(errorTimeout);
  clearTimeout(successTimeout);
  if (regex.test(passwordInput.value)) {
    errorDiv.textContent = "";
    successDiv.textContent = successMsg;
    successDiv.style.display = "block";
    successTimeout = setTimeout(function () {
      successDiv.style.display = "none";
    }, 5000);
  } else {
    errorDiv.textContent = failMsg;
    successDiv.textContent = "";
    successDiv.style.display = "none";
    errorTimeout = setTimeout(function () {
      errorDiv.textContent = "";
    }, 5000);
  }
});

// Hide login error after 5 seconds
setTimeout(function () {
  var err = document.getElementById('login-error');
  if (err) err.style.display = 'none';
}, 5000);


// hide/show password 
const passwordInput1 = document.getElementsByClassName("password")[0];
const toggleText = document.getElementsByClassName("show_hide")[0];
const passwordInput2 = document.getElementsByClassName("password")[1];
const toggleText2 = document.getElementsByClassName("show_hide")[1];

function updateToggleVisibility1() {
  if (passwordInput1.value !== "") {
    toggleText.style.opacity = "1";
  } else {
    toggleText.style.opacity = "0";
  }
}

function updateToggleVisibility2() {
  if (passwordInput2.value !== "") {
    toggleText2.style.opacity = "1";
  } else {
    toggleText2.style.opacity = "0";
  }
}

function togglePassword1() {
  if (passwordInput1.type === "password") {
    passwordInput1.type = "text";
    toggleText.textContent = "إخفاء كلمة المرور";
  } else {
    passwordInput1.type = "password";
    toggleText.textContent = "اظهار كلمة المرور";
  }
}

function togglePassword2() {
  if (passwordInput2.type === "password") {
    passwordInput2.type = "text";
    toggleText2.textContent = "إخفاء كلمة المرور";
  } else {
    passwordInput2.type = "password";
    toggleText2.textContent = "اظهار كلمة المرور";
  }
}

passwordInput1.addEventListener("input", updateToggleVisibility1);
passwordInput2.addEventListener("input", updateToggleVisibility2);

updateToggleVisibility1();
updateToggleVisibility2();


// sidebars js 
const statsSidebar = document.getElementById('statsSidebar');
const statsArrow = document.getElementById('openStatsSidebar');
const statsCloseBtn = document.getElementById('closeStatsSidebar');
const featuresSidebar = document.getElementById('featuresSidebar');
const featuresArrow = document.getElementById('openFeaturesSidebar');
const featuresCloseBtn = document.getElementById('closeFeaturesSidebar');

const overlay = document.getElementById('sidebarOverlay');
const overlay2 = document.getElementById('sidebarOverlay2');



statsArrow.onclick = function () {
  statsSidebar.classList.add('open');
  statsArrow.classList.add('hide-arrow');
  featuresSidebar.classList.remove('open');
  overlay.classList.add('active');
  featuresArrow.classList.remove('hide-arrow');
};
statsCloseBtn.onclick = function () {
  statsSidebar.classList.remove('open');
  overlay.classList.remove('active');
  statsArrow.classList.remove('hide-arrow');
};


// فتح مميزات: يغلق الإحصائيات لو مفتوح
featuresArrow.onclick = function () {
  featuresSidebar.classList.add('open');
  featuresArrow.classList.add('hide-arrow');
  statsSidebar.classList.remove('open');
  overlay2.classList.add('active');
  statsArrow.classList.remove('hide-arrow');
};
featuresCloseBtn.onclick = function () {
  featuresSidebar.classList.remove('open');
  overlay2.classList.remove('active');
  featuresArrow.classList.remove('hide-arrow');
};



// notification bar close
const notificationClose = document.querySelector('.notification-close');
notificationClose.addEventListener('click', function () {
  const notificationBar = document.querySelector('.notification-bar');
  notificationBar.style.display = 'none';
});




function hideSidebar() {
  overlay.classList.remove('active');
  statsSidebar.classList.remove('open');
  statsArrow.classList.remove('hide-arrow');
}

overlay.onclick = hideSidebar;

function hideSidebar2() {
  featuresSidebar.classList.remove('open');
  overlay2.classList.remove('active');
  featuresArrow.classList.remove('hide-arrow');
}

overlay2.onclick = hideSidebar2;
