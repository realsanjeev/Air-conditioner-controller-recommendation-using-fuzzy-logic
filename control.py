"""
This module provides fuzzy logic control using scikit-fuzzy library.

The module contains the following functions:

- input_value:
    Prompt the user to enter temperature and humidity values, and validate the inputs.
- generate_output
    Determine whether to 'Warm up', 'No change', or 'Cool down'
    based on the surrounding temperature and humidity.
"""
import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

# Antecedents
temp= ctrl.Antecedent(np.arange(0, 41), 'temperature')
hum = ctrl.Antecedent(np.arange(0, 101), 'humidity')

# Consequents
cmd = ctrl.Consequent(np.arange(15, 27), 'command')

# Temperature memberships
temp['coldest'] = fuzz.trapmf(temp.universe, [0, 4, 6, 8])
temp['cold'] = fuzz.trapmf(temp.universe, [6, 10, 12, 16])
temp['warm'] = fuzz.trapmf(temp.universe, [12, 16, 18, 24])
temp['hot'] = fuzz.trapmf(temp.universe, [18, 22, 24, 32])
temp['hottest'] = fuzz.trapmf(temp.universe, [24, 28, 30, 40])

# Humidity memberships
hum['low'] = fuzz.gaussmf(hum.universe, 0, 30) # 0,15
hum['optimal'] = fuzz.gaussmf(hum.universe, 50, 15) # 50, 15
hum['high'] = fuzz.gaussmf(hum.universe, 100, 50) # 100,15

# Command memberships
cmd['cool'] = fuzz.trimf(cmd.universe, [15, 17, 20])
cmd['warmup'] = fuzz.trimf(cmd.universe, [18, 20, 26])
# Rule system
# Rules for warming up
rule1 = ctrl.Rule(
    (temp['coldest'] & hum['low']) |
    (temp['coldest'] & hum['optimal']) |
    (temp['coldest'] & hum['high']) |
    (temp['cold'] & hum['low']) |
    (temp['cold'] & hum['optimal']) |
    (temp['warm'] & hum['low']), cmd['warmup'])

# Rules for cooling up
rule2 = ctrl.Rule(
    (temp['warm'] & hum['optimal']) |
    (temp['warm'] & hum['high']) |
    (temp['hot'] & hum['optimal']) |
    (temp['hot'] & hum['high']) |
    (temp['hottest'] & hum['low']) |
    (temp['hottest'] & hum['optimal']) |
    (temp['hottest'] & hum['high']), cmd['cool'])

# Control System Creation and Simulation
cmd_ctrl = ctrl.ControlSystem([rule1, rule2])
cmd_output = ctrl.ControlSystemSimulation(cmd_ctrl)

def input_value():
    """
    Prompt the user to enter temperature and humidity values, and validate the inputs.

    Returns:
        temperature_value: float
            The temperature value entered by the user.
        humidity_value: float
            The humidity value entered by the user.

    Raises:
        ValueError:
            If the user enters a non-numeric value or a value outside the expected range.
    """
    temperature_value = float(input("Enter temperature: "))
    humidity_value = float(input("Enter humidity: "))

    while temperature_value < 0 or temperature_value > 40:
        try:
            temperature_value = float(input("Please choose a number between 0 and 40 "))
        except ValueError:
            raise ValueError('Invalid temperature value. Please enter a number between 0 and 40.')

    while humidity_value < 0 or humidity_value > 100:
        try:
            humidity_value = float(input("Please choose a number between 0 and 100 "))
        except ValueError:
            raise ValueError('Invalid humidity value. Please enter a number between 0 and 100.')

    return temperature_value, humidity_value


def generate_output(temperature_value, humidity_value):
    """
    Determine whether to 'Warm up', 'No change', or 'Cool down'
    based on the surrounding temperature and humidity.

    Args:
        temperature_value: float
            The temperature in Celsius of the surrounding area.
        humidity_value: float
            The humidity in percentage of the surrounding area.

    Returns:
        command: str
            The command to take, which can be one of the following:
                - 'Warm up' if the temperature is too low and/or the humidity is too high.
                - 'No change' if the temperature and humidity are within acceptable ranges.
                - 'Cool down' if the temperature is too high.
    """
    cmd_output.input['temperature'] = temperature_value
    cmd_output.input['humidity'] = humidity_value

    cmd_output.compute()
    # Print output command and plots
    print("Command is defined between 15 and 26")
    re_temp = round(cmd_output.output['command'], 1)
    if cmd_output.output['command'] > 20:
        return 'Warm up', re_temp
    elif (cmd_output.output['command'] < 20 and cmd_output.output['command'] > 18):
        return 'No change', re_temp
    else:
        return 'Cool Up', re_temp

# cmd.view(sim=cmd_output)
# temp.view()
# hum.view()
