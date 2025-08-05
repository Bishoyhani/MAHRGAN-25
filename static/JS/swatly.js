const addProject_BTN = document.getElementById('addProject');
const addProject_form = document.getElementById('container');
const closeButton = document.getElementById('close-button');
const header = document.getElementById('header');
const navbar = document.getElementById('info_bar');
const cards = document.getElementById('cards-container');
const no_projects = document.getElementById('no-projects');
const footer = document.getElementById('footer');
const backToTop = document.getElementById('btn-3');
const sortBar = document.getElementById('search-sort-bar');


document.addEventListener('DOMContentLoaded', function () {


  // إغلاق النموذج
  closeButton.addEventListener('click', function () {
    addProject_form.style.display = 'none';
    header.style.display = 'block';
    navbar.style.display = 'flex';
    cards.style.display = 'flex';
    footer.style.display = 'block';
    backToTop.style.display = 'block';
    no_projects.style.display = 'block';
    sortBar.style.display = 'block';
  });



  // فتح/إغلاق النموذج
  if (addProject_BTN) {
    addProject_BTN.addEventListener('click', function () {
      if (addProject_form && (addProject_form.style.display === 'none' || addProject_form.style.display === '')) {
        addProject_form.style.display = 'block';
        header.style.display = 'none';
        navbar.style.display = 'none';
        cards.style.display = 'none';
        footer.style.display = 'none';
        backToTop.style.display = 'none';
        no_projects.style.display = 'none';
        sortBar.style.display = 'none';
      }
    });
  }
});





// open and close the edit form (like a radion button) #########################

document.querySelectorAll('.edit-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    // أغلق جميع الفورمات أولاً
    document.querySelectorAll('.edit-fields').forEach(function (form) {
      form.style.display = 'none';
      // أرجع ارتفاع الكارت الافتراضي
      form.closest('.flipper').style.height = "760px";
    });

    // نصل للكارت الحالي
    const flipper = btn.closest('.flipper');
    const edit_form = flipper.querySelector('.edit-fields');

    // إفتح الفورم للكارت الحالي فقط
    edit_form.style.display = 'block';
    flipper.style.height = "1100px";
  });
});

// إغلاق الفورم عند الضغط على زر الإلغاء (cancel-btn)
document.querySelectorAll('.cancel-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const edit_form = btn.closest('.edit-fields');
    if (edit_form) {
      edit_form.style.display = 'none';
      // أرجع ارتفاع الكارت الافتراضي
      const flipper = edit_form.closest('.flipper');
      if (flipper) flipper.style.height = "760px";
    }
  });
});


// back to top btn #########################

const backToTopBtn = document.getElementById("button-wrapper");
window.addEventListener('scroll', function () {
  if (window.scrollY > 100) {
    backToTopBtn.style.opacity = '1';
  } else {
    backToTopBtn.style.opacity = '0';
  }
});

// star voting #####################################

document.querySelectorAll('.stars-container').forEach(container => {
  const stars = container.querySelectorAll('.star');
  const alreadyVoted = container.getAttribute('data-already-voted') === 'true';
  const userVote = Number(container.getAttribute('data-user-vote')) || 0;
  const messageSpan = container.querySelector('.vote-message');
  let locked = alreadyVoted;

  function highlightStars(value) {
    stars.forEach(star => {
      star.classList.toggle('selected', Number(star.dataset.value) <= value);
    });
  }

  // أول تحميل: لو فيه تصويت سابق
  if (alreadyVoted && userVote > 0) {
    highlightStars(userVote);
    stars.forEach(star => star.style.pointerEvents = 'none');
    if (messageSpan) messageSpan.textContent = `لقد قمت بالتصويت: ${userVote} من 5`;
    locked = true;
    return;
  } else {
    highlightStars(0);
    if (messageSpan) messageSpan.textContent = '';
  }

  // عند التحويم والتصويت
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      if (!locked) highlightStars(Number(star.dataset.value));
    });
    star.addEventListener('mouseleave', () => {
      if (!locked) highlightStars(0);
    });
    star.addEventListener('click', () => {
      if (locked) return;
      const value = Number(star.dataset.value);
      fetch('/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: container.getAttribute('data-card-id'), vote: value })
      })
        .then(res => res.json())
        .then(data => {
          highlightStars(data.user_vote || value);
          locked = true;
          stars.forEach(s => s.style.pointerEvents = 'none');
          if (messageSpan) {
            messageSpan.textContent = data.message || "تم التصويت بنجاح";
          }
          // تحديث عدد التصويتات والمتوسط
          const infoDiv = container.nextElementSibling;
          if (infoDiv && infoDiv.classList.contains('votes-info')) {
            infoDiv.innerHTML = `
              <svg width="16" height="16" style="position:relative; top:2px;" viewBox="0 0 24 24">
                <path fill="#FFD700" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 
                7 14.14l-5-4.87 6.91-1.01z"/>
              </svg>
              المتوسط: ${data.avg_vote} |
              <svg width="16" height="16" style="position:relative; top:2px; margin-left: 2px;" viewBox="0 0 24 24">
                <path fill="#555" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 
                3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 
                3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 
                0-.62.02-.97.05C17.16 13.66 20 14.84 20 16.5V19h4v-2.5c0-2.33-4.67-3.5-8-3.5z"/>
              </svg>
              عدد التصويتات: ${data.votes_count}
            `;
          }
        })
        .catch(() => {
          if (messageSpan) messageSpan.textContent = "حدث خطأ! حاول مرة أخرى";
        });
    });
  });
});

// flipping card #######################

function flipCard(cardId) {
  document.querySelectorAll('.flipper').forEach(flipper => {
    flipper.classList.remove('flipped-custom', 'flipped-back-smooth');
  });
  // حدد الكارت المطلوب عن طريق data-card-id
  const cardContainer = document.querySelector(`.flip-container[data-card-id="${cardId}"]`);
  if (!cardContainer) return;
  const flipper = cardContainer.querySelector('.flipper');
  if (flipper) flipper.classList.add('flipped-custom');
}


// flip Card Back #########################

function flipCardBack(cardId) {
  // حدد الكارت المطلوب عن طريق data-card-id
  const cardContainer = document.querySelector(`.flip-container[data-card-id="${cardId}"]`);
  if (!cardContainer) return;
  const flipper = cardContainer.querySelector('.flipper');
  if (flipper) flipper.classList.remove('flipped-custom');
  flipper.classList.add('flipped-back-smooth');
}


// sorting #################
function activateBtn(btnId) {
  const isDark = darkModeToggle.checked;

  document.querySelectorAll('#filter-best, #filter-new, #filter-all').forEach(btn => {
    btn.classList.remove('active-filter', 'active-filter-darked');
  });

  const targetBtn = document.getElementById(btnId);

  if (isDark) {
    targetBtn.classList.add('active-filter-darked');
  } else {
    targetBtn.classList.add('active-filter');
  }
}



document.getElementById('filter-best').onclick = function () {
  activateBtn('filter-best');
  document.querySelectorAll('.flip-container').forEach(card => {
    const rank = Number(card.getAttribute('data-rank'));
    if (rank >= 1 && rank <= 3) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
};

document.getElementById('filter-new').onclick = function () {
  activateBtn('filter-new');
  let cards = Array.from(document.querySelectorAll('.flip-container'));
  cards.sort((a, b) => {
    return new Date(b.getAttribute('data-created')) - new Date(a.getAttribute('data-created'));
  });
  cards.forEach((card, i) => {
    card.style.display = i < 3 ? 'block' : 'none';
  });
};

document.getElementById('filter-all').onclick = function () {
  activateBtn('filter-all');
  document.querySelectorAll('.flip-container').forEach(card => {
    card.style.display = 'block';
  });
};




// إظهار/إخفاء شريط البحث والترتيب
document.getElementById('filter-all').addEventListener('click', function () {
  document.getElementById('search-sort-bar').style.display = 'block';
});

document.getElementById('filter-best').addEventListener('click', function () {
  document.getElementById('search-sort-bar').style.display = 'none';
});
document.getElementById('filter-new').addEventListener('click', function () {
  document.getElementById('search-sort-bar').style.display = 'none';
});

// سيرش ذكي
document.getElementById('search-input').addEventListener('input', function () {
  const value = this.value.trim().toLowerCase();
  document.querySelectorAll('.flip-container').forEach(card => {
    let values = [];
    values.push(card.querySelector('.project-title')?.textContent || '');
    values.push(card.querySelector('.project-maker')?.textContent || '');
    values.push(card.querySelector('.project-email')?.textContent || '');
    values.push(card.querySelector('.project-desc')?.textContent || '');
    card.querySelectorAll('.project-category').forEach(cat => values.push(cat.textContent));
    values.push(card.querySelector('[name="card_id"]')?.textContent || '');

    if (!value) {
      card.style.display = 'block';
      return;
    }

    const found = values.some(val => {
      const txt = val.trim().toLowerCase();
      return txt.startsWith(value) || txt.includes(value);
    });

    card.style.display = found ? 'block' : 'none';
  });
});

// ترتيب حسب القيمة المختارة
document.getElementById('sort-select').addEventListener('change', function () {
  const val = this.value;
  let cards = Array.from(document.querySelectorAll('.flip-container'));
  const container = document.getElementById('cards-container');
  if (!container) return;

  // اسم المشروع
  function getProjectName(card) {
    const title = card.querySelector('.project-title');
    return title ? title.childNodes[title.childNodes.length - 1].textContent.trim() : '';
  }

  // متوسط التصويت
  function getAvgVote(card) {
    const votesInfo = card.querySelector('.votes-info');
    if (!votesInfo) return 0;
    const match = votesInfo.textContent.match(/المتوسط\s*:\s*([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  }

  if (val === 'name-asc') {
    cards.sort((a, b) => getProjectName(a).localeCompare(getProjectName(b), 'ar'));
  } else if (val === 'name-desc') {
    cards.sort((a, b) => getProjectName(b).localeCompare(getProjectName(a), 'ar'));
  } else if (val === 'date-newest') {
    cards.sort((a, b) => new Date(b.getAttribute('data-created')) - new Date(a.getAttribute('data-created')));
  } else if (val === 'date-oldest') {
    cards.sort((a, b) => new Date(a.getAttribute('data-created')) - new Date(b.getAttribute('data-created')));
  } else if (val === 'votes-high') {
    // الأعلى حسب المتوسط
    cards.sort((a, b) => getAvgVote(b) - getAvgVote(a));
  } else if (val === 'votes-low') {
    // الأقل حسب المتوسط
    cards.sort((a, b) => getAvgVote(a) - getAvgVote(b));
  }

  cards.forEach(card => container.appendChild(card));
});

// الترتيب الافتراضي عند التحميل (حسب data-card-id)
document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('cards-container');
  const cards = Array.from(container.querySelectorAll('.flip-container'));
  cards.sort((a, b) => Number(a.getAttribute('data-card-id')) - Number(b.getAttribute('data-card-id')));
  cards.forEach(card => container.appendChild(card));
});

// scroll to top
window.onload = function () {
  window.scrollTo(0, 0);
};

document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('cards-container');
  const cards = Array.from(container.querySelectorAll('.flip-container'));

  // رتبهم تصاعديًا حسب data-card-id
  cards.sort((a, b) => {
    return Number(a.getAttribute('data-card-id')) - Number(b.getAttribute('data-card-id'));
  });

  // رتب العناصر داخل الحاوية
  cards.forEach(card => {
    container.appendChild(card);
  });
});

const sidebar = document.getElementById('userSidebar');
const openBtn = document.getElementById('openSidebarBtn');
const closeBtn = document.getElementById('closeSidebarBtn');
const overlay = document.getElementById('sidebarOverlay');

function showSidebar() {
  sidebar.classList.add('active');
  overlay.classList.add('active');
  openBtn.classList.add('hide');
}
function hideSidebar() {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
  openBtn.classList.remove('hide');
}

openBtn.onclick = showSidebar;
closeBtn.onclick = hideSidebar;
overlay.onclick = hideSidebar;

// اختصار كيبورد Esc للإغلاق
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') hideSidebar();
});


// hamburger js function
const hamburger = document.getElementById("hamburger-menu")
hamburger.addEventListener("mouseenter", function () {
  hamburger.classList.add("active")
})
hamburger.addEventListener("mouseleave", function () {
  hamburger.classList.remove("active")
})






document.addEventListener("DOMContentLoaded", () => {
  const get = (id) => document.getElementById(id);
  const exists = (el) => el !== null && el !== undefined;

  const darkModeToggle = get('switch');
  const body = document.body;

  const theHead = get("theHead");
  const theSubHead = get("theSubHead");
  const addProject = get("addProject");

  const hamburgerBTN = get("openSidebarBtn");
  const info_bar = get("info_bar");

  const filter_best = get("filter-best");
  const filter_new = get("filter-new");
  const filter_all = get("filter-all");

  const aside = get("userSidebar");
  const back_to_top = get("btn-3");

  const user_profile = get("user-profile");
  const user_notifications = get("user-notfications");
  const user_profile_edit = get("user-profile-edit");
  const user_logout = get("user-logout");

  const user_profile_li = get("user-profile-li");
  const user_notifications_li = get("user-notfications-li");
  const user_profile_edit_li = get("user-profile-edit-li");

  const add_project_form = get("add-project");
  const add_project_form_btn = get("btn-6");
  const add_project_h3 = get("add_project_h3");
  const add_project_p = get("add_project_p");

  const labels = document.querySelectorAll("label");

  const card = document.querySelectorAll(".project-card");
  const card_explore = document.querySelectorAll(".explore-btn");
  const card_add_comment = document.querySelectorAll(".add-comment");
  const card_show_comment = document.querySelectorAll(".show-comments");
  const card_edit = document.querySelectorAll(".edit-btn");
  const card_title = document.querySelectorAll(".project-title");
  const card_vote_info = document.querySelectorAll(".votes-info");
  const card_maker = document.querySelectorAll(".project-maker");
  const card_maker_svg = document.querySelectorAll(".project-maker-svg");
  const card_category = document.querySelectorAll(".project-category");
  const card_input = document.querySelectorAll("input, textarea, select");

  const back_card = document.querySelectorAll(".card-back");
  const back_card_comment = document.querySelectorAll(".comment-item");
  const back_card_title = document.querySelectorAll(".comments-title");

  const edit_form = document.querySelectorAll(".edit-fields");
  const edit_save_BTN = document.querySelectorAll(".save-btn");
  const edit_cancel_BTN = document.querySelectorAll(".cancel-btn");

  const middle = document.querySelectorAll(".text");
  const sorting = document.querySelectorAll("#search-sort-bar");

  const applyDarkMode = () => {
    body.style.backgroundColor = '#1b1f3b';
    if (exists(theHead)) theHead.style.color = 'white';
    if (exists(theSubHead)) theSubHead.style.color = 'white';
    if (exists(addProject)) addProject.style.background = '#3b3c58';
    if (exists(hamburgerBTN)) hamburgerBTN.style.background = '#3b3c58';
    if (exists(info_bar)) info_bar.style.background = 'rgb(37 47 79)';
    if (exists(filter_best)) filter_best.style.color = 'white';
    if (exists(filter_new)) filter_new.style.color = 'white';
    if (exists(filter_all)) filter_all.style.color = 'white';
    if (exists(aside)) {
      aside.style.background = '#2f3b52';
      aside.style.color = 'white';
    }
    if (exists(back_to_top)) {
      back_to_top.style.background = '#3b3c58';
      back_to_top.style.boxShadow = '0 2px 12px #0001';
    }

    if (exists(user_profile)) user_profile.style.color = 'white';
    if (exists(user_notifications)) user_notifications.style.color = 'white';
    if (exists(user_profile_edit)) user_profile_edit.style.color = 'white';
    if (exists(user_logout)) user_logout.style.color = 'white';

    user_profile_li?.classList.add("hoverd");
    user_notifications_li?.classList.add("hoverd");
    user_profile_edit_li?.classList.add("hoverd");
    filter_all?.classList.add("hoverd-filter-all");
    filter_new?.classList.add("hoverd-filter-new");
    filter_best?.classList.add("hoverd-filter-best");

    if (exists(add_project_form)) {
      add_project_form.style.background = '#2b3a67';
      add_project_form.style.boxShadow = '0 8px 32px #2b3a6742';
    }

    if (exists(add_project_form_btn)) {
      add_project_form_btn.style.background = '#0f1525d6';
      add_project_form_btn.style.boxShadow = '0 2px 8px #1976d220';
    }

    if (exists(add_project_h3)) add_project_h3.style.color = '#fefeff';
    if (exists(add_project_p)) add_project_p.style.color = '#becfff';

    labels.forEach(label => label.style.color = '#fefeff');
    card.forEach(c => c.style.background = '#0f1525');
    card_explore.forEach(btn => btn.classList.add("button-darked"));
    card_add_comment.forEach(btn => btn.classList.add("button-darked"));
    card_show_comment.forEach(btn => btn.classList.add("button-show-comment-darked"));
    card_edit.forEach(btn => btn.classList.add("edit-btn-darked"));
    card_title.forEach(btn => btn.classList.add("card-title-darked"));
    card_vote_info.forEach(btn => btn.classList.add("card-vote-darked"));
    card_maker.forEach(btn => btn.style.color = 'white');
    card_maker_svg.forEach(btn => btn.style.stroke = 'white');
    card_category.forEach(btn => btn.classList.add("card-category-darked"));
    card_input.forEach(btn => btn.classList.add("card-input-darked"));

    back_card.forEach(btn => btn.style.background = '#2b3a67');
    back_card_comment.forEach(btn => btn.classList.add("back-card-comment-darked"));
    back_card_title.forEach(btn => btn.classList.add("back-card-title-darked"));

    edit_form.forEach(card => {
      card.style.background = '#24304a';
      card.style.borderColor = '#24304a';
    });
    edit_save_BTN.forEach(btn => btn.classList.add("edit-save-BTN-darked"));
    edit_cancel_BTN.forEach(btn => btn.classList.add("edit-cancel-BTN-darked"));

    middle.forEach(card => card.style.background = 'rgb(39 53 91)');
    sorting.forEach(card => {
      card.style.background = 'rgb(53 59 107)';
      card.style.boxShadow = 'rgb(53 59 107) 0px 2px 8px';
    });

    const style = document.createElement('style');
    style.innerHTML = `
      ::-webkit-scrollbar {
        width: 10px;
      }
      ::-webkit-scrollbar-thumb {
        background-color: rgb(11 18 39); 
        border-radius: 10px;
      }
      ::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgb(13 18 28);
      }
    `;
    document.head.appendChild(style);

    if (filter_best?.classList.contains("active-filter")) {
      filter_best.classList.replace("active-filter", "active-filter-darked");
    } else if (filter_new?.classList.contains("active-filter")) {
      filter_new.classList.replace("active-filter", "active-filter-darked");
    } else if (filter_all?.classList.contains("active-filter")) {
      filter_all.classList.replace("active-filter", "active-filter-darked");
    }
  };

  const removeDarkMode = () => {
    localStorage.setItem('darkMode', 'false');
    body.style.backgroundColor = '';

    [theHead, theSubHead, addProject, hamburgerBTN, info_bar, filter_best, filter_new, filter_all, aside, back_to_top,
      user_profile, user_notifications, user_profile_edit, user_logout, add_project_form, add_project_form_btn, add_project_h3, add_project_p]
      .forEach(el => { if (exists(el)) { el.removeAttribute("style"); } });

    [user_profile_li, user_notifications_li, user_profile_edit_li].forEach(el => el?.classList.remove("hoverd"));
    [filter_all, filter_new, filter_best].forEach(el => {
      el?.classList.remove("hoverd-filter-all", "hoverd-filter-new", "hoverd-filter-best");
    });

    labels.forEach(label => label.style.color = '');
    card.forEach(c => c.style.background = '');
    card_explore.forEach(btn => btn.classList.remove("button-darked"));
    card_add_comment.forEach(btn => btn.classList.remove("button-darked"));
    card_show_comment.forEach(btn => btn.classList.remove("button-show-comment-darked"));
    card_edit.forEach(btn => btn.classList.remove("edit-btn-darked"));
    card_title.forEach(btn => btn.classList.remove("card-title-darked"));
    card_vote_info.forEach(btn => btn.classList.remove("card-vote-darked"));
    card_maker.forEach(btn => btn.style.color = '');
    card_maker_svg.forEach(btn => btn.style.stroke = '');
    card_category.forEach(btn => btn.classList.remove("card-category-darked"));
    card_input.forEach(btn => btn.classList.remove("card-input-darked"));
    back_card.forEach(btn => btn.style.background = '');
    back_card_comment.forEach(btn => btn.classList.remove("back-card-comment-darked"));
    back_card_title.forEach(btn => btn.classList.remove("back-card-title-darked"));
    sorting.forEach(card => {
      card.style.background = '';
      card.style.boxShadow = 'rgb(227, 232, 238) 0px 2px 8px';
    });

    edit_form.forEach(card => {
      card.style.background = '';
      card.style.borderColor = '';
    });
    edit_save_BTN.forEach(btn => btn.classList.remove("edit-save-BTN-darked"));
    edit_cancel_BTN.forEach(btn => btn.classList.remove("edit-cancel-BTN-darked"));
    middle.forEach(card => card.style.background = '');

    const style = document.createElement('style');
    style.innerHTML = `
      ::-webkit-scrollbar {
        width: 10px;
        background: rgb(242, 243, 247);
      }
      ::-webkit-scrollbar-thumb {
        background: rgb(146, 164, 236);
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #8b9ff0;
      }
    `;
    document.head.appendChild(style);

    if (filter_best?.classList.contains("active-filter-darked")) {
      filter_best.classList.replace("active-filter-darked", "active-filter");
    } else if (filter_new?.classList.contains("active-filter-darked")) {
      filter_new.classList.replace("active-filter-darked", "active-filter");
    } else if (filter_all?.classList.contains("active-filter-darked")) {
      filter_all.classList.replace("active-filter-darked", "active-filter");
    }
  };

  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (darkModeToggle) {
    darkModeToggle.checked = isDarkMode;
    if (isDarkMode) applyDarkMode();

    darkModeToggle.addEventListener('change', () => {
      localStorage.setItem('darkMode', darkModeToggle.checked.toString());
      if (darkModeToggle.checked) {
        applyDarkMode();
      } else {
        removeDarkMode();
      }
    });
  }
});
