"""
This module initializes a Flask application and
imports the necessary modules for controlling the system.

Module level Variables:
- app: Flask object instance
- control: module for system control functions

Routes:
- /
- output
"""
from flask import Flask, render_template, request
import control

# create an instance of Flask class
app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def home():
    """
    Render the home page.

    This function defines a route for the home page,
    and renders the corresponding template, 'index.html'.

    Returns:
        html: str
            The rendered HTML content for the home page.
    """
    return render_template('index.html')


@app.route('/output', methods=['GET', 'POST'])
def command_control():
    """
    Determine the appropriate command to control a system based on inputs.

    This function takes inputs from a request,
    and determines the appropriate command to control a system.

    Returns:
        html: str
            The rendered HTML content for the output page.
    """

    # check if the request method is POST
    if request.method == 'POST':
        # retrieve the temperature and humidity values from the form
        temperature_value = float(request.form['temp'])
        humidity_value = float(request.form['humidity'])

        # print the temperature and humidity values
        print(temperature_value, humidity_value)

        # use the control module to generate fuzzy and crisp outputs
        fuzzy_out, crips_out = control.generate_output(temperature_value, humidity_value)

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
