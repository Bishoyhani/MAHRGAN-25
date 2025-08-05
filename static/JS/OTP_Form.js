// the location function
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("otpForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=3c1822295f3c4146b80645fd5e401b68&language=ar`)
          .then(res => res.json())
          .then(data => {
            const address = data.results[0].formatted;
            const components = data.results[0].components;
            const gov = components.county || components.state || components.province || "غير معروف";

            document.getElementById("lat").value = lat;
            document.getElementById("lng").value = lng;
            document.getElementById("address").value = address;
            document.getElementById("gov").value = gov;

            form.submit();
          })
          .catch(err => {
            console.error("فشل في جلب العنوان:", err);
            form.submit(); // كمل بدون عنوان
          });
      },
      (err) => {
        console.warn("المستخدم رفض تحديد الموقع:", err.message);
        form.submit(); // كمل بدون إحداثيات
      }
    );
  });
});

// timer & focus functions
  document.addEventListener("DOMContentLoaded", function () {
    // العناصر
    const otpInputs = document.querySelectorAll(".otp-input");
    const btn = document.querySelector('button[type="submit"]');
    const countdownElement = document.getElementById("countdown");
    const timerBox = document.getElementById("timer");

    // إخفاء زر التأكيد في البداية
    btn.style.display = "none";

    // وظيفة العداد الزمني
    let duration = 10 * 60; // 10 دقائق = 600 ثانية
    function updateTimer() {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      countdownElement.innerText = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      if (duration <= 0) {
        clearInterval(timerInterval);
        timerBox.innerHTML = `<span style="color: red;">انتهت صلاحية الكود!</span>`;
      }

      duration--;
    }
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    // تعامل مع إدخال الـ OTP
    otpInputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        // اسمح فقط برقم واحد
        input.value = input.value.replace(/[^0-9]/g, "").slice(0, 1);

        // انتقل للخانة التالية
        if (input.value && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }

        // تحقق إذا كل الخانات ممتلئة
        const allFilled = Array.from(otpInputs).every(inp => inp.value.length === 1);
        btn.style.display = allFilled ? "block" : "none";
      });

      input.addEventListener("keydown", (e) => {
        // العودة للخلف إذا ضغط Backspace وخانة فارغة
        if (e.key === "Backspace" && input.value === "" && index > 0) {
          otpInputs[index - 1].focus();
        }
      });

      input.addEventListener("focus", () => {
        // مسح كل الخانات عند الضغط على الخانة الأولى
        if (index === 0) {
          otpInputs.forEach(inp => inp.value = "");
          btn.style.display = "none";
        }
      });
    });
  });