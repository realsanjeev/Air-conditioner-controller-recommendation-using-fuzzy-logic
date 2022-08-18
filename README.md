## Air-conditioner-controller-recommendation-using-fuzzy-logic


Importing libraries
```markdown
import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl
```
Initialize the fuzzy variable responsible for representing input set and output set
```markdown
# Antecedents
temp= ctrl.Antecedent(np.arange(0, 41), 'temperature')
hum = ctrl.Antecedent(np.arange(0, 101), 'humidity')

# Consequents
cmd = ctrl.Consequent(np.arange(15, 27), 'command')
```
```markdown
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
# Enter values to test
def inputValue():
    temperature_value = float(input("Enter temperature: "))

    while temperature_value < 0 or temperature_value > 40:
        try:
            temperature_value = float(input("Please choose a number between 0 and 40 "))
        except ValueError:
            print('We expect you to enter a valid integer')

    humidity_value = float(input("Enter humidity: "))

    while humidity_value < 0 or humidity_value > 100:
        try:
            humidity_value = float(input("Please choose a number between 0 and 100 "))
        except ValueError:
            print('We expect you to enter a valid integer')

    return temperature_value, humidity_value

def generateOutput(temperature_value, humidity_value):
    cmd_output.input['temperature'] = temperature_value
    cmd_output.input['humidity'] = humidity_value

    cmd_output.compute()
    # Print output command and plots
    print("Command is defined between 15 y 26")
    re_temp = round(cmd_output.output['command'], 1)
    if (cmd_output.output['command'] > 20):
        return 'Warm up', re_temp
    elif (cmd_output.output['command'] < 20 and cmd_output.output['command'] > 18):
        return 'No change', re_temp
    else:
        return 'Cool Up', re_temp
```

