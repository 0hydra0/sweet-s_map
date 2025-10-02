from flask import Flask, render_template
import os
import traceback

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def index():
    try:
        api_key = os.getenv('THUNDERFOREST_API_KEY')
        if not api_key:
            raise ValueError("THUNDERFOREST_API_KEY not set in environment variables.")
        return render_template('layout.html', api_key=api_key)
    except Exception as e:
        error_message = f"Error: {str(e)}\n{traceback.format_exc()}"
        print(error_message)  # Logs to Vercel Function Logs
        return error_message, 500

if __name__ == '__main__':
    app.run(debug=True)