# Parachute Drop Practice Event — ANSWER KEY

---

## Table of Contents

- [Experiment A: Effect of Canopy Diameter on Drop Time](#experiment-a-effect-of-canopy-diameter-on-parachute-drop-time)
- [Experiment B: Effect of Payload Mass on Drop Time](#experiment-b-effect-of-payload-mass-on-parachute-drop-time)

---

## Experiment A: Effect of Canopy Diameter on Parachute Drop Time

**IV:** Canopy Diameter (cm) &nbsp;&nbsp; **DV:** Drop Time (sec) &nbsp;&nbsp; **Constants:** Same payload (1 binder clip), same drop height (1.5 m), same string length, same release method

| Canopy Diameter (cm) | Trial 1 | Trial 2 | Trial 3 |
|:---------------------:|:-------:|:-------:|:-------:|
| 10                    | 0.82    | 0.78    | 0.85    |
| 20                    | 1.14    | 1.21    | 1.08    |
| 30                    | 1.63    | 1.71    | 1.55    |
| 40                    | 2.24    | 2.35    | 2.18    |

---

### Answers

**1. Calculate these statistics for each IV level:**

*Sorted data: 10 cm → 0.78, 0.82, 0.85 &nbsp;|&nbsp; 20 cm → 1.08, 1.14, 1.21 &nbsp;|&nbsp; 30 cm → 1.55, 1.63, 1.71 &nbsp;|&nbsp; 40 cm → 2.18, 2.24, 2.35*

| Canopy Diameter (cm) | Mean (sec) | St. Dev (sec) | Q1 (sec) | Q3 (sec) | IQR (sec) |
|:---------------------:|:----------:|:-------------:|:--------:|:--------:|:---------:|
| 10                    | 0.82       | 0.03          | 0.78     | 0.85     | 0.07      |
| 20                    | 1.14       | 0.05          | 1.08     | 1.21     | 0.13      |
| 30                    | 1.63       | 0.07          | 1.55     | 1.71     | 0.16      |
| 40                    | 2.26       | 0.07          | 2.18     | 2.35     | 0.17      |

**Work — Means:**
- 10 cm: (0.78 + 0.82 + 0.85) / 3 = 2.45 / 3 = **0.82 sec**
- 20 cm: (1.08 + 1.14 + 1.21) / 3 = 3.43 / 3 = **1.14 sec**
- 30 cm: (1.55 + 1.63 + 1.71) / 3 = 4.89 / 3 = **1.63 sec**
- 40 cm: (2.18 + 2.24 + 2.35) / 3 = 6.77 / 3 = **2.26 sec**

**Work — Standard Deviations (population σ):**

*10 cm:*

| $x_i$ | $x_i - \bar{x}$ | $(x_i - \bar{x})^2$ |
|:------:|:----------------:|:--------------------:|
| 0.78   | −0.04            | 0.0016               |
| 0.82   | 0.00             | 0.0000               |
| 0.85   | 0.03             | 0.0009               |

$$\sigma = \sqrt{\frac{0.0016 + 0.0000 + 0.0009}{3}} = \sqrt{\frac{0.0025}{3}} = \sqrt{0.0008} = \boxed{0.03 \text{ sec}}$$

*20 cm:*

| $x_i$ | $x_i - \bar{x}$ | $(x_i - \bar{x})^2$ |
|:------:|:----------------:|:--------------------:|
| 1.08   | −0.06            | 0.0036               |
| 1.14   | 0.00             | 0.0000               |
| 1.21   | 0.07             | 0.0049               |

$$\sigma = \sqrt{\frac{0.0036 + 0.0000 + 0.0049}{3}} = \sqrt{\frac{0.0085}{3}} = \sqrt{0.0028} = \boxed{0.05 \text{ sec}}$$

*30 cm:*

| $x_i$ | $x_i - \bar{x}$ | $(x_i - \bar{x})^2$ |
|:------:|:----------------:|:--------------------:|
| 1.55   | −0.08            | 0.0064               |
| 1.63   | 0.00             | 0.0000               |
| 1.71   | 0.08             | 0.0064               |

$$\sigma = \sqrt{\frac{0.0064 + 0.0000 + 0.0064}{3}} = \sqrt{\frac{0.0128}{3}} = \sqrt{0.0043} = \boxed{0.07 \text{ sec}}$$

*40 cm:*

| $x_i$ | $x_i - \bar{x}$ | $(x_i - \bar{x})^2$ |
|:------:|:----------------:|:--------------------:|
| 2.18   | −0.08            | 0.0064               |
| 2.24   | −0.02            | 0.0004               |
| 2.35   | 0.09             | 0.0081               |

$$\sigma = \sqrt{\frac{0.0064 + 0.0004 + 0.0081}{3}} = \sqrt{\frac{0.0149}{3}} = \sqrt{0.0050} = \boxed{0.07 \text{ sec}}$$

**Work — IQR:** With 3 sorted values (a, b, c): Q1 = a, Q2 = b, Q3 = c.
- 10 cm: Q1 = 0.78, Q3 = 0.85, IQR = 0.85 − 0.78 = **0.07 sec**
- 20 cm: Q1 = 1.08, Q3 = 1.21, IQR = 1.21 − 1.08 = **0.13 sec**
- 30 cm: Q1 = 1.55, Q3 = 1.71, IQR = 1.71 − 1.55 = **0.16 sec**
- 40 cm: Q1 = 2.18, Q3 = 2.35, IQR = 2.35 − 2.18 = **0.17 sec**

---

**2. Graph**

- **Title:** Effect of Canopy Diameter on Parachute Drop Time
- **X-axis label:** Canopy Diameter (cm)
- **Y-axis label:** Drop Time (sec)

<svg width="650" height="580" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #000; background:#fff;">
  <!-- Title -->
  <text x="340" y="24" text-anchor="middle" font-size="14" font-weight="bold">Effect of Canopy Diameter on Parachute Drop Time</text>
  <!-- Y-axis label -->
  <text x="16" y="290" text-anchor="middle" font-size="12" transform="rotate(-90,16,290)">Drop Time (sec)</text>
  <!-- X-axis label -->
  <text x="350" y="565" text-anchor="middle" font-size="12">Canopy Diameter (cm)</text>
  <!-- Axes -->
  <line x1="80" y1="50" x2="80" y2="510" stroke="#000" stroke-width="2"/>
  <line x1="80" y1="510" x2="620" y2="510" stroke="#000" stroke-width="2"/>
  <!-- Y-axis gridlines and labels (0 to 2.5, step 0.5) -->
  <line x1="80" y1="510" x2="620" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="68" y="514" text-anchor="end" font-size="12">0</text>
  <line x1="80" y1="418" x2="620" y2="418" stroke="#ccc" stroke-width="0.5"/><text x="68" y="422" text-anchor="end" font-size="12">0.5</text>
  <line x1="80" y1="326" x2="620" y2="326" stroke="#ccc" stroke-width="0.5"/><text x="68" y="330" text-anchor="end" font-size="12">1.0</text>
  <line x1="80" y1="234" x2="620" y2="234" stroke="#ccc" stroke-width="0.5"/><text x="68" y="238" text-anchor="end" font-size="12">1.5</text>
  <line x1="80" y1="142" x2="620" y2="142" stroke="#ccc" stroke-width="0.5"/><text x="68" y="146" text-anchor="end" font-size="12">2.0</text>
  <line x1="80" y1="50" x2="620" y2="50" stroke="#ccc" stroke-width="0.5"/><text x="68" y="54" text-anchor="end" font-size="12">2.5</text>
  <!-- X-axis gridlines and labels (0 to 50, step 10) -->
  <line x1="80" y1="50" x2="80" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="80" y="530" text-anchor="middle" font-size="12">0</text>
  <line x1="188" y1="50" x2="188" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="188" y="530" text-anchor="middle" font-size="12">10</text>
  <line x1="296" y1="50" x2="296" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="296" y="530" text-anchor="middle" font-size="12">20</text>
  <line x1="404" y1="50" x2="404" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="404" y="530" text-anchor="middle" font-size="12">30</text>
  <line x1="512" y1="50" x2="512" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="512" y="530" text-anchor="middle" font-size="12">40</text>
  <line x1="620" y1="50" x2="620" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="620" y="530" text-anchor="middle" font-size="12">50</text>
  <!-- Line of best fit: y = 0.048x + 0.34 -->
  <line x1="134" y1="403" x2="566" y2="50" stroke="blue" stroke-width="2" stroke-dasharray="6,3"/>
  <!-- Mean points plotted -->
  <!-- 10 cm mean = 0.82 -->
  <circle cx="188" cy="359" r="6" fill="red" stroke="#000" stroke-width="1"/>
  <!-- 20 cm mean = 1.14 -->
  <circle cx="296" cy="300" r="6" fill="red" stroke="#000" stroke-width="1"/>
  <!-- 30 cm mean = 1.63 -->
  <circle cx="404" cy="210" r="6" fill="red" stroke="#000" stroke-width="1"/>
  <!-- 40 cm mean = 2.26 -->
  <circle cx="512" cy="94" r="6" fill="red" stroke="#000" stroke-width="1"/>
  <!-- Legend -->
  <circle cx="100" cy="545" r="6" fill="red" stroke="#000" stroke-width="1"/>
  <text x="112" y="549" font-size="11">Mean drop time</text>
  <line x1="210" y1="545" x2="250" y2="545" stroke="blue" stroke-width="2" stroke-dasharray="6,3"/>
  <text x="257" y="549" font-size="11">Line of best fit</text>
</svg>

**Line of best fit:** Using the means (10, 0.82) and (40, 2.26):

$$m = \frac{2.26 - 0.82}{40 - 10} = \frac{1.44}{30} = 0.048$$

$$b = 0.82 - 0.048 \times 10 = 0.82 - 0.48 = 0.34$$

*Note: A least-squares fit through all four means gives b ≈ 0.26. Either method is acceptable — students may get slightly different values depending on which two points they choose.*

$$\boxed{y = 0.048x + 0.34}$$

---

**3. CER for Data Trend**

- **Claim:** There is a positive correlation between canopy diameter and drop time.

- **Evidence:** The line of best fit when plotting the mean drop time for each IV level against the canopy diameter is: $y = 0.048x + 0.34$.

- **Reasoning:** Since the slope of the line of best fit is 0.048, which is positive, the drop time increases as the canopy diameter increases. Therefore, there is a positive correlation between canopy diameter and drop time.

---

**4. CER for Variation**

- **Claim:** As the canopy diameter increased, the variation of the dataset for each IV level generally increased.

- **Evidence:** The standard deviation for 10 cm is 0.03 sec. The standard deviation for 20 cm is 0.05 sec. The standard deviation for 30 cm is 0.07 sec. The standard deviation for 40 cm is 0.07 sec.

- **Reasoning:** The standard deviation of each dataset generally increases as the canopy diameter increases (0.03 → 0.05 → 0.07 → 0.07). Since standard deviation indicates how far data points are typically from the mean, this increase indicates that the data points are becoming more spread out. The variation levels off between 30 cm and 40 cm, but the overall trend shows that increasing canopy diameter increases the variability of each dataset. This makes sense because larger parachutes are more affected by air currents and are harder to deploy consistently.

---

**5. CER for Outliers**

- **Claim:** There are 0 outliers in the data.

- **Evidence:**

| Canopy Diameter (cm) | Lower Bound (sec) | Upper Bound (sec) |
|:---------------------:|:------------------:|:------------------:|
| 10                    | 0.675              | 0.955              |
| 20                    | 0.885              | 1.405              |
| 30                    | 1.310              | 1.950              |
| 40                    | 1.925              | 2.605              |

**Work:**
- 10 cm: LB = 0.78 − 1.5 × 0.07 = 0.78 − 0.105 = **0.675** &nbsp;|&nbsp; UB = 0.85 + 1.5 × 0.07 = 0.85 + 0.105 = **0.955**
- 20 cm: LB = 1.08 − 1.5 × 0.13 = 1.08 − 0.195 = **0.885** &nbsp;|&nbsp; UB = 1.21 + 1.5 × 0.13 = 1.21 + 0.195 = **1.405**
- 30 cm: LB = 1.55 − 1.5 × 0.16 = 1.55 − 0.240 = **1.310** &nbsp;|&nbsp; UB = 1.71 + 1.5 × 0.16 = 1.71 + 0.240 = **1.950**
- 40 cm: LB = 2.18 − 1.5 × 0.17 = 2.18 − 0.255 = **1.925** &nbsp;|&nbsp; UB = 2.35 + 1.5 × 0.17 = 2.35 + 0.255 = **2.605**

- **Reasoning:** Since all data points fall within the lower and upper bounds for each IV level, there are no outliers based on the 1.5 × IQR rule.

  - 10 cm: 0.78, 0.82, 0.85 all within [0.675, 0.955] ✓
  - 20 cm: 1.08, 1.14, 1.21 all within [0.885, 1.405] ✓
  - 30 cm: 1.55, 1.63, 1.71 all within [1.310, 1.950] ✓
  - 40 cm: 2.18, 2.24, 2.35 all within [1.925, 2.605] ✓

---

**6. CER for Conclusion**

- **Hypothesis (restated):** If canopy diameter increases, then drop time will increase because a larger canopy creates more air resistance, slowing the parachute's descent.

- **Claim:** The hypothesis was supported. As the canopy diameter increased, the drop time increased.

- **Evidence:** The mean drop time for 10 cm was 0.82 sec, for 20 cm was 1.14 sec, for 30 cm was 1.63 sec, and for 40 cm was 2.26 sec. The line of best fit is $y = 0.048x + 0.34$, showing a positive slope.

- **Reasoning:** Since the mean drop time increased as the canopy diameter increased, and the line of best fit has a positive slope of 0.048, the data supports the hypothesis that increasing canopy diameter increases drop time. This relationship makes sense because a larger canopy has more surface area, which increases the drag force acting against gravity. More drag force means the parachute decelerates more, resulting in a slower fall. Based on these results, the engineering team should use a canopy diameter of at least 30–40 cm to maximize drop time and ensure a safe, slow descent for supply packages.

---
---

## Experiment B: Effect of Payload Mass on Parachute Drop Time

**IV:** Payload Mass (g) &nbsp;&nbsp; **DV:** Drop Time (sec) &nbsp;&nbsp; **Constants:** Same canopy (25 cm diameter), same string length (15 cm), same drop height (1.5 m), same release method

| Payload Mass (g) | Trial 1 | Trial 2 | Trial 3 |
|:-----------------:|:-------:|:-------:|:-------:|
| 10 (1 clip)       | 1.52    | 1.47    | 1.58    |
| 20 (2 clips)      | 1.21    | 1.28    | 1.18    |
| 30 (3 clips)      | 1.02    | 0.95    | 1.08    |

---

### Answers

**1. Calculate these statistics for each IV level:**

*Sorted data: 10 g → 1.47, 1.52, 1.58 &nbsp;|&nbsp; 20 g → 1.18, 1.21, 1.28 &nbsp;|&nbsp; 30 g → 0.95, 1.02, 1.08*

| Payload Mass (g) | Mean (sec) | St. Dev (sec) | Q1 (sec) | Q3 (sec) | IQR (sec) |
|:-----------------:|:----------:|:-------------:|:--------:|:--------:|:---------:|
| 10                | 1.52       | 0.05          | 1.47     | 1.58     | 0.11      |
| 20                | 1.22       | 0.04          | 1.18     | 1.28     | 0.10      |
| 30                | 1.02       | 0.05          | 0.95     | 1.08     | 0.13      |

**Work — Means:**
- 10 g: (1.47 + 1.52 + 1.58) / 3 = 4.57 / 3 = **1.52 sec**
- 20 g: (1.18 + 1.21 + 1.28) / 3 = 3.67 / 3 = **1.22 sec**
- 30 g: (0.95 + 1.02 + 1.08) / 3 = 3.05 / 3 = **1.02 sec**

**Work — Standard Deviations (population σ):**

*10 g:*

| $x_i$ | $x_i - \bar{x}$ | $(x_i - \bar{x})^2$ |
|:------:|:----------------:|:--------------------:|
| 1.47   | −0.05            | 0.0025               |
| 1.52   | 0.00             | 0.0000               |
| 1.58   | 0.06             | 0.0036               |

$$\sigma = \sqrt{\frac{0.0025 + 0.0000 + 0.0036}{3}} = \sqrt{\frac{0.0061}{3}} = \sqrt{0.0020} = \boxed{0.05 \text{ sec}}$$

*20 g:*

| $x_i$ | $x_i - \bar{x}$ | $(x_i - \bar{x})^2$ |
|:------:|:----------------:|:--------------------:|
| 1.18   | −0.04            | 0.0016               |
| 1.21   | −0.01            | 0.0001               |
| 1.28   | 0.06             | 0.0036               |

$$\sigma = \sqrt{\frac{0.0016 + 0.0001 + 0.0036}{3}} = \sqrt{\frac{0.0053}{3}} = \sqrt{0.0018} = \boxed{0.04 \text{ sec}}$$

*30 g:*

| $x_i$ | $x_i - \bar{x}$ | $(x_i - \bar{x})^2$ |
|:------:|:----------------:|:--------------------:|
| 0.95   | −0.07            | 0.0049               |
| 1.02   | 0.00             | 0.0000               |
| 1.08   | 0.06             | 0.0036               |

$$\sigma = \sqrt{\frac{0.0049 + 0.0000 + 0.0036}{3}} = \sqrt{\frac{0.0085}{3}} = \sqrt{0.0028} = \boxed{0.05 \text{ sec}}$$

**Work — IQR:** With 3 sorted values (a, b, c): Q1 = a, Q2 = b, Q3 = c.
- 10 g: Q1 = 1.47, Q3 = 1.58, IQR = 1.58 − 1.47 = **0.11 sec**
- 20 g: Q1 = 1.18, Q3 = 1.28, IQR = 1.28 − 1.18 = **0.10 sec**
- 30 g: Q1 = 0.95, Q3 = 1.08, IQR = 1.08 − 0.95 = **0.13 sec**

---

**2. Graph**

- **Title:** Effect of Payload Mass on Parachute Drop Time
- **X-axis label:** Payload Mass (g)
- **Y-axis label:** Drop Time (sec)

<svg width="650" height="580" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #000; background:#fff;">
  <!-- Title -->
  <text x="340" y="24" text-anchor="middle" font-size="14" font-weight="bold">Effect of Payload Mass on Parachute Drop Time</text>
  <!-- Y-axis label -->
  <text x="16" y="290" text-anchor="middle" font-size="12" transform="rotate(-90,16,290)">Drop Time (sec)</text>
  <!-- X-axis label -->
  <text x="350" y="565" text-anchor="middle" font-size="12">Payload Mass (g)</text>
  <!-- Axes -->
  <line x1="80" y1="50" x2="80" y2="510" stroke="#000" stroke-width="2"/>
  <line x1="80" y1="510" x2="620" y2="510" stroke="#000" stroke-width="2"/>
  <!-- Y-axis gridlines and labels (0 to 2.0, step 0.5) -->
  <line x1="80" y1="510" x2="620" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="68" y="514" text-anchor="end" font-size="12">0</text>
  <line x1="80" y1="395" x2="620" y2="395" stroke="#ccc" stroke-width="0.5"/><text x="68" y="399" text-anchor="end" font-size="12">0.5</text>
  <line x1="80" y1="280" x2="620" y2="280" stroke="#ccc" stroke-width="0.5"/><text x="68" y="284" text-anchor="end" font-size="12">1.0</text>
  <line x1="80" y1="165" x2="620" y2="165" stroke="#ccc" stroke-width="0.5"/><text x="68" y="169" text-anchor="end" font-size="12">1.5</text>
  <line x1="80" y1="50" x2="620" y2="50" stroke="#ccc" stroke-width="0.5"/><text x="68" y="54" text-anchor="end" font-size="12">2.0</text>
  <!-- X-axis gridlines and labels (0 to 40, step 10) -->
  <line x1="80" y1="50" x2="80" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="80" y="530" text-anchor="middle" font-size="12">0</text>
  <line x1="215" y1="50" x2="215" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="215" y="530" text-anchor="middle" font-size="12">10</text>
  <line x1="350" y1="50" x2="350" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="350" y="530" text-anchor="middle" font-size="12">20</text>
  <line x1="485" y1="50" x2="485" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="485" y="530" text-anchor="middle" font-size="12">30</text>
  <line x1="620" y1="50" x2="620" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="620" y="530" text-anchor="middle" font-size="12">40</text>
  <!-- Line of best fit: y = -0.025x + 1.77 -->
  <line x1="148" y1="132" x2="553" y2="304" stroke="blue" stroke-width="2" stroke-dasharray="6,3"/>
  <!-- Mean points plotted -->
  <!-- 10 g mean = 1.52 -->
  <circle cx="215" cy="160" r="6" fill="red" stroke="#000" stroke-width="1"/>
  <!-- 20 g mean = 1.22 -->
  <circle cx="350" cy="229" r="6" fill="red" stroke="#000" stroke-width="1"/>
  <!-- 30 g mean = 1.02 -->
  <circle cx="485" cy="275" r="6" fill="red" stroke="#000" stroke-width="1"/>
  <!-- Legend -->
  <circle cx="100" cy="545" r="6" fill="red" stroke="#000" stroke-width="1"/>
  <text x="112" y="549" font-size="11">Mean drop time</text>
  <line x1="210" y1="545" x2="250" y2="545" stroke="blue" stroke-width="2" stroke-dasharray="6,3"/>
  <text x="257" y="549" font-size="11">Line of best fit</text>
</svg>

**Line of best fit:** Using the means (10, 1.52) and (30, 1.02):

$$m = \frac{1.02 - 1.52}{30 - 10} = \frac{-0.50}{20} = -0.025$$

$$b = 1.52 - (-0.025) \times 10 = 1.52 + 0.25 = 1.77$$

$$\boxed{y = -0.025x + 1.77}$$

---

**3. CER for Data Trend**

- **Claim:** There is a negative correlation between payload mass and drop time.

- **Evidence:** The line of best fit when plotting the mean drop time for each IV level against the payload mass is: $y = -0.025x + 1.77$.

- **Reasoning:** Since the slope of the line of best fit is −0.025, which is negative, the drop time decreases as the payload mass increases. Therefore, there is a negative correlation between payload mass and drop time.

---

**4. CER for Variation**

- **Claim:** The variation of the dataset remained approximately constant across all IV levels.

- **Evidence:** The standard deviation for 10 g is 0.05 sec. The standard deviation for 20 g is 0.04 sec. The standard deviation for 30 g is 0.05 sec.

- **Reasoning:** The standard deviations are very similar across all three IV levels (0.05, 0.04, 0.05), showing no clear increasing or decreasing trend. Since standard deviation indicates how far data points are typically from the mean, these similar values indicate that the spread of the data was consistent regardless of payload mass. This suggests that the payload mass did not meaningfully affect the consistency of the parachute's performance — the variability was likely due to other factors such as minor differences in release technique.

---

**5. CER for Outliers**

- **Claim:** There are 0 outliers in the data.

- **Evidence:**

| Payload Mass (g) | Lower Bound (sec) | Upper Bound (sec) |
|:-----------------:|:------------------:|:------------------:|
| 10                | 1.305              | 1.745              |
| 20                | 1.030              | 1.430              |
| 30                | 0.755              | 1.275              |

**Work:**
- 10 g: LB = 1.47 − 1.5 × 0.11 = 1.47 − 0.165 = **1.305** &nbsp;|&nbsp; UB = 1.58 + 1.5 × 0.11 = 1.58 + 0.165 = **1.745**
- 20 g: LB = 1.18 − 1.5 × 0.10 = 1.18 − 0.150 = **1.030** &nbsp;|&nbsp; UB = 1.28 + 1.5 × 0.10 = 1.28 + 0.150 = **1.430**
- 30 g: LB = 0.95 − 1.5 × 0.13 = 0.95 − 0.195 = **0.755** &nbsp;|&nbsp; UB = 1.08 + 1.5 × 0.13 = 1.08 + 0.195 = **1.275**

- **Reasoning:** Since all data points fall within the lower and upper bounds for each IV level, there are no outliers based on the 1.5 × IQR rule.

  - 10 g: 1.47, 1.52, 1.58 all within [1.305, 1.745] ✓
  - 20 g: 1.18, 1.21, 1.28 all within [1.030, 1.430] ✓
  - 30 g: 0.95, 1.02, 1.08 all within [0.755, 1.275] ✓

---

**6. CER for Conclusion**

- **Hypothesis (restated):** If payload mass increases, then drop time will decrease because a heavier payload experiences a greater gravitational force, pulling the parachute down faster.

- **Claim:** The hypothesis was supported. As the payload mass increased, the drop time decreased.

- **Evidence:** The mean drop time for 10 g was 1.52 sec, for 20 g was 1.22 sec, and for 30 g was 1.02 sec. The line of best fit is $y = -0.025x + 1.77$, showing a negative slope.

- **Reasoning:** Since the mean drop time decreased as the payload mass increased, and the line of best fit has a negative slope of −0.025, the data supports the hypothesis that increasing payload mass decreases drop time. This relationship makes sense because a heavier payload increases the net downward force on the parachute system. While the drag force from the canopy remains the same (since canopy size was held constant), the gravitational force increases with mass, causing the system to reach a higher terminal velocity and fall faster. Based on these results, the engineering team should keep the payload as light as possible to maximize drop time and ensure a safe, slow descent for supply packages.

---
