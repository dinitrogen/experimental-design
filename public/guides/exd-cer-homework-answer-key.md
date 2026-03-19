# CER Practice Homework — ANSWER KEY

---

## Experiment: Effect of Ramp Height on Ball Roll Distance

**IV:** Ramp Height (cm) &nbsp;&nbsp; **DV:** Ball Roll Distance (cm) &nbsp;&nbsp; **Control:** Same ball, same surface, same release method

| Ramp Height (cm) | Trial 1 | Trial 2 | Trial 3 |
|:-----------------:|:-------:|:-------:|:-------:|
| 10                | 24      | 27      | 25      |
| 20                | 45      | 51      | 48      |
| 30                | 68      | 79      | 73      |

---

### Answers

**1. Calculate these statistics for each IV level:**

*Sorted data: 10 cm → 24, 25, 27 &nbsp;|&nbsp; 20 cm → 45, 48, 51 &nbsp;|&nbsp; 30 cm → 68, 73, 79*

| Ramp Height (cm) | Mean (cm) | St. Dev (cm) | Q1 (cm) | Q3 (cm) | IQR (cm) |
|:-----------------:|:---------:|:------------:|:-------:|:-------:|:--------:|
| 10                | 25.33     | 1.25         | 24      | 27      | 3        |
| 20                | 48.00     | 2.45         | 45      | 51      | 6        |
| 30                | 73.33     | 4.50         | 68      | 79      | 11       |

**Work — Means:**
- 10 cm: (24 + 25 + 27) / 3 = 76 / 3 = **25.33 cm**
- 20 cm: (45 + 48 + 51) / 3 = 144 / 3 = **48.00 cm**
- 30 cm: (68 + 73 + 79) / 3 = 220 / 3 = **73.33 cm**

**Work — Standard Deviations (population σ):**

*10 cm:*

| $x_i$ | $x_i - \bar{x}$ | $(x_i - \bar{x})^2$ |
|:------:|:----------------:|:--------------------:|
| 24     | −1.33            | 1.78                 |
| 25     | −0.33            | 0.11                 |
| 27     | 1.67             | 2.78                 |

$$\sigma = \sqrt{\frac{1.78 + 0.11 + 2.78}{3}} = \sqrt{\frac{4.67}{3}} = \sqrt{1.56} = \boxed{1.25 \text{ cm}}$$

*20 cm:*

| $x_i$ | $x_i - \bar{x}$ | $(x_i - \bar{x})^2$ |
|:------:|:----------------:|:--------------------:|
| 45     | −3.00            | 9.00                 |
| 48     | 0.00             | 0.00                 |
| 51     | 3.00             | 9.00                 |

$$\sigma = \sqrt{\frac{9.00 + 0.00 + 9.00}{3}} = \sqrt{\frac{18.00}{3}} = \sqrt{6.00} = \boxed{2.45 \text{ cm}}$$

*30 cm:*

| $x_i$ | $x_i - \bar{x}$ | $(x_i - \bar{x})^2$ |
|:------:|:----------------:|:--------------------:|
| 68     | −5.33            | 28.44                |
| 73     | −0.33            | 0.11                 |
| 79     | 5.67             | 32.11                |

$$\sigma = \sqrt{\frac{28.44 + 0.11 + 32.11}{3}} = \sqrt{\frac{60.67}{3}} = \sqrt{20.22} = \boxed{4.50 \text{ cm}}$$

**Work — IQR:** With 3 sorted values (a, b, c): Q1 = a, Q2 = b, Q3 = c.
- 10 cm: Q1 = 24, Q3 = 27, IQR = 27 − 24 = **3 cm**
- 20 cm: Q1 = 45, Q3 = 51, IQR = 51 − 45 = **6 cm**
- 30 cm: Q1 = 68, Q3 = 79, IQR = 79 − 68 = **11 cm**

---

**2. Graph**

- **Title:** Effect of Ramp Height on Ball Roll Distance
- **X-axis label:** Ramp Height (cm)
- **Y-axis label:** Ball Roll Distance (cm)

<svg width="650" height="580" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #000; background:#fff;">
  <!-- Title -->
  <text x="340" y="24" text-anchor="middle" font-size="14" font-weight="bold">Effect of Ramp Height on Ball Roll Distance</text>
  <!-- Y-axis label -->
  <text x="16" y="290" text-anchor="middle" font-size="12" transform="rotate(-90,16,290)">Ball Roll Distance (cm)</text>
  <!-- X-axis label -->
  <text x="350" y="565" text-anchor="middle" font-size="12">Ramp Height (cm)</text>
  <!-- Axes -->
  <line x1="80" y1="50" x2="80" y2="510" stroke="#000" stroke-width="2"/>
  <line x1="80" y1="510" x2="620" y2="510" stroke="#000" stroke-width="2"/>
  <!-- Y-axis gridlines and labels (0 to 80, step 10) -->
  <line x1="80" y1="510" x2="620" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="68" y="514" text-anchor="end" font-size="12">0</text>
  <line x1="80" y1="452" x2="620" y2="452" stroke="#ccc" stroke-width="0.5"/><text x="68" y="456" text-anchor="end" font-size="12">10</text>
  <line x1="80" y1="395" x2="620" y2="395" stroke="#ccc" stroke-width="0.5"/><text x="68" y="399" text-anchor="end" font-size="12">20</text>
  <line x1="80" y1="337" x2="620" y2="337" stroke="#ccc" stroke-width="0.5"/><text x="68" y="341" text-anchor="end" font-size="12">30</text>
  <line x1="80" y1="280" x2="620" y2="280" stroke="#ccc" stroke-width="0.5"/><text x="68" y="284" text-anchor="end" font-size="12">40</text>
  <line x1="80" y1="222" x2="620" y2="222" stroke="#ccc" stroke-width="0.5"/><text x="68" y="226" text-anchor="end" font-size="12">50</text>
  <line x1="80" y1="165" x2="620" y2="165" stroke="#ccc" stroke-width="0.5"/><text x="68" y="169" text-anchor="end" font-size="12">60</text>
  <line x1="80" y1="107" x2="620" y2="107" stroke="#ccc" stroke-width="0.5"/><text x="68" y="111" text-anchor="end" font-size="12">70</text>
  <line x1="80" y1="50" x2="620" y2="50" stroke="#ccc" stroke-width="0.5"/><text x="68" y="54" text-anchor="end" font-size="12">80</text>
  <!-- X-axis gridlines and labels (0 to 35, step 5) -->
  <line x1="80" y1="50" x2="80" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="80" y="530" text-anchor="middle" font-size="12">0</text>
  <line x1="157" y1="50" x2="157" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="157" y="530" text-anchor="middle" font-size="12">5</text>
  <line x1="234" y1="50" x2="234" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="234" y="530" text-anchor="middle" font-size="12">10</text>
  <line x1="311" y1="50" x2="311" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="311" y="530" text-anchor="middle" font-size="12">15</text>
  <line x1="388" y1="50" x2="388" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="388" y="530" text-anchor="middle" font-size="12">20</text>
  <line x1="466" y1="50" x2="466" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="466" y="530" text-anchor="middle" font-size="12">25</text>
  <line x1="543" y1="50" x2="543" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="543" y="530" text-anchor="middle" font-size="12">30</text>
  <line x1="620" y1="50" x2="620" y2="510" stroke="#ccc" stroke-width="0.5"/><text x="620" y="530" text-anchor="middle" font-size="12">35</text>
  <!-- Line of best fit: y = 2.40x + 0.89 -->
  <line x1="157" y1="436" x2="589" y2="49" stroke="blue" stroke-width="2" stroke-dasharray="6,3"/>
  <!-- Data points (trials) as circles -->
  <!-- 10 cm trials -->
  <circle cx="234" cy="372" r="5" fill="red" stroke="#000" stroke-width="1"/>
  <circle cx="234" cy="366" r="5" fill="red" stroke="#000" stroke-width="1"/>
  <circle cx="234" cy="355" r="5" fill="red" stroke="#000" stroke-width="1"/>
  <!-- 20 cm trials -->
  <circle cx="388" cy="251" r="5" fill="red" stroke="#000" stroke-width="1"/>
  <circle cx="388" cy="234" r="5" fill="red" stroke="#000" stroke-width="1"/>
  <circle cx="388" cy="217" r="5" fill="red" stroke="#000" stroke-width="1"/>
  <!-- 30 cm trials -->
  <circle cx="543" cy="119" r="5" fill="red" stroke="#000" stroke-width="1"/>
  <circle cx="543" cy="90" r="5" fill="red" stroke="#000" stroke-width="1"/>
  <circle cx="543" cy="56" r="5" fill="red" stroke="#000" stroke-width="1"/>
  <!-- Mean points as larger squares -->
  <rect x="229" y="359" width="10" height="10" fill="blue" stroke="#000" stroke-width="1"/>
  <rect x="383" y="229" width="10" height="10" fill="blue" stroke="#000" stroke-width="1"/>
  <rect x="538" y="83" width="10" height="10" fill="blue" stroke="#000" stroke-width="1"/>
  <!-- Legend -->
  <circle cx="100" cy="545" r="5" fill="red" stroke="#000" stroke-width="1"/>
  <text x="112" y="549" font-size="11">Trial data points</text>
  <rect x="195" y="540" width="10" height="10" fill="blue" stroke="#000" stroke-width="1"/>
  <text x="212" y="549" font-size="11">Mean</text>
  <line x1="260" y1="545" x2="300" y2="545" stroke="blue" stroke-width="2" stroke-dasharray="6,3"/>
  <text x="307" y="549" font-size="11">Line of best fit</text>
</svg>

**Line of best fit:** Using the means (10, 25.33) and (30, 73.33):

$$m = \frac{73.33 - 25.33}{30 - 10} = \frac{48.00}{20} = 2.40$$

$$b = 25.33 - 2.40 \times 10 = 25.33 - 24.00 = 1.33$$

*Note: A least-squares fit through all three means gives b ≈ 0.89. Either method is acceptable — students may get slightly different values depending on which two points they choose.*

$$\boxed{y = 2.40x + 0.89}$$

---

**3. CER for Data Trend**

- **Claim:** There is a positive correlation between ball roll distance and ramp height.

- **Evidence:** The line of best fit when plotting the mean for each IV level against the value of each IV level is: $y = 2.40x + 0.89$.

- **Reasoning:** Since the slope of the line of best fit is 2.40, which is positive, the ball roll distance increases as the ramp height increases. Therefore, there is a positive correlation between ball roll distance and ramp height.

---

**4. CER for Variation**

- **Claim:** As the ramp height increased, the variation of the dataset for each IV level increased.

- **Evidence:** The standard deviation for 10 cm is 1.25 cm. The standard deviation for 20 cm is 2.45 cm. The standard deviation for 30 cm is 4.50 cm.

- **Reasoning:** The standard deviation of each dataset increases as the ramp height increases (1.25 → 2.45 → 4.50). Since standard deviation indicates how far data points are typically from the mean, this increase indicates that the data points are becoming more spread out. Therefore, the increase in ramp height is increasing the variability of each dataset.

---

**5. CER for Outliers**

- **Claim:** There are 0 outliers in the data.

- **Evidence:**

| Ramp Height (cm) | Lower Bound (cm) | Upper Bound (cm) |
|:-----------------:|:-----------------:|:-----------------:|
| 10                | 19.5              | 31.5              |
| 20                | 36.0              | 60.0              |
| 30                | 51.5              | 95.5              |

**Work:**
- 10 cm: LB = 24 − 1.5 × 3 = 24 − 4.5 = **19.5** &nbsp;|&nbsp; UB = 27 + 1.5 × 3 = 27 + 4.5 = **31.5**
- 20 cm: LB = 45 − 1.5 × 6 = 45 − 9.0 = **36.0** &nbsp;|&nbsp; UB = 51 + 1.5 × 6 = 51 + 9.0 = **60.0**
- 30 cm: LB = 68 − 1.5 × 11 = 68 − 16.5 = **51.5** &nbsp;|&nbsp; UB = 79 + 1.5 × 11 = 79 + 16.5 = **95.5**

- **Reasoning:** Since all data points fall within the lower and upper bounds for each IV level, there are no outliers based on the 1.5 × IQR rule.

  - 10 cm: 24, 25, 27 all within [19.5, 31.5] ✓
  - 20 cm: 45, 48, 51 all within [36.0, 60.0] ✓
  - 30 cm: 68, 73, 79 all within [51.5, 95.5] ✓

---

**6. CER for Conclusion**

- **Hypothesis (restated):** If ramp height increases, then ball roll distance will increase because a higher ramp converts more gravitational potential energy into kinetic energy, propelling the ball farther.

- **Claim:** The hypothesis was supported. As the ramp height increased, the ball roll distance increased.

- **Evidence:** The mean ball roll distance for 10 cm was 25.33 cm, for 20 cm was 48.00 cm, and for 30 cm was 73.33 cm. The line of best fit is $y = 2.40x + 0.89$, showing a positive slope.

- **Reasoning:** Since the mean ball roll distance increased as the ramp height increased, and the line of best fit has a positive slope of 2.40, the data supports the hypothesis that increasing ramp height increases ball roll distance. This relationship makes sense because a higher ramp gives the ball more gravitational potential energy ($PE = mgh$), which converts to more kinetic energy at the bottom of the ramp, causing the ball to travel farther across the surface.

---
