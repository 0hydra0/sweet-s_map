from flask import Flask, render_template
from dotenv import load_dotenv
import os

app = Flask(__name__)
load_dotenv()

@app.route('/')
def index():
    return render_template('layout.html', THUNDERFOREST_API_KEY=os.getenv('THUNDERFOREST_API_KEY') or 'missing-api-key')