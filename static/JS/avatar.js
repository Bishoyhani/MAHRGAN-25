    function previewAvatar(event) {
      const file = event.target.files[0];
      const img = document.getElementById('upload-preview');
      const plus = document.getElementById('plus-sign');
      const radio = document.getElementById('uploadedRadio');

      // Uncheck all radios first
      document.querySelectorAll('input[name="selected_avatar"]').forEach(r => r.checked = false);

      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          img.src = e.target.result;
          img.style.display = 'block';
          plus.style.display = 'none';
          radio.checked = true;
        }
        reader.readAsDataURL(file);
      }
    }

    function clearUpload() {
      const img = document.getElementById('upload-preview');
      const plus = document.getElementById('plus-sign');
      const radio = document.getElementById('uploadedRadio');

      document.getElementById('avatar_file').value = "";
      img.style.display = 'none';
      plus.style.display = 'block';
      radio.checked = false;
    }