from flask import Flask, render_template, redirect, url_for

app = Flask(__name__)

@app.route('/')
def index():
    # Redirect to pop.html if no userName in localStorage (handled client-side)
    return render_template('pop.html')

@app.route('/map')
def map():
    return render_template('layout.html')