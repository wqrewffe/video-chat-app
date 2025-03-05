from flask import Flask, render_template, request, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bone_exchange.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # elder or fresher
    contact = db.Column(db.String(120))

class Bone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    elder_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    booked_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    date_added = db.Column(db.DateTime, default=datetime.utcnow)
    date_booked = db.Column(db.DateTime)

@app.route('/')
def home():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user.role == 'elder':
            return redirect(url_for('elder_dashboard'))
        else:
            return redirect(url_for('fresher_dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username, password=password).first()
        if user:
            session['user_id'] = user.id
            return redirect(url_for('home'))
        return 'Invalid credentials'
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role']
        contact = request.form['contact']
        
        new_user = User(username=username, password=password, role=role, contact=contact)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/elder/dashboard')
def elder_dashboard():
    if 'user_id' not in session or User.query.get(session['user_id']).role != 'elder':
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    bones = Bone.query.filter_by(elder_id=user.id).all()
    return render_template('elder_dashboard.html', bones=bones)

@app.route('/fresher/dashboard')
def fresher_dashboard():
    if 'user_id' not in session or User.query.get(session['user_id']).role != 'fresher':
        return redirect(url_for('login'))
    
    available_bones = Bone.query.filter_by(booked_by=None).all()
    return render_template('fresher_dashboard.html', bones=available_bones)

@app.route('/add_bone', methods=['GET', 'POST'])
def add_bone():
    if 'user_id' not in session or User.query.get(session['user_id']).role != 'elder':
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        name = request.form['name']
        description = request.form['description']
        new_bone = Bone(name=name, description=description, elder_id=session['user_id'])
        db.session.add(new_bone)
        db.session.commit()
        return redirect(url_for('elder_dashboard'))
    return render_template('add_bone.html')

@app.route('/book_bone/<int:bone_id>')
def book_bone(bone_id):
    if 'user_id' not in session or User.query.get(session['user_id']).role != 'fresher':
        return redirect(url_for('login'))
    
    bone = Bone.query.get(bone_id)
    if bone and not bone.booked_by:
        bone.booked_by = session['user_id']
        bone.date_booked = datetime.utcnow()
        db.session.commit()
    return redirect(url_for('fresher_dashboard'))

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)