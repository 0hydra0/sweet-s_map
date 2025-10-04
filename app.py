from flask import Flask, render_template, send_from_directory

app = Flask(__name__, template_folder='templates', static_folder='static')

@app.route('/')
def index():
    return render_template('pop.html')

@app.route('/map')
def map_view():
    return render_template('layout.html')

@app.route('/chagename')
def chagename():
    return send_from_directory('templates', 'chagename.html')

# Vercel serverless WSGI handler
app = app