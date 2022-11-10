from flask import Flask, render_template, request
import control
app = Flask(__name__)
@app.route('/', methods=['GET', 'POST'])
def commandControl():
    result = ''
    if request.method == 'POST':
        temperature_value = int(request.form['temp'])
        humidity_value = int(request.form['humidity'])
        print(temperature_value, humidity_value)
        fuzzy_out, crips_out = control.generateOutput(temperature_value, humidity_value)
        print(temperature_value, humidity_value)
        result = f'''The system recommends to change command to {fuzzy_out} 
                    and set temperature at {crips_out}'''

    return render_template('index.html', result=result)

if __name__ == '__main__':
    app.run(debug=True)