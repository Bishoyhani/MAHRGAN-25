const replies = {
  'كيف أضيف مشروع؟': `الخطوة الأولى: يجب أن تقوم بتسجيل الدخول أو إنشاء حساب في الموقع.
الخطوة الثانية: بعد الدخول، اضغط على زر "إضافة مشروع" من الصفحة الرئيسية.
الخطوة الثالثة: قم بتعبئة معلومات المشروع مثل الاسم والوصف والصور (إن وُجدت).
الخطوة الرابعة: اضغط على "حفظ"، وسيتم إرسال مشروعك للمراجعة.`,

  'كيف أصوت لمشروع؟': `الخطوة الأولى: يجب أن تقوم بتسجيل الدخول أو إنشاء حساب في الموقع.
الخطوة الثانية: انتقل إلى صفحة "عرض المشاريع".
الخطوة الثالثة: اختر المشروع الذي تريده.
الخطوة الرابعة: اضغط على النجمة لتقييم المشروع حسب رأيك.`,

  'كيف أعدل مشروع؟': `الخطوة الأولى: يجب أن تقوم بتسجيل الدخول أو إنشاء حساب في الموقع.
الخطوة الثانية: اذهب إلى "مشاريعي" من القائمة.
الخطوة الثالثة: اضغط على زر "تعديل" بجانب المشروع الذي ترغب بتعديله.
الخطوة الرابعة: غيّر ما تريد ثم اضغط "حفظ".`,

  'نسيت كلمة المرور': `الخطوة الأولى: من صفحة تسجيل الدخول، اضغط على "نسيت كلمة المرور؟".
الخطوة الثانية: أدخل بريدك الإلكتروني المرتبط بحسابك.
الخطوة الثالثة: ستتلقى رسالة تحتوي على رابط لإعادة تعيين كلمة المرور.
الخطوة الرابعة: اضغط على الرابط واتبع الخطوات.`,

  'كيفية إنشاء حساب جديد': `الخطوة الأولى: اضغط على زر "تسجيل حساب جديد".
الخطوة الثانية: قم بإدخال اسمك، بريدك الإلكتروني، وكلمة المرور.
الخطوة الثالثة: ستتلقى رمز تحقق (OTP) على بريدك الإلكتروني.
الخطوة الرابعة: أدخل الرمز المرسل لإكمال عملية التسجيل.`,

  'كيفية استلام جوائز المراكز الأولى': `الخطوة الأولى: يجب أن تقوم بتسجيل الدخول أو إنشاء حساب في الموقع.
الخطوة الثانية: اذهب إلى صفحة الترتيب أو لوحة الشرف.
الخطوة الثالثة: إذا كنت من ضمن الفائزين، سيظهر لك زر لاستلام جائزتك.
الخطوة الرابعة: اضغط عليه واتبع التعليمات الموضّحة.`,

  'كيفية إضافة تعليق': `الخطوة الأولى: يجب أن تقوم بتسجيل الدخول أو إنشاء حساب في الموقع.
الخطوة الثانية: افتح صفحة المشروع الذي ترغب في التعليق عليه.
الخطوة الثالثة: انتقل إلى أسفل الصفحة، واكتب تعليقك في الحقل المخصص.
الخطوة الرابعة: اضغط على زر "إرسال" لنشر تعليقك.`
};

    let expandedOnce = false;

    async function handleQuestion(button) {
      const question = button.textContent.trim();
      const chatContainer = document.getElementById('chat-container');
      const chat = document.getElementById('chat');
      const buttons = document.querySelectorAll('.question');

      if (!expandedOnce) {
        chatContainer.classList.add('expanded');
        expandedOnce = true;
      }

      addMessage(question, 'user');
      buttons.forEach(btn => btn.disabled = true);

      // الرد كله في رسالة واحدة
      const steps = replies[question] || 'عذرًا، لم أفهم سؤالك.';
      await typeBotReply(steps);

      buttons.forEach(btn => btn.disabled = false);
    }

    function addMessage(text, role) {
      const chat = document.getElementById('chat');
      const div = document.createElement('div');
      div.className = 'message ' + role;
      div.textContent = text;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }

    async function typeBotReply(text) {
      const chat = document.getElementById('chat');
      const bubble = document.createElement('div');
      bubble.className = 'message bot';
      chat.appendChild(bubble);

      await typeText(bubble, text);

      chat.scrollTop = chat.scrollHeight;
    }

    function typeText(element, text) {
      return new Promise(resolve => {
        let i = 0;
        const interval = setInterval(() => {
          element.textContent += text[i];
          i++;
          if (i >= text.length) {
            clearInterval(interval);
            resolve();
          }
        }, 30); // سرعة الكتابة
      });
    }