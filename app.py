# import necessary modules
from flask import Flask, render_template, request
import control

# create an instance of Flask class
app = Flask(__name__)

# define a route for the home page
@app.route('/', methods=['GET', 'POST'])
def home():
    return render_template('index.html')

# define a route for the home page
@app.route('/output', methods=['GET', 'POST'])
def commandControl():
    # initialize the result variable
    result = ''

    # check if the request method is POST
    if request.method == 'POST':
        # retrieve the temperature and humidity values from the form
        temperature_value = float(request.form['temp'])
        humidity_value = float(request.form['humidity'])

        # print the temperature and humidity values
        print(temperature_value, humidity_value)

        # use the control module to generate fuzzy and crisp outputs
        fuzzy_out, crips_out = control.generateOutput(temperature_value, humidity_value)

        # print the temperature and humidity values again
        print(temperature_value, humidity_value)

        # format the result message with the fuzzy and crisp outputs
        result = f'{fuzzy_out} '
        command = f'Set temperature at {crips_out}'

    # render the index.html template with the result variable
    return render_template('index.html',
                            temperature=temperature_value,
                            humidity=humidity_value,
                            result=result,
                            command=command)

# run the app in debug mode if this is the main module
if __name__ == '__main__':
    app.run(debug=True)
