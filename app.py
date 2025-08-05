from flask import Flask, render_template, request, redirect, url_for, session, Response , jsonify
import mysql.connector 
from mysql.connector import Error
from flask_mail import Mail, Message
import random
from config import Config
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash , check_password_hash
import os
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
import random, string







db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="1111",
    database="swatly"
)


app = Flask(__name__)
app.config.from_object(Config)
mail = Mail(app)
app.config['UPLOAD_FOLDER'] = 'static/uploads'


users = {}  # قاعدة بيانات مؤقتة (يمكن استبدالها بقاعدة بيانات حقيقية)



@app.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')  # إذا عندك صفحة HTML خاصة بالشات بوت



@app.route('/', methods=['GET', 'POST'])
def login_signup():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="1111",
            database="swatly"
        )
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM users")
        num_users = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM votes")
        num_votes = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM comments")
        num_comments = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM cards_data")
        num_cards = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT project_make_name) FROM cards_data")
        unique_names_count = cursor.fetchone()[0]

        dates = []

        cursor.execute("SELECT MAX(created_at) FROM users")
        user_date = cursor.fetchone()[0]
        if user_date:
            dates.append(user_date)

        cursor.execute("SELECT MAX(created_at) FROM votes")
        vote_date = cursor.fetchone()[0]
        if vote_date:
            dates.append(vote_date)

        cursor.execute("SELECT MAX(created_at) FROM comments")
        comment_date = cursor.fetchone()[0]
        if comment_date:
            dates.append(comment_date)

        cursor.execute("SELECT MAX(created_at) FROM cards_data")
        cards_date = cursor.fetchone()[0]
        if cards_date:
            dates.append(cards_date)

       # Format latest time ago
        if dates:
            latest = max(dates)
            now = datetime.now()
            diff = now - latest
            seconds = diff.total_seconds()

            if seconds < 60:
                latest_date = f"منذ {int(seconds)} ثانية"
            elif seconds < 3600:
                minutes = int(seconds // 60)
                latest_date = f"منذ {minutes} دقيقة"
            elif seconds < 86400:
                hours = int(seconds // 3600)
                latest_date = f"منذ {hours} ساعة"
            else:
                days = int(seconds // 86400)
                latest_date = f"منذ {days} يوم"
        else:
            latest_date = "لا يوجد تاريخ"

        cursor.close()
        conn.close()
    except Exception as e:
        num_users = num_votes = num_comments = num_cards = unique_names_count = 0
        latest_date = "خطأ في قاعدة البيانات"

    message = session.pop('message', None) if 'message' in session else None
    warning_message = session.pop('warning_message', None) if 'warning_message' in session else None


    return render_template(
        'login_signup.html',
        num_users=num_users,
        num_votes=num_votes,
        num_comments=num_comments,
        num_cards=num_cards,
        unique_names_count=unique_names_count,
        latest_date=latest_date 
        , message=message, warning_message=warning_message
    )




app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:1111@localhost/swatly'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        session['username'] = username  
        password = request.form.get('password')

        try:
            conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="1111",
            database="swatly"
        )
            cursor = conn.cursor()

            cursor.execute("SELECT * FROM users WHERE name = %s", (username,))
            existing_user = cursor.fetchone()

            cursor.execute("SELECT email FROM users WHERE name = %s", (username,))
            user_email = cursor.fetchone()



            cursor.execute("SELECT avatar_url FROM users WHERE name = %s", (username,))
            row = cursor.fetchone()
            avatar_url = row[0] if row else None


            if user_email is not None:
              user_email = user_email[0]
            session['user_email'] = user_email

            if existing_user:
                user_id = existing_user[0]
                stored_password = existing_user[3]
                if check_password_hash(stored_password, password):  # آمن
                    session['username'] = username
                    session['user_id'] = user_id

                    cursor.close()

                    conn = mysql.connector.connect(
                        host="localhost",
                        user="root",
                        password="1111",
                        database="swatly"
                    )
                    cursor = conn.cursor(dictionary=True)
                    cursor.execute("SELECT * FROM cards_data")
                    cards_data = cursor.fetchall()
                    cards_count = len(cards_data)

                    cursor.execute("SELECT COUNT(*) AS count FROM notifications WHERE reciever = %s AND is_read = 0", (username,))
                    result = cursor.fetchone()
                    notifications_count = result['count'] if result else 0
                    session['notifications_count'] = notifications_count

 

                    for card in cards_data:
                        cursor.execute("SELECT comment_text, user_name, created_at FROM comments WHERE card_id = %s", (card['id'],))
                        card['comments'] = cursor.fetchall()

                        cursor.execute("SELECT AVG(vote_value) AS avg_vote, COUNT(*) AS votes_count FROM votes WHERE card_id=%s", (card['id'],))
                        row = cursor.fetchone()
                        card['avg_vote'] = round(float(row['avg_vote']) if row['avg_vote'] is not None else 0, 2)
                        card['votes_count'] = int(row['votes_count'] or 0)

                        cursor.execute("SELECT vote_value FROM votes WHERE user_id=%s AND card_id=%s", (user_id, card['id']))
                        v = cursor.fetchone()
                        card['already_voted'] = bool(v)
                        card['user_vote'] = v['vote_value'] if v else 0



                    # ترتيب الكروت حسب أعلى متوسط تصويت فقط
                    cards_data.sort(key=lambda x: x['avg_vote'], reverse=True)
                    
                    current_rank = 1
                    i = 0
                    while i < len(cards_data) and current_rank <= 3:
                        same_avg_cards = [cards_data[i]]
                        j = i + 1
                        while j < len(cards_data) and cards_data[j]['avg_vote'] == cards_data[i]['avg_vote']:
                            same_avg_cards.append(cards_data[j])
                            j += 1
                        for card in same_avg_cards:
                            card['rank'] = current_rank
                        current_rank += 1
                        i = j
                    for card in cards_data:
                        if not card.get('rank'):
                            card['rank'] = None

                    cursor.close()
                    conn.close()
                    return render_template(
                        "swatly.html", 
                        cards=cards_data, 
                        username=username, 
                        cards_count=cards_count, 
                        session_user_id=session.get('user_id') ,
                        user_email=user_email ,
                        avatar_url=avatar_url,
                        notifications_count=notifications_count
                    )
                else:
                    session['warning_message'] = "كلمة المرور غير صحيحة"
                    return redirect(url_for('login_signup'))
            else:
                return render_template("User_not_founded.html", username=username)

        except Exception as e:
            session['warning_message'] = "خطأ في قاعدة البيانات"
            return f'database error: {str(e)}'


    return render_template("login_signup.html")


@app.route('/winners')
def winners():
    return render_template('winners.html')


@app.route('/users-profiles')
def users_profiles():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="1111",
            database="swatly"
        )
        cursor = conn.cursor(dictionary=True)
        username = session['username']
        user_id = session['user_id']

        cursor.execute("SELECT COUNT(*) AS count FROM cards_data WHERE user_name = %s", (username,))
        num_cards = cursor.fetchone()['count']

        cursor.execute("SELECT avatar_url FROM users WHERE name = %s", (username,))
        row = cursor.fetchone()
        avatar_url = row['avatar_url'] if row else None


        # نحسب عدد التعليقات التي استلمها المستخدم على مشاريعه
        cursor.execute("""
            SELECT COUNT(comments.id) AS count
            FROM comments
            JOIN cards_data ON comments.card_id = cards_data.id
            WHERE cards_data.user_name = %s
        """, (username,))
        num_comments = cursor.fetchone()['count']
        
        # نحسب عدد التصويتات التي استلمها المستخدم على مشاريعه
        cursor.execute("""
            SELECT COUNT(votes.id) AS count
            FROM votes
            JOIN cards_data ON votes.card_id = cards_data.id
            WHERE cards_data.user_name = %s
        """, (username,))
        num_votes = cursor.fetchone()['count']
        

        cursor.execute("SELECT email FROM users WHERE name = %s", (username,))
        user_email = cursor.fetchone()
        if user_email is not None:
            user_email = user_email['email']
        session['user_email'] = user_email

        cursor.execute("SELECT * FROM cards_data WHERE user_name = %s", (username,))
        cards_data = cursor.fetchall()
        for card in cards_data:
            cursor.execute("SELECT comment_text, user_name, created_at FROM comments WHERE card_id = %s", (card['id'],))
            card['comments'] = cursor.fetchall()
            cursor.execute("SELECT AVG(vote_value) AS avg_vote, COUNT(*) AS votes_count FROM votes WHERE card_id=%s", (card['id'],))
            row = cursor.fetchone()
            card['avg_vote'] = round(float(row['avg_vote']) if row['avg_vote'] is not None else 0, 2)
            card['votes_count'] = int(row['votes_count'] or 0)
            cursor.execute("SELECT vote_value FROM votes WHERE user_id=%s AND card_id=%s", (user_id, card['id']))
            v = cursor.fetchone()
            card['already_voted'] = bool(v)
            card['user_vote'] = v['vote_value'] if v else 0

        # ترتيب الكروت حسب أعلى متوسط تصويت فقط
        cards_data.sort(key=lambda x: x['avg_vote'], reverse=True)

        current_rank = 1
        i = 0
        while i < len(cards_data) and current_rank <= 3:
            same_avg_cards = [cards_data[i]]
            j = i + 1
            while j < len(cards_data) and cards_data[j]['avg_vote'] == cards_data[i]['avg_vote']:
                same_avg_cards.append(cards_data[j])
                j += 1
            for card in same_avg_cards:
                card['rank'] = current_rank
            current_rank += 1
            i = j
        for card in cards_data:
            if not card.get('rank'):
                card['rank'] = None

        cursor.close()
        conn.close()
    except Exception as e:
        num_cards = num_comments = num_votes = 0
        cards_data = []
        return f"database error: {e}"

    return render_template(
        'users-profiles.html',
        num_cards=num_cards,
        num_comments=num_comments,
        num_votes=num_votes,
        cards=cards_data,
        username=username,
        session_user_id=session.get('user_id'),
        user_email=user_email,
        message=session.pop('message', None),
        warning_message=session.pop('warning_message', None) ,
        avatar_url=avatar_url
    )






@app.route("/show_data")
def show_data():
    message = session.pop('message', None)
    user_id = session.get('user_id')
    avatar_url = None 
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="1111",
            database="swatly"
        )
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM cards_data")
        cards_data = cursor.fetchall()
        cards_count = len(cards_data)

        cursor.execute("SELECT avatar_url FROM users WHERE id = %s" ,(user_id,))
        row = cursor.fetchone()
        avatar_url = row['avatar_url'] if row else None
        
        for card in cards_data:
            cursor.execute("SELECT comment_text, user_name, created_at FROM comments WHERE card_id = %s", (card['id'],))
            card['comments'] = cursor.fetchall()
        
            cursor.execute("SELECT AVG(vote_value) AS avg_vote, COUNT(*) AS votes_count FROM votes WHERE card_id=%s", (card['id'],))
            row = cursor.fetchone()
            card['avg_vote'] = round(float(row['avg_vote']) if row['avg_vote'] is not None else 0, 2)
            card['votes_count'] = int(row['votes_count'] or 0)

            if user_id:
                cursor.execute("SELECT vote_value FROM votes WHERE user_id=%s AND card_id=%s", (user_id, card['id']))
                v = cursor.fetchone()
                card['already_voted'] = bool(v)
                card['user_vote'] = v['vote_value'] if v else 0
            else:
                card['already_voted'] = False
                card['user_vote'] = 0
        
        cursor.close()
        conn.close()

        # ترتيب الكروت حسب أعلى متوسط تصويت فقط
        cards_data.sort(key=lambda x: x['avg_vote'], reverse=True)
        
        current_rank = 1
        i = 0
        while i < len(cards_data) and current_rank <= 3:
            same_avg_cards = [cards_data[i]]
            j = i + 1
            while j < len(cards_data) and cards_data[j]['avg_vote'] == cards_data[i]['avg_vote']:
                same_avg_cards.append(cards_data[j])
                j += 1
            for card in same_avg_cards:
                card['rank'] = current_rank
            current_rank += 1
            i = j
        for card in cards_data:
            if not card.get('rank'):
                card['rank'] = None

    except Exception as e:
        print("Database error:", e)
        cards_data = []
        cards_count = 0
    warning_message = session.pop('warning_message', None)


    return render_template(
        'swatly.html',
        message=message,
        cards=cards_data,
        cards_count=cards_count,
        session_user_id=session.get('user_id'),
        warning_message=warning_message ,
        avatar_url=avatar_url ,
        notifications_count=session['notifications_count'],
    )



@app.route('/add_comment', methods=['POST'])
def add_comment():
    comment_text = request.form.get('comment-input')
    card_id = request.form.get('card_id')
    user_id = session.get('user_id') 
    username = session.get('username')       

    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="1111",
            database="swatly"
        )
        with conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO comments (card_id, comment_text, user_id, user_name)
                    VALUES (%s, %s, %s, %s)
                """, (card_id, comment_text, user_id, username))

                cursor.execute("SELECT user_name FROM cards_data WHERE id = %s", (card_id,))
                result = cursor.fetchone()
                if result:
                    receiver_name = result[0]  
                    message = f"قام {username} بكتابة تعليق على كارتك."

                    cursor.execute("SELECT user_id FROM cards_data WHERE id = %s", (card_id,))
                    reciever_id = cursor.fetchone()[0]
                    cursor.execute("""
                        INSERT INTO notifications (user_id, reciever, message,reciever_id)
                        VALUES (%s, %s, %s,%s)
                    """, (user_id, receiver_name, message, reciever_id))

            conn.commit()
        session['message'] = "تم إضافة تعليقك إلى الكارت بنجاح."
        return redirect(url_for('show_data'))

    except Exception as e:
        session['warning_message'] = "حدث خطأ أثناء إضافة التعليق. يرجى المحاولة مرة أخرى."
        return redirect('show_data')




@app.route('/add_project', methods=['GET', 'POST'])
def add_project():
    if request.method == 'POST':
        project_name = request.form.get('project_name')
        project_description = request.form.get('project_desc')
        project_url = request.form.get('project_url')
        project_category = request.form.get('project_category')
        project_make_name = request.form.get('project_make_name')
        project_email = request.form.get('project_email')
        image = request.files['project_img']
        image_filename = None
        user_id = session.get('user_id')  
        user_name = session.get('username')  


        try:
            conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1111",
                database="swatly"
            )
            if image and image.filename:
              filename = secure_filename(image.filename)
              folder = os.path.join(app.root_path, 'static', 'uploads')
              os.makedirs(folder, exist_ok=True)
              image_path = os.path.join(folder, filename)
              image.save(image_path)
              image_filename = filename
            else:
              image_filename = None
            cursor = conn.cursor()
            query = """
                INSERT INTO cards_data (
                    project_name, project_desc, project_url,
                    project_category, project_make_name, project_email , card_img , user_id , user_name
                ) VALUES (%s, %s, %s, %s ,%s, %s ,%s , %s , %s)
            """
            cursor.execute(query, (
                project_name, project_description, project_url,
                project_category, project_make_name, project_email , image_filename , user_id , user_name
            ))
            conn.commit()
            session['message'] = "تم اضافة مشروعك الي موقعنا بنجاح"
            cursor.close()
            conn.close()
            return redirect('show_data')
        except Error as e:
            session['warning_message'] = "حدث خطأ أثناء إضافة المشروع. يرجى المحاولة مرة أخرى."
            return redirect('show_data')

    return render_template('swatly.html')


@app.route('/save_edits', methods=['GET', 'POST'])
def save_edits():
    if request.method == 'POST':
        card_id = request.form['card_id']
        fields = {}
        # اجمع الحقول غير الفارغة فقط
        if request.form.get('new_project_name'):
            fields['project_name'] = request.form.get('new_project_name')
        if request.form.get('new_project_desc'):
            fields['project_desc'] = request.form.get('new_project_desc')
        if request.form.get('new_project_url'):
            fields['project_url'] = request.form.get('new_project_url')
        if request.form.get('new_project_category'):
            fields['project_category'] = request.form.get('new_project_category')
        if request.form.get('new_project_make_name'):
            fields['project_make_name'] = request.form.get('new_project_make_name')
        if request.form.get('new_project_email'):
            fields['project_email'] = request.form.get('new_project_email')

        new_image = request.files.get('new_project_img')
        if new_image and new_image.filename:
            filename = secure_filename(new_image.filename)
            folder = os.path.join(app.root_path, 'static', 'uploads')
            os.makedirs(folder, exist_ok=True)
            image_path = os.path.join(folder, filename)
            new_image.save(image_path)
            fields['card_img'] = filename

        if not fields:
            session['warning_message'] = "لم يتم تعديل أي بيانات"
            return redirect('show_data')

        try:
            conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1111",
                database="swatly"
            )
            cursor = conn.cursor()

            # بناء جملة التحديث ديناميكيًا حسب الحقول المدخلة
            set_clause = ", ".join([f"{field}=%s" for field in fields])
            query = f"UPDATE cards_data SET {set_clause} WHERE id=%s"
            values = list(fields.values()) + [card_id]

            cursor.execute(query, values)
            conn.commit()
            session['message'] = "تم تغيير بيانات مشروعك بنجاح"
            cursor.close()
            conn.close()
            return redirect('show_data')
        except Exception as e:
            session['warning_message'] = "لم يتم تعديل أي بيانات"
            return redirect('show_data')
    return render_template('swatly.html')



@app.route('/save_edits_profiles', methods=['GET', 'POST'])
def save_edits_profiles():
    if request.method == 'POST':
        card_id = request.form['card_id']
        fields = {}
        # اجمع الحقول غير الفارغة فقط
        if request.form.get('new_project_name'):
            fields['project_name'] = request.form.get('new_project_name')
        if request.form.get('new_project_desc'):
            fields['project_desc'] = request.form.get('new_project_desc')
        if request.form.get('new_project_url'):
            fields['project_url'] = request.form.get('new_project_url')
        if request.form.get('new_project_category'):
            fields['project_category'] = request.form.get('new_project_category')
        if request.form.get('new_project_make_name'):
            fields['project_make_name'] = request.form.get('new_project_make_name')
        if request.form.get('new_project_email'):
            fields['project_email'] = request.form.get('new_project_email')

        new_image = request.files.get('new_project_img')
        if new_image and new_image.filename:
            filename = secure_filename(new_image.filename)
            folder = os.path.join(app.root_path, 'static', 'uploads')
            os.makedirs(folder, exist_ok=True)
            image_path = os.path.join(folder, filename)
            new_image.save(image_path)
            fields['card_img'] = filename

        if not fields:
            session['warning_message'] = "لم يتم تعديل أي بيانات"
            return render_template('users-profiles.html')

        try:
            conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1111",
                database="swatly"
            )
            cursor = conn.cursor()

            # بناء جملة التحديث ديناميكيًا حسب الحقول المدخلة
            set_clause = ", ".join([f"{field}=%s" for field in fields])
            query = f"UPDATE cards_data SET {set_clause} WHERE id=%s"
            values = list(fields.values()) + [card_id]

            cursor.execute(query, values)
            conn.commit()
            session['message'] = "تم تغيير بيانات مشروعك بنجاح"
            cursor.close()
            conn.close()
            return redirect(url_for('users_profiles'))
        except Exception as e:
            session['warning_message'] = "لم يتم تعديل أي بيانات"
            return render_template('users-profiles.html')
    return render_template('users-profiles.html')



@app.route('/getcode', methods=['GET', 'POST'])
def getcode():
    if request.method == 'POST':
        email = request.form['email']
        username = request.form.get('username')
        otp = str(random.randint(100000, 999999))
        session['otp'] = otp
        session['email'] = email
        created_at = datetime.now()
        session['otp_created_at'] = created_at.isoformat()


        session['username'] = request.form['username']
        session['email'] = request.form['email']
        session['password'] = request.form['password']


        conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1111",
                database="swatly"
            )
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        if existing_user:
          return render_template("Email_used.html", email_exists=True)
        
        # OTP expires in 10 minutes
        expiry_time = created_at + timedelta(minutes=10)
        expiry_timestamp = int(expiry_time.timestamp() * 1000)

        msg = Message('OTP Verification Code',
                      sender=app.config['MAIL_USERNAME'],
                      recipients=[email])
        msg.body = f'''مرحبًا {username}،

لقد طلبت رمز تحقق لتسجيل الدخول أو إكمال عملية معينة على موقعنا.

يرجى استخدام رمز التحقق التالي (OTP):

كود التحقق الخاص بك هو: {otp}

هذا الرمز صالح لمدة 10 دقائق فقط. لا تشارك هذا الرمز مع أي شخص.

إذا لم تطلب هذا الكود، يمكنك تجاهل هذه الرسالة.

مع تحياتنا،  
فريق الدعم
'''

        mail.send(msg)

        # Pass expiry timestamp in milliseconds
        return render_template('OTP_Form.html', email=email, expiry_timestamp=expiry_timestamp)

    return render_template('OTP_Form.html', email=session.get('email'))


@app.route('/resend_new_otp', methods=['GET', 'POST'])
def resend_new_otp():
    if request.method == 'POST':
        email = session['email']
        username = session['username']
        otp = str(random.randint(100000, 999999))
        session['otp'] = otp
        created_at = datetime.now()
        session['otp_created_at'] = created_at.isoformat()
        conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1111",
                database="swatly"
            )
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        if existing_user:
          return render_template("Email_used.html", email_exists=True)
        
        # OTP expires in 10 minutes
        expiry_time = created_at + timedelta(minutes=10)
        expiry_timestamp = int(expiry_time.timestamp() * 1000)

        msg = Message('OTP Verification Code',
                      sender=app.config['MAIL_USERNAME'],
                      recipients=[email])
        msg.body = f'''مرحبًا {username}،

لقد طلبت كود التحقق مرة أخرى لإكمال عملية التسجيل أو التحقق على موقعنا.

رمز التحقق الجديد الخاص بك هو: {otp}

هذا الرمز صالح لمدة 10 دقائق فقط. يرجى عدم مشاركته مع أي شخص.

إذا لم تطلب هذا الكود، يمكنك تجاهل هذه الرسالة.

مع تحياتنا،
فريق الدعم
'''

        mail.send(msg)

        # Pass expiry timestamp in milliseconds
        return render_template('OTP_Form.html', email=email, expiry_timestamp=expiry_timestamp)

    return render_template('OTP_Form.html', email=session.get('email'))


@app.route('/vote', methods=['POST'])
def vote():
    data = request.get_json()
    user_id = session.get('user_id')
    user_name = session['username']
    card_id = data['card_id']
    vote_value = data['vote']

    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="1111",
        database="swatly"
    )
    cursor = conn.cursor()

    try:
        # 1. حاول إضافة تصويت جديد
        cursor.execute(
            "INSERT INTO votes (user_id, card_id, user_name, vote_value) VALUES (%s, %s, %s, %s)",
            (user_id, card_id, user_name, vote_value)
        )

        # 2. احصل على اسم صاحب الكارت
        cursor.execute("SELECT user_name FROM cards_data WHERE id = %s", (card_id,))
        card_owner = cursor.fetchone()
        receiver_name = card_owner[0] if card_owner else None

        # 3. إضافة إشعار
        if receiver_name:
            cursor.execute("SELECT vote_value FROM votes WHERE user_id = %s AND card_id = %s", (user_id, card_id))
            vote_row = cursor.fetchone()
            vote_value = vote_row[0] if vote_row else 0

            message = f"قام {user_name} بالتصويت على كارتك بـ {vote_value} نجمة."
            cursor.execute("SELECT user_id FROM cards_data WHERE id = %s", (card_id,))
            reciever_id = cursor.fetchone()[0]
            cursor.execute("""
                INSERT INTO notifications (user_id, reciever, message, reciever_id)
                VALUES (%s, %s, %s,%s)
            """, (user_id, receiver_name, message,reciever_id))

        conn.commit()
        user_vote = vote_value
        success = True
        message = 'تم التصويت بنجاح'

    except mysql.connector.IntegrityError:
        # إذا كان المستخدم صوت قبل كده، هات التصويت القديم
        cursor.execute(
            "SELECT vote_value FROM votes WHERE user_id=%s AND card_id=%s",
            (user_id, card_id)
        )
        row = cursor.fetchone()
        user_vote = row[0] if row else 0
        success = False
        message = 'لقد قمت بالتصويت لهذا المشروع من قبل!'

    # حساب المتوسط وعدد التصويتات للكارت
    cursor.execute(
        "SELECT AVG(vote_value), COUNT(*) FROM votes WHERE card_id=%s", (card_id,)
    )
    avg_vote, votes_count = cursor.fetchone()
    avg_vote = round(float(avg_vote) if avg_vote is not None else 0, 2)
    votes_count = int(votes_count or 0)

    cursor.close()
    conn.close()

    return jsonify({
        'success': success,
        'message': message,
        'user_vote': user_vote,
        'avg_vote': avg_vote,
        'votes_count': votes_count
    })


@app.route('/image/<int:card_id>')
def serve_image(card_id):
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="1111",
        database="swatly"
    )
    cursor = conn.cursor()
    cursor.execute("SELECT card_img FROM cards_data WHERE id = %s", (card_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row and row[0]:
        return Response(row[0], mimetype='image/jpeg')  # غير الامتداد لو عندك png
    else:
        return '', 404

@app.route('/verification', methods=['GET', 'POST'])
def verification():
    if request.method == 'POST':
        otp = ''.join([
            request.form.get('otp1', ''),
            request.form.get('otp2', ''),
            request.form.get('otp3', ''),
            request.form.get('otp4', ''),
            request.form.get('otp5', ''),
            request.form.get('otp6', '')
          ])
        otp_created_at = session.get('otp_created_at')

        # تحقق من وجود وقت الإنشاء
        if not otp_created_at:
            return render_template("OTP_expired.html")  

        created_time = datetime.fromisoformat(otp_created_at)

        # تحقق من انتهاء صلاحية الكود (مثلاً 10 دقائق)
        if datetime.now() - created_time > timedelta(minutes=10):
            return render_template("OTP_expired.html")
        

        # تحقق من صحة الكود
        if otp == session.get('otp'):
            users[session.get('email')] = True
            

            try:
                conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1111",
                database="swatly"
            )
                cursor = conn.cursor()

                userName = session.get('username')
                email = session.get('email')
                password = session.get('password')
                hashed_password = generate_password_hash(password)
                    
                
        
                query = "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)"
                cursor.execute(query, (userName, email, hashed_password))
                user_id = cursor.lastrowid
                message = 'مرحبًا بك! تم إنشاء حسابك بنجاح.'
                cursor.execute("INSERT INTO notifications (user_id, message ,reciever_id,reciever) VALUES ('0', %s ,%s, %s)", ( message,user_id,userName))
                conn.commit()
                cursor.close()
                conn.close()
            except Exception as e:
                session['warning_message'] = "فشل انشاء حساب جديد . يرجى المحاولة مرة أخرى."
                print(e)
                return render_template("OTP_Form.html" , warning_message=session['warning_message'])
                
            return render_template("avatar.html")
        else:
            return render_template("OTP_failed.html")

    return redirect('verification')


@app.route('/retry', methods=['POST'])
def retry():
    return render_template("OTP_Form.html", warning_message="برجاء إدخال الكود الصحيح للتحقق من الهوية.")

@app.route('/Enter_email')
def Enter_email():
    return render_template('Enter_email.html')


def generate_token(length=48):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


@app.route('/sent_email', methods=['GET', 'POST'])
def sent_email():
    if request.method == 'POST':
        email = request.form.get('email')
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="1111",
            database="swatly"
        )
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            return render_template('Enter_email.html', error="البريد الإلكتروني غير مسجل لدينا")

        # توليد التوكن وتحديثه في جدول users
        token = generate_token()
        expires_at = datetime.now() + timedelta(minutes=30)
        cursor.execute(
            "UPDATE users SET reset_token=%s, reset_expires=%s WHERE email=%s",
            (token, expires_at, email)
        )# token for a unique link for the user
        conn.commit()

        # بناء الرابط
        base_url = request.url_root.strip('/')
        link = f"{base_url}/reset_password/{token}"

        msg = Message(subject="رابط إعادة تعيين كلمة المرور", recipients=[email])
        msg.body = f"اضغط على الرابط لإعادة تعيين كلمة المرور: {link}\n\nهذا الرابط صالح لمدة 30 دقيقة فقط."     
        mail.send(msg)
        cursor.close()
        conn.close()
        return render_template('sent_msg_to_email.html', email=email)
    return render_template('Enter_email.html')


@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="1111",
        database="swatly"
    )
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE reset_token=%s", (token,))
    user = cursor.fetchone()

    if not user or not user['reset_expires'] or datetime.now() > user['reset_expires']:
        cursor.close()
        conn.close()
        return render_template("reset_password_link_expired.html")

    if request.method == 'POST':
        new_password = request.form.get('new-password')
        hashed_password = generate_password_hash(new_password)
        cursor2 = conn.cursor()
        cursor2.execute(
            "UPDATE users SET password=%s, reset_token=NULL, reset_expires=NULL WHERE email=%s",
            (hashed_password, user['email'])
        )
        conn.commit()
        cursor2.close()
        cursor.close()
        conn.close()
    cursor.close()
    conn.close()
    return render_template('Reset_password.html', email=user['email'])



@app.route('/save_password', methods=['POST'])
def save_password():
    if request.method == 'POST':
        new_password = request.form.get('new-password')
        email = request.form.get('email')
        user_name = session.get("username")

        try:
            conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1111",
                database="swatly"
            )
            cursor = conn.cursor()
            hashed_password = generate_password_hash(new_password)


            query = "UPDATE users SET password = %s WHERE email = %s"
            cursor.execute(query, (hashed_password, email))

            message = 'تم تغيير كلمة المرور الخاصة بك بنجاح.'
            cursor.execute("SELECT id FROM users WHERE name = %s", (user_name,))
            reciever_id = cursor.fetchone()[0]
            cursor.execute("INSERT INTO notifications (user_id, message ,reciever_id,reciever) VALUES ('0', %s ,%s, %s)", (message ,reciever_id,user_name))

            conn.commit()
            cursor.close()
            conn.close()
            return render_template('new_password_saved.html')
        except Error as e:
            print(e)
            return render_template('new_password_failed.html')


@app.route('/About_us')
def About_us():
    return render_template('About_us.html')


@app.route('/admin-verification')
def admin_verification():
    return render_template('admin-verification.html')


@app.route('/admin-dashboard', methods=['GET', 'POST'])
def admin_dashboard():
    if request.method == 'POST':
        admin_name = request.form.get('username')
        admin_password = request.form.get('admin_password')

        if admin_name == 'admin' and admin_password == '123456':
            conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1111",
                database="swatly"
            )
            cursor = conn.cursor()
        
            # جلب أسماء جميع الجداول
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
        
            # ترتيب البيانات لعرضها بشكل منظم
            table_names = [table[0] for table in tables]
            data = {}

            cursor.execute("SELECT COUNT(*) FROM users")
            num_users = cursor.fetchone()[0]
    
            cursor.execute("SELECT COUNT(*) FROM votes")
            num_votes = cursor.fetchone()[0]
    
            cursor.execute("SELECT COUNT(*) FROM comments")
            num_comments = cursor.fetchone()[0]
    
            cursor.execute("SELECT COUNT(*) FROM cards_data")
            num_cards = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM suggestions")
            num_suggestions = cursor.fetchone()[0]
        
            for table_name in table_names:
                cursor.execute(f"SELECT * FROM `{table_name}`")
                rows = cursor.fetchall()
                columns = [col[0] for col in cursor.description]
                data[table_name] = {'columns': columns, 'rows': rows}
        
            cursor.close()
            conn.close()
            return render_template('admin-dashboard.html' , data=data , num_users=num_users, num_votes=num_votes, num_comments=num_comments, num_cards=num_cards, num_suggestions=num_suggestions)
        else:
            session['warning_message'] = "اسم المستخدم أو كلمة المرور غير صحيحة"
            return redirect(url_for('admin_dashboard'))  # إعادة توجيه للـ GET

    warning_message = session.pop('warning_message', None)  # احذف الرسالة بعد أول عرض
    return render_template('admin-verification.html', warning_message=warning_message)





@app.route('/suggestion', methods=['POST'])
def suggestion():
    name = request.form.get('suggestion-name')
    suggestion_text = request.form.get('suggestion')

    if suggestion_text:
        try:
            conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1111",
                database="swatly"
            )
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO suggestions (name, suggestion_text) VALUES (%s, %s)",
                (name, suggestion_text)
            )
            conn.commit()
            cursor.close()
            conn.close()

            session['message'] = 'شكرا لمشاركتك اقتراحك معنا !'
            return redirect(url_for('login_signup'))

        except Error as e:
            session['warning_message'] = 'للأسف لم يتم ارسال اقتراحك'
            return redirect(url_for('login_signup'))

    session['warning_message'] = 'للأسف لم يتم ارسال اقتراحك'
    return redirect(url_for('login_signup'))


@app.route('/save-avatar', methods=['POST'])
def save_avatar():
    selected_avatar = request.form.get('selected_avatar')
    uploaded_file = request.files.get('avatar_file')

    avatar_url = None

    # Priority: uploaded image
    if uploaded_file and uploaded_file.filename != '':
        filename = secure_filename(uploaded_file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        uploaded_file.save(save_path)
        avatar_url = '/' + save_path  # Save relative path (for displaying)
    elif selected_avatar:
        avatar_url = selected_avatar

    if avatar_url:
        try:
            conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1111",
                database="swatly"
            )
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET avatar_url = %s", (avatar_url,))
            conn.commit()
            cursor.close()
            conn.close()
            return render_template("OTP_success.html")
        except Exception as e:
            return render_template("no_avatar_added.html")
    else:
        return render_template("added_avatar_failed.html")


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('email', None)
    session.pop('otp', None)
    session.pop('otp_created_at', None)
    session.pop('message', None)
    session.pop('warning_message', None)
    return redirect(url_for('login_signup'))



@app.route('/profile_edit')
def profile_edit():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="1111",
            database="swatly"
        )
        cursor = conn.cursor()
        user_id = session.get('user_id')

        cursor.execute("SELECT name, email, avatar_url FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        name, email, avatar_url = row

        # إعداد رابط الصورة
        if avatar_url and avatar_url.startswith('avatars/'):
            uploaded_image_url = url_for('static', filename=avatar_url)
        else:
            uploaded_image_url = avatar_url  # صورة من خارج المشروع

        cursor.close()
        conn.close()
        

        return render_template("profile_edit.html",
                name=name,
                email=email,
                avatar_url=avatar_url,
                uploaded_image_url=uploaded_image_url if 'avatars/' in avatar_url else None)

    except Exception as e:
        return render_template("profile_edit_failed.html")




UPLOAD_FOLDER = 'static/avatars'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/profile-edit-verification', methods=['GET', 'POST'])
def profile_edit_verification():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')  # optional
        governorate = request.form.get('governorate')
        avatar_url = request.form.get('selected_avatar')  # الافتراضي

        uploaded_file = request.files.get('avatar_file')

        # لو رفع صورة بنفسه
        if uploaded_file and uploaded_file.filename != '' and allowed_file(uploaded_file.filename):
            filename = secure_filename(uploaded_file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            uploaded_file.save(filepath)
            avatar_url = f"/static/uploads/{filename}"  # يتم تحديث رابط الصورة في قاعدة البيانات

        try:
            conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1111",
                database="swatly"
            )
            cursor = conn.cursor()

            if password:
                hashed_pw = generate_password_hash(password)
                cursor.execute("""
                    UPDATE users SET name = %s, email = %s, password = %s, avatar_url = %s WHERE id = %s
                """, (name, email, hashed_pw, avatar_url, session['user_id']))

                cursor.execute("""
                    UPDATE cards_data SET user_name = %s WHERE user_id = %s
                """, (name, session['user_id']))

                cursor.execute("""
                    UPDATE notifications SET reciever = %s WHERE reciever_id = %s
                """, (name, session['user_id']))
                
                cursor.execute("""
                    UPDATE votes SET user_name = %s WHERE user_id = %s
                """, (name, session['user_id']))

                cursor.execute("""
                    UPDATE comments SET user_name = %s WHERE user_id = %s
                """, (name, session['user_id']))
            else:
                cursor.execute("""
                    UPDATE users SET name = %s, email = %s, avatar_url = %s WHERE id = %s
                """, (name, email,avatar_url, session['user_id']))

                cursor.execute("""
                    UPDATE cards_data SET user_name = %s WHERE user_id = %s
                """, (name, session['user_id']))

                cursor.execute("""
                    UPDATE notifications SET reciever = %s WHERE reciever_id = %s
                """, (name, session['user_id']))

                cursor.execute("""
                    UPDATE votes SET user_name = %s WHERE user_id = %s
                """, (name, session['user_id']))

                cursor.execute("""
                    UPDATE comments SET user_name = %s WHERE user_id = %s
                """, (name, session['user_id']))

            conn.commit()
            cursor.close()
            conn.close()
            return render_template("profile_edits_success.html")

        except Exception as e:
            return render_template("profile_edits_failed.html")

    return render_template("profile_edit.html")



@app.route('/notifications', methods=['GET', 'POST'])
def notifications():
    user_id = session.get("user_id")
    user_name = session.get("username")

    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="1111",
        database="swatly"
    )

    cursor = conn.cursor(dictionary=True)

    # جلب الإشعارات
    cursor.execute(
        "SELECT message, is_read, created_at FROM notifications WHERE reciever = %s ORDER BY created_at DESC",
        (user_name,)
    )
    notifications = cursor.fetchall()

    for notification in notifications:
        created_time = notification['created_at']
        now = datetime.now()
        diff = now - created_time

        seconds = diff.total_seconds()
        if seconds < 60:
            notification['time_ago'] = f"منذ {int(seconds)} ثانية"
        elif seconds < 3600:
            minutes = int(seconds // 60)
            notification['time_ago'] = f"منذ {minutes} دقيقة"
        elif seconds < 86400:
            hours = int(seconds // 3600)
            notification['time_ago'] = f"منذ {hours} ساعة"
        else:
            days = int(seconds // 86400)
            notification['time_ago'] = f"منذ {days} يوم"

    cursor.execute(
        "UPDATE notifications SET is_read = TRUE WHERE reciever = %s",
        (user_name,)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return render_template('user-notifications.html', notifications=notifications)


if __name__ == '__main__':
    app.run(debug=True)
