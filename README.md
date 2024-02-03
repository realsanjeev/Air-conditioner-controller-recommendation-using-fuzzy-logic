## Air-conditioner-controller-recommendation-using-fuzzy-logic
### 1. First Method 
Install package from `requirements.txt`
```
pip install -r requirements.txt
````
OR
Install package separately
```
pip install flask
pip install scikit-fuzzy
```
Run the development environment
```
flask run
```
### 2. Second Method
```
docker build --tag python-docker .
docker run -d -p 5000:5000 python-docker
```
## Graph of membership of temperature and humidity
![humidity membership](https://user-images.githubusercontent.com/45820805/219877617-8b9d089c-0f3c-42e4-8aba-abf0c3c19f2e.png)
![temperature membership](https://user-images.githubusercontent.com/45820805/219877621-a31e0f00-5baa-4335-a4e4-d0aaf3f32fde.png)

Importing libraries
```python
import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl
```
Initialize the fuzzy variable responsible for representing input set and output set
```python
# Antecedents
temp= ctrl.Antecedent(np.arange(0, 41), 'temperature')
hum = ctrl.Antecedent(np.arange(0, 101), 'humidity')

# Consequents
cmd = ctrl.Consequent(np.arange(15, 27), 'command')
```
## Trapezoidal membership function
A trapezoidal membership function in fuzzy logic is a membership function that has four parameters: `a`, `b`, `c`, and `d`, where `a` and `d` are the lower and upper bounds of the variable's domain, and `b` and `c` are the values at which the membership function starts and stops increasing, respectively. The trapezoidal membership function looks like a trapezoid, where the left and right sides are defined by a and d, and the top is defined by `b` and `c`. The trapezoidal membership function is used to model variables that have a gradual transition from one membership grade to another, but that also have a plateau in the middle of their domain where the membership grade is high.

## Gaussian membership function
In fuzzy logic, the Gaussian or bell-shaped membership function is a commonly used function to represent the degree of membership of a value in a fuzzy set. The Gaussian function is defined as:

$μ(x) = e^{(-(\frac{x-c}{σ})^2)}$

where $c$ is the center of the curve and $σ$ is the standard deviation which controls the width of the curve.

The Gaussian function has a bell-shaped curve with a peak at $x = c$ and the curve decreases as the distance from the peak increases. The degree of membership of a value $x$ in a fuzzy set can be determined by evaluating the Gaussian function at $x$. The resulting value represents the degree of membership of $x$ in the fuzzy set.

The shape of the Gaussian function can be adjusted by changing the values of $c$ and $σ$. A smaller value of $σ$ results in a narrower peak, while a larger value of $σ$ results in a broader peak. The value of $c$ determines the location of the peak along the x-axis.

The Gaussian membership function is commonly used in fuzzy control systems, where it is used to represent the degree of membership of a variable in a set. It is also used in image processing, pattern recognition, and data analysis.

## Triangle membership function
In fuzzy logic, the triangle membership function is a type of membership function that is shaped like a triangle. It is commonly used to represent fuzzy sets where the membership values increase linearly from 0 to 1 and then decrease linearly from 1 to 0.

The triangle membership function is defined by three parameters: the lower bound $a$, the peak value $b$, and the upper bound $c$. It is given by the following formula:

$$
\begin{equation}
\mu(x)=\begin{cases}
0 & \text{if } x \leq a \newline
\dfrac{x-a}{b-a} & \text{if } a < x \leq b \newline
\dfrac{c-x}{c-b} & \text{if } b < x \leq c \newline
0 & \text{if } x > c
\end{cases}
\end{equation}
$$


Here, $\mu(x)$ represents the degree of membership of an input value $x$ in the fuzzy set. The function starts at 0 at $x=a$, rises linearly to 1 at $x=b$, and then falls linearly to 0 at $x=c$. The triangle membership function is symmetric around the peak value $b$.

The triangle membership function is commonly used in fuzzy logic controllers to represent linguistic variables, where the peak value $b$ represents the "typical" value of the variable and the bounds $a$ and $c$ represent the range of values where the variable is considered to be "low" or "high".
```python
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
```

```
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

## Contributing

Contributions are welcome! If you find any issues or want to add new features, feel free to submit a pull request.

## Contact Me

<table>
  <tr>
    <td><img src="https://github.com/realsanjeev/protfolio/blob/main/src/assets/images/instagram.png" alt="Instagram" width="50" height="50"></td>
    <td><img src="https://github.com/realsanjeev/protfolio/blob/main/src/assets/images/twitter.png" alt="Twitter" width="50" height="50"></td>
    <td><img src="https://github.com/realsanjeev/protfolio/blob/main/src/assets/images/github.png" alt="GitHub" width="50" height="50"></td>
    <td><img src="https://github.com/realsanjeev/protfolio/blob/main/src/assets/images/linkedin-logo.png" alt="LinkedIn" width="50" height="50"></td>
  </tr>
</table>
