from flask import Flask, render_template
from dotenv import load_dotenv
import os

app = Flask(__name__)
load_dotenv()

@app.route('/')
def index():
    api_key = os.getenv('THUNDERFOREST_API_KEY')
    return render_template('layout.html', api_key=api_key)

if __name__ == '__main__':
    app.run(debug=True)