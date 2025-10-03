from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('pop.html')

@app.route('/map')
def map_view():
    return render_template('layout.html')

if __name__ == '__main__':
    app.run(debug=True)