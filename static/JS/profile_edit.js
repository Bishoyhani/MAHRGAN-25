

    function previewAvatar(event) {
      const file = event.target.files[0];
      const reader = new FileReader();
      const img = document.getElementById('upload-preview');
      const plus = document.getElementById('plus-sign');
      const radio = document.getElementById('uploadedRadio');

      if (file) {
        reader.onload = function (e) {
          img.src = e.target.result;
          img.style.display = 'block';
          plus.style.display = 'none';
          radio.checked = true;
        };
        reader.readAsDataURL(file);
      }
    }

    // إظهار/إخفاء الصورة حسب الاختيار
    const radioButtons = document.querySelectorAll('input[name="selected_avatar"]');
    const uploadPreview = document.getElementById('upload-preview');
    const plusSign = document.getElementById('plus-sign');

    radioButtons.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'uploaded') {
          if (uploadPreview && uploadPreview.src) {
            uploadPreview.style.display = 'block';
          }
          if (plusSign) plusSign.style.display = 'none';
        } else {
          if (uploadPreview) uploadPreview.style.display = 'none';
          if (plusSign) plusSign.style.display = 'block';
        }
      });
    });


    function openConfirmation() {
      document.getElementById('overlay').classList.add('is-visible');
      document.body.classList.add('modal-open'); // Disable scroll
    }

    function closeConfirmation() {
      document.getElementById('overlay').classList.remove('is-visible');
      document.body.classList.remove('modal-open'); // Re-enable scroll
    }



    function confirmAction() {
      document.querySelector('.profile-form').submit(); // يرسل النموذج
    }
    radioButtons.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.id === 'uploadedRadio' || radio.value === 'uploaded') {
          if (uploadPreview && uploadPreview.src) {
            uploadPreview.style.display = 'block';
          }
          if (plusSign) plusSign.style.display = 'none';
        } else {
          if (uploadPreview) uploadPreview.style.display = 'none';
          if (plusSign) plusSign.style.display = 'block';
        }
      });
    });
